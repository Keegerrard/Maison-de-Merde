const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../auth");
const { analyzePhoto } = require("../vision");
const { rateLimit } = require("../rateLimit");

const router = express.Router();
router.use(requireAuth);

// 8MB cap, memory storage — the file is forwarded to OpenAI and discarded,
// never written to disk, matching the "photos aren't retained by default"
// commitment in the README.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// This is the one endpoint in the app that costs real money per call (an
// OpenAI API request every time) — everything else here was rate-limited
// for abuse/spam reasons, but this one was flat-out unmetered against your
// own OpenAI bill. 20/hour per IP is generous for a real user (a handful of
// photos per session) and blocks a runaway client loop or scripted abuse
// from burning through your API budget.
const visionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: "vision:analyze",
  message: "Too many photo analyses this hour. Try again later.",
});

router.post("/analyze", visionLimiter, upload.single("photo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No photo uploaded." });
  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "File must be an image." });
  }

  const base64DataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

  try {
    const result = await analyzePhoto(base64DataUrl);
    res.json(result);
  } catch (e) {
    console.error("vision analyze error", e);
    if (e.code === "NO_API_KEY") {
      return res.status(503).json({ error: "Photo analysis isn't configured yet (missing OPENAI_API_KEY on the server)." });
    }
    res.status(502).json({ error: "Photo analysis failed. Try again or skip the photo." });
  }
});

module.exports = router;
