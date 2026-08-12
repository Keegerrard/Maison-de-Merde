/* =========================================================================
   Real vision analysis via OpenAI (GPT-4o-class vision model).

   Design notes:
   - Runs server-side only — the OPENAI_API_KEY never reaches the client.
   - The image is sent to OpenAI for this single inference call and is NOT
     stored by this service unless the user explicitly opts in (photo_kept
     column), matching the privacy commitments in the README.
   - The model is asked for strict JSON with a self-reported confidence.
     Anything below CONFIDENCE_THRESHOLD is withheld client-side rather
     than presented as a guess, same confidence-gating principle as the
     v1 heuristic — just backed by a real model instead of a color average.
   - This is explicitly framed to the model (and in turn to the user) as
     a pattern-recognition aid, never a diagnosis. See SYSTEM_PROMPT.
   ========================================================================= */

const CONFIDENCE_THRESHOLD = 0.4;
const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a visual pattern-recognition assistant embedded in a personal wellness-tracking app. A user has submitted a photo of a bowel movement for informational, non-diagnostic self-tracking purposes.

Analyze the image and respond with ONLY a JSON object (no markdown, no prose) matching this exact shape:
{
  "bristolTypeGuess": <integer 1-7 or null>,
  "colorGuess": <one of "brown","dark-brown","green","yellow","pale","black","red" or null>,
  "visibleFoodGuess": <boolean or null>,
  "notes": <short string, one sentence, or null>,
  "confidence": <float 0.0-1.0, your honest confidence in this overall assessment>
}

Rules:
- If the image does not clearly show what's being asked about, or is ambiguous, low-quality, or not actually this kind of photo, set fields to null and confidence to 0.
- Never provide medical diagnosis, disease names, or urgency levels — this is out of scope. If something looks like it could be blood (reddish streaks/spots) or is unusually dark/black, you may mention it factually in "notes" (e.g. "reddish streaks visible") but do not diagnose.
- Be conservative with confidence. Only use confidence above 0.6 when the image is clear and unambiguous.
- Respond with raw JSON only.`;

async function analyzePhoto(base64DataUrl) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is not configured on the server.");
    err.code = "NO_API_KEY";
    throw err;
  }

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this photo per the JSON schema in your instructions." },
          { type: "image_url", image_url: { url: base64DataUrl } },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0,
    response_format: { type: "json_object" },
  };

  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(`OpenAI API error (${resp.status}): ${text.slice(0, 300)}`);
    err.code = "UPSTREAM_ERROR";
    throw err;
  }

  const json = await resp.json();
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) {
    const err = new Error("OpenAI response had no content.");
    err.code = "EMPTY_RESPONSE";
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const err = new Error("Model response was not valid JSON.");
    err.code = "PARSE_ERROR";
    throw err;
  }

  const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
  if (confidence < CONFIDENCE_THRESHOLD) {
    return { withheld: true, confidence };
  }

  return {
    withheld: false,
    confidence,
    bristolTypeGuess: parsed.bristolTypeGuess ?? null,
    colorGuess: parsed.colorGuess ?? null,
    visibleFoodGuess: parsed.visibleFoodGuess ?? null,
    notes: parsed.notes ?? null,
  };
}

module.exports = { analyzePhoto, CONFIDENCE_THRESHOLD, OPENAI_MODEL };
