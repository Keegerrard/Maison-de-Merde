/* =========================================================================
   Proshitute — client-side prototype
   All data lives in localStorage. No backend, no network calls, no accounts.
   Photos are analyzed locally (canvas pixel heuristics) and never uploaded.
   ========================================================================= */

const STORAGE_KEY = "proshitute_data_v1";

/* -------------------------------------------------------------------------
   Data model + persistence
   ------------------------------------------------------------------------- */

function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(aISO, bISO) {
  const a = new Date(aISO + "T00:00:00Z");
  const b = new Date(bISO + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

function defaultState() {
  return {
    profile: {
      name: "You",
      sessions: [],       // { id, timestamp (ISO datetime), analysis: {...} | null }
      grantedBadges: [],  // { id, unlockedAt }
      graceTokens: 1,
      streakFreezeUntil: null, // ISO date string; if set and >= today, streak isn't broken
      lastGraceGrantStreak: 0
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed.profile) return defaultState();
    return parsed;
  } catch (e) {
    console.warn("Failed to load state, resetting.", e);
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* -------------------------------------------------------------------------
   Streak engine (pure functions — see also test-streak.js for unit tests)
   ------------------------------------------------------------------------- */

/**
 * Given a list of ISO datetime strings (session timestamps) and available
 * grace tokens, compute { current, longest, tokensUsed }.
 * A day "counts" if it has >= 1 session, or if it's covered by a streak freeze.
 */
function calcStreak(sessionTimestamps, graceTokens, freezeUntilISO) {
  const uniqueDays = new Set(sessionTimestamps.map((t) => t.slice(0, 10)));
  if (uniqueDays.size === 0) return { current: 0, longest: 0, tokensUsed: 0 };

  const sortedDays = Array.from(uniqueDays).sort(); // ascending

  // Longest streak: scan all days, allow gaps of 1 day to be "free" only
  // if within actual logged pattern (we do NOT retroactively apply grace
  // tokens to historical longest-streak calc — grace tokens are a forward
  // looking, consumable mechanic tied to the *current* streak only).
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const gap = daysBetween(sortedDays[i - 1], sortedDays[i]);
    if (gap === 1) {
      run += 1;
    } else if (gap === 0) {
      // same day, shouldn't happen since Set, but guard anyway
      continue;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  // Current streak: walk backward from today.
  const today = todayISO();
  let tokensAvailable = graceTokens;
  let tokensUsed = 0;
  let current = 0;
  let cursor = today;

  // If today has no log yet, that's fine — streak isn't broken until the
  // day fully elapses. We just don't count today unless it has a session.
  while (true) {
    const hasSession = uniqueDays.has(cursor);
    const frozen = freezeUntilISO && cursor <= freezeUntilISO && cursor >= todayISO();
    if (hasSession) {
      current += 1;
      cursor = todayISO(new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000));
      continue;
    }
    if (cursor === today) {
      // today just hasn't happened yet — skip to yesterday without breaking streak
      cursor = todayISO(new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000));
      continue;
    }
    if (frozen) {
      cursor = todayISO(new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000));
      continue;
    }
    if (tokensAvailable > 0) {
      tokensAvailable -= 1;
      tokensUsed += 1;
      cursor = todayISO(new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000));
      continue;
    }
    break;
  }

  return { current, longest, tokensUsed };
}

function getStreakInfo(profile) {
  const timestamps = profile.sessions.map((s) => s.timestamp);
  return calcStreak(timestamps, profile.graceTokens, profile.streakFreezeUntil);
}

/** Earn 1 grace token every 14-day streak milestone, capped at 3. */
function maybeGrantGraceToken(profile) {
  const { current } = getStreakInfo(profile);
  const milestonesPassed = Math.floor(current / 14);
  const alreadyGranted = Math.floor(profile.lastGraceGrantStreak / 14);
  if (milestonesPassed > alreadyGranted && profile.graceTokens < 3) {
    profile.graceTokens = Math.min(3, profile.graceTokens + 1);
    profile.lastGraceGrantStreak = current;
    showToast("Streak milestone! +1 grace token 🛡️");
  }
}

/* -------------------------------------------------------------------------
   Achievements
   ------------------------------------------------------------------------- */

const BADGES = [
  { id: "milestone_first", icon: "🎉", name: "First Log", desc: "Logged your first session.",
    check: (p) => p.sessions.length >= 1 },
  { id: "streak_7", icon: "🔥", name: "Week Warrior", desc: "7-day streak.",
    check: (p) => getStreakInfo(p).longest >= 7 },
  { id: "streak_30", icon: "🔥🔥", name: "Month Machine", desc: "30-day streak.",
    check: (p) => getStreakInfo(p).longest >= 30 },
  { id: "streak_100", icon: "💯", name: "Centurion", desc: "100-day streak.",
    check: (p) => getStreakInfo(p).longest >= 100 },
  { id: "streak_365", icon: "🏆", name: "Year One", desc: "365-day streak.",
    check: (p) => getStreakInfo(p).longest >= 365 },
  { id: "completeness_10", icon: "📋", name: "Thorough", desc: "10 full analyses logged.",
    check: (p) => p.sessions.filter((s) => s.analysis).length >= 10 },
  { id: "completeness_50", icon: "📊", name: "Data Nerd", desc: "50 full analyses logged.",
    check: (p) => p.sessions.filter((s) => s.analysis).length >= 50 },
  { id: "milestone_100_sessions", icon: "💩", name: "Triple Digits", desc: "100 sessions logged.",
    check: (p) => p.sessions.length >= 100 },
  { id: "milestone_first_photo", icon: "📸", name: "Say Cheese", desc: "First AI-analyzed photo.",
    check: (p) => p.sessions.some((s) => s.analysis && s.analysis.aiSuggested) },
];

function checkAchievements(profile) {
  const newlyUnlocked = [];
  const unlockedIds = new Set(profile.grantedBadges.map((b) => b.id));
  for (const badge of BADGES) {
    if (!unlockedIds.has(badge.id) && badge.check(profile)) {
      profile.grantedBadges.push({ id: badge.id, unlockedAt: new Date().toISOString() });
      newlyUnlocked.push(badge);
    }
  }
  return newlyUnlocked;
}

/* -------------------------------------------------------------------------
   Photo heuristic analysis (v1 — NOT a trained model)
   Computes average color from the image and buckets it into a color
   category with a confidence score. Confidence-gated: low-confidence
   guesses are withheld, matching the product's disclosed AI methodology.
   ------------------------------------------------------------------------- */

function analyzeImageElement(imgEl) {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = 64);
  const h = (canvas.height = 64);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, w, h);
  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch (e) {
    return null; // e.g. tainted canvas from a cross-origin image
  }

  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n += 1;
  }
  r /= n; g /= n; b /= n;

  const brightness = (r + g + b) / 3;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  // Very rough hue-ish classification into clinical color buckets.
  let bucket, confidence;
  if (brightness < 55) {
    bucket = "black"; confidence = 0.6;
  } else if (brightness > 195 && saturation < 0.25) {
    bucket = "pale"; confidence = 0.55;
  } else if (r > g + 25 && r > b + 40 && g <= b + 10) {
    bucket = "red"; confidence = 0.5;
  } else if (g > r - 10 && g > b + 15) {
    bucket = "green"; confidence = 0.5;
  } else if (r > 150 && g > 120 && b < 100 && (r - b) < 90) {
    bucket = "yellow"; confidence = 0.45;
  } else if (brightness < 110) {
    bucket = "dark-brown"; confidence = 0.55;
  } else {
    bucket = "brown"; confidence = 0.65;
  }

  const CONFIDENCE_THRESHOLD = 0.4;
  if (confidence < CONFIDENCE_THRESHOLD) return null;

  return { colorGuess: bucket, confidence };
}

/* -------------------------------------------------------------------------
   Demo circle / leaderboard (seeded, deterministic — no backend)
   ------------------------------------------------------------------------- */

const DEMO_FRIENDS = [
  { name: "Marcus", avatar: "🧑", streak: 12, consistency: 0.86 },
  { name: "Priya", avatar: "👩", streak: 34, consistency: 0.93 },
  { name: "Deshawn", avatar: "🧑‍🦱", streak: 3, consistency: 0.51 },
  { name: "Yuki", avatar: "👨", streak: 21, consistency: 0.78 },
];

function buildLeaderboard(profile) {
  const { current, longest } = getStreakInfo(profile);
  const totalDaysTracked = Math.max(1, daysBetween(
    profile.sessions.length ? profile.sessions[0].timestamp.slice(0, 10) : todayISO(),
    todayISO()
  ) + 1);
  const uniqueDaysLogged = new Set(profile.sessions.map((s) => s.timestamp.slice(0, 10))).size;
  const consistency = Math.min(1, uniqueDaysLogged / totalDaysTracked);

  const rows = [
    { name: profile.name, avatar: "🫵", streak: current, longest, consistency, isMe: true },
    ...DEMO_FRIENDS.map((f) => ({ ...f, isMe: false })),
  ];

  // Rank by streak length first, consistency second — deliberately not by
  // raw session count, to avoid rewarding over-logging.
  rows.sort((a, b) => (b.streak - a.streak) || (b.consistency - a.consistency));
  return rows;
}

/* -------------------------------------------------------------------------
   UI wiring
   ------------------------------------------------------------------------- */

let pendingBristol = null;
let pendingSymptoms = new Set();
let pendingPhotoDataUrl = null;
let pendingAiSuggestion = null;

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${tabName}`));
  if (tabName === "dashboard") renderDashboard();
  if (tabName === "circle") renderCircle();
  if (tabName === "achievements") renderAchievements();
}

function persistAndRefresh() {
  maybeGrantGraceToken(state.profile);
  const unlocked = checkAchievements(state.profile);
  saveState(state);
  renderStreakPill();
  renderSessionList();
  unlocked.forEach((b) => showToast(`Achievement unlocked: ${b.icon} ${b.name}`));
}

function addSession(analysis) {
  state.profile.sessions.push({
    id: uid(),
    timestamp: new Date().toISOString(),
    analysis: analysis || null,
  });
  persistAndRefresh();
}

function renderStreakPill() {
  const { current } = getStreakInfo(state.profile);
  document.getElementById("streakCount").textContent = current;
}

function renderSessionList() {
  const list = document.getElementById("sessionList");
  const sessions = [...state.profile.sessions].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 15);
  if (sessions.length === 0) {
    list.innerHTML = `<div class="empty-state">No sessions logged yet.</div>`;
    return;
  }
  list.innerHTML = sessions.map((s) => {
    const d = new Date(s.timestamp);
    const time = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const tags = [];
    if (s.analysis) {
      tags.push(`<span class="tag">Type ${s.analysis.bristolType ?? "?"}</span>`);
      if (s.analysis.color) tags.push(`<span class="tag">${s.analysis.color}</span>`);
      if (s.analysis.bloodFlag) tags.push(`<span class="tag flag">blood flagged</span>`);
    } else {
      tags.push(`<span class="tag">quick log</span>`);
    }
    return `<div class="session-item"><span class="session-time">${time}</span><span class="session-tags">${tags.join("")}</span></div>`;
  }).join("");
}

function resetDetailForm() {
  pendingBristol = null;
  pendingSymptoms = new Set();
  pendingPhotoDataUrl = null;
  pendingAiSuggestion = null;
  document.querySelectorAll(".bristol-opt").forEach((b) => b.classList.remove("selected"));
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
  document.getElementById("analysisForm").reset();
  document.getElementById("photoPreviewWrap").classList.add("hidden");
  document.getElementById("aiSuggestion").classList.add("hidden");
}

function renderDashboard() {
  const { current, longest, tokensUsed } = getStreakInfo(state.profile);
  document.getElementById("statCurrentStreak").textContent = current;
  document.getElementById("statLongestStreak").textContent = longest;
  document.getElementById("statGraceTokens").textContent = state.profile.graceTokens;

  drawFrequencyChart();
  drawBristolChart();
}

function drawFrequencyChart() {
  const canvas = document.getElementById("freqChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(todayISO(new Date(Date.now() - i * 86400000)));
  }
  const counts = days.map((day) => state.profile.sessions.filter((s) => s.timestamp.startsWith(day)).length);
  const max = Math.max(1, ...counts);

  const barW = canvas.width / days.length;
  ctx.fillStyle = "#a5682a";
  counts.forEach((c, i) => {
    const h = (c / max) * (canvas.height - 20);
    ctx.fillRect(i * barW + 1, canvas.height - h, barW - 2, h);
  });
}

function drawBristolChart() {
  const canvas = document.getElementById("bristolChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const counts = new Array(7).fill(0);
  state.profile.sessions.forEach((s) => {
    if (s.analysis && s.analysis.bristolType) counts[s.analysis.bristolType - 1] += 1;
  });
  const max = Math.max(1, ...counts);
  const barW = canvas.width / 7;
  ctx.fillStyle = "#4fae72";
  counts.forEach((c, i) => {
    const h = (c / max) * (canvas.height - 30);
    ctx.fillRect(i * barW + 8, canvas.height - h - 16, barW - 16, h);
    ctx.fillStyle = "#93a1a6";
    ctx.font = "11px sans-serif";
    ctx.fillText(`Type ${i + 1}`, i * barW + 8, canvas.height - 2);
    ctx.fillStyle = "#4fae72";
  });
}

function renderCircle() {
  const rows = buildLeaderboard(state.profile);
  const el = document.getElementById("leaderboard");
  el.innerHTML = rows.map((r, i) => `
    <div class="leaderboard-row ${r.isMe ? "me" : ""}">
      <span class="rank">#${i + 1}</span>
      <span class="avatar">${r.avatar}</span>
      <span class="lb-name">${r.name}${r.isMe ? " (you)" : ""}</span>
      <span class="lb-stat">${r.streak}d streak · ${Math.round(r.consistency * 100)}% consistent</span>
    </div>
  `).join("");
}

function renderAchievements() {
  const grid = document.getElementById("badgeGrid");
  const unlockedIds = new Set(state.profile.grantedBadges.map((b) => b.id));
  grid.innerHTML = BADGES.map((b) => `
    <div class="badge ${unlockedIds.has(b.id) ? "unlocked" : ""}">
      <span class="badge-icon">${b.icon}</span>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
    </div>
  `).join("");
}

function exportSummary() {
  const p = state.profile;
  const { current, longest } = getStreakInfo(p);
  const total = p.sessions.length;
  const withAnalysis = p.sessions.filter((s) => s.analysis).length;
  const bristolCounts = new Array(7).fill(0);
  const flaggedSessions = [];
  p.sessions.forEach((s) => {
    if (s.analysis && s.analysis.bristolType) bristolCounts[s.analysis.bristolType - 1] += 1;
    if (s.analysis && (s.analysis.bloodFlag || s.analysis.pain === "severe")) {
      flaggedSessions.push(s);
    }
  });

  let out = `PROSHITUTE — SESSION SUMMARY (de-identified)\n`;
  out += `Generated: ${new Date().toLocaleString()}\n`;
  out += `================================================\n\n`;
  out += `Total sessions logged: ${total}\n`;
  out += `Sessions with full analysis: ${withAnalysis}\n`;
  out += `Current streak: ${current} days | Longest streak: ${longest} days\n\n`;
  out += `Bristol Type Distribution:\n`;
  bristolCounts.forEach((c, i) => { out += `  Type ${i + 1}: ${c}\n`; });
  out += `\nFlagged sessions (severe pain or blood reported): ${flaggedSessions.length}\n`;
  if (flaggedSessions.length) {
    flaggedSessions.forEach((s) => {
      out += `  - ${new Date(s.timestamp).toLocaleDateString()}: pain=${s.analysis.pain}, blood=${!!s.analysis.bloodFlag}\n`;
    });
  }
  out += `\nNote: this is a self-reported wellness summary, not a diagnosis. Share with a healthcare provider as context, not a conclusion.\n`;

  const blob = new Blob([out], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `proshitute-summary-${todayISO()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------
   Event listeners
   ------------------------------------------------------------------------- */

if (typeof document !== "undefined") {
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) switchTab(btn.dataset.tab);
  });

  document.getElementById("quickLogBtn").addEventListener("click", () => {
    addSession(null);
    showToast("Logged! 💩");
  });

  document.getElementById("detailedLogBtn").addEventListener("click", () => {
    document.getElementById("detailForm").classList.remove("hidden");
  });

  document.getElementById("cancelDetailBtn").addEventListener("click", () => {
    resetDetailForm();
    document.getElementById("detailForm").classList.add("hidden");
  });

  document.getElementById("bristolPicker").addEventListener("click", (e) => {
    const btn = e.target.closest(".bristol-opt");
    if (!btn) return;
    document.querySelectorAll(".bristol-opt").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    pendingBristol = Number(btn.dataset.value);
  });

  document.getElementById("symptomChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    chip.classList.toggle("selected");
    if (chip.classList.contains("selected")) pendingSymptoms.add(chip.dataset.value);
    else pendingSymptoms.delete(chip.dataset.value);
  });

  document.getElementById("photoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingPhotoDataUrl = reader.result;
      const img = document.getElementById("photoPreview");
      img.src = pendingPhotoDataUrl;
      document.getElementById("photoPreviewWrap").classList.remove("hidden");
      img.onload = () => {
        const result = analyzeImageElement(img);
        const suggestionEl = document.getElementById("aiSuggestion");
        if (result) {
          pendingAiSuggestion = result;
          suggestionEl.innerHTML = `<strong>Heuristic estimate (v1):</strong> color looks like "${result.colorGuess}" (confidence ${Math.round(result.confidence * 100)}%). This is a simple pixel-color heuristic, not a trained model — please confirm or correct the Color field above.`;
          suggestionEl.classList.remove("hidden");
          document.getElementById("colorSelect").value = result.colorGuess;
        } else {
          pendingAiSuggestion = null;
          suggestionEl.innerHTML = `Couldn't produce a confident estimate from this photo — please set Color manually.`;
          suggestionEl.classList.remove("hidden");
        }
      };
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("analysisForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const analysis = {
      bristolType: pendingBristol,
      color: document.getElementById("colorSelect").value,
      odor: document.getElementById("odorSelect").value,
      pain: document.getElementById("painSelect").value,
      visibleFood: document.getElementById("visibleFood").checked,
      bloodFlag: document.getElementById("bloodFlag").checked,
      symptoms: Array.from(pendingSymptoms),
      notes: document.getElementById("notesInput").value.trim(),
      aiSuggested: !!pendingAiSuggestion,
      photoKept: document.getElementById("keepPhoto").checked ? pendingPhotoDataUrl : null,
    };
    addSession(analysis);
    resetDetailForm();
    document.getElementById("detailForm").classList.add("hidden");
    showToast("Session saved 📋");
  });

  document.getElementById("freezeStreakBtn").addEventListener("click", () => {
    const days = prompt("Freeze your streak for how many days?", "3");
    const n = parseInt(days, 10);
    if (!n || n <= 0) return;
    const until = todayISO(new Date(Date.now() + n * 86400000));
    state.profile.streakFreezeUntil = until;
    saveState(state);
    renderDashboard();
    showToast(`Streak frozen through ${until}`);
  });

  document.getElementById("exportBtn").addEventListener("click", exportSummary);

  renderStreakPill();
  renderSessionList();
});
}

/* Expose pure functions for the Node-based unit tests (test-streak.js). */
if (typeof module !== "undefined") {
  module.exports = { calcStreak, checkAchievements, buildLeaderboard, BADGES };
}
