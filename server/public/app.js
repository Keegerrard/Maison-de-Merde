/* =========================================================================
   Proshitute — frontend, backed by the real API (server.js + src/routes/*).
   All state lives server-side now; this file just renders API responses
   and posts user actions. Auth is a cookie-based session (see src/auth.js).
   ========================================================================= */

const API = "/api";

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: "include",
    headers: opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    ...opts,
    body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* -------------------------------------------------------------------------
   Auth
   ------------------------------------------------------------------------- */

let currentUser = null;

async function checkAuth() {
  try {
    currentUser = await api("/auth/me");
    showApp();
  } catch (e) {
    showAuthScreen();
  }
}

function showAuthScreen() {
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function showApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  renderSessionList();
  renderStreakPill();
}

function switchAuthForm(which) {
  document.querySelectorAll(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.form === which));
  document.getElementById("loginForm").classList.toggle("hidden", which !== "login");
  document.getElementById("signupForm").classList.toggle("hidden", which !== "signup");
}

/* -------------------------------------------------------------------------
   Toast + tabs
   ------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------
   Log tab
   ------------------------------------------------------------------------- */

let pendingBristol = null;
let pendingSymptoms = new Set();
let pendingPhotoFile = null;
let pendingAiSuggestion = null;

function resetDetailForm() {
  pendingBristol = null;
  pendingSymptoms = new Set();
  pendingPhotoFile = null;
  pendingAiSuggestion = null;
  document.querySelectorAll(".bristol-opt").forEach((b) => b.classList.remove("selected"));
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
  document.getElementById("analysisForm").reset();
  document.getElementById("photoPreviewWrap").classList.add("hidden");
  document.getElementById("aiSuggestion").classList.add("hidden");
}

function handleUnlockedBadges(newlyUnlocked) {
  (newlyUnlocked || []).forEach((b) => showToast(`Achievement unlocked: ${b.icon} ${b.name}`));
}

async function renderStreakPill() {
  try {
    const data = await api("/dashboard");
    document.getElementById("streakCount").textContent = data.streak.current;
  } catch (e) { /* non-fatal */ }
}

async function renderSessionList() {
  const list = document.getElementById("sessionList");
  try {
    const { sessions } = await api("/sessions?limit=15");
    if (!sessions.length) {
      list.innerHTML = `<div class="empty-state">No sessions logged yet.</div>`;
      return;
    }
    list.innerHTML = sessions.map((s) => {
      const d = new Date(s.occurred_at);
      const time = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      const tags = [];
      if (s.bristol_type) {
        tags.push(`<span class="tag">Type ${s.bristol_type}</span>`);
        if (s.color) tags.push(`<span class="tag">${s.color}</span>`);
        if (s.blood_flag) tags.push(`<span class="tag flag">blood flagged</span>`);
      } else {
        tags.push(`<span class="tag">quick log</span>`);
      }
      return `<div class="session-item"><span class="session-time">${time}</span><span class="session-tags">${tags.join("")}</span></div>`;
    }).join("");
  } catch (e) {
    list.innerHTML = `<div class="empty-state">Couldn't load sessions.</div>`;
  }
}

/* -------------------------------------------------------------------------
   Dashboard tab
   ------------------------------------------------------------------------- */

async function renderDashboard() {
  let data;
  try {
    data = await api("/dashboard");
  } catch (e) {
    return showToast("Couldn't load dashboard.");
  }
  document.getElementById("statCurrentStreak").textContent = data.streak.current;
  document.getElementById("statLongestStreak").textContent = data.streak.longest;
  document.getElementById("statGraceTokens").textContent = data.graceTokens;

  drawFrequencyChart(data.frequency30d);
  drawBristolChart(data.bristolCounts);
}

function drawFrequencyChart(frequency30d) {
  const canvas = document.getElementById("freqChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const counts = frequency30d.map((d) => d.count);
  const max = Math.max(1, ...counts);
  const barW = canvas.width / counts.length;
  ctx.fillStyle = "#a5682a";
  counts.forEach((c, i) => {
    const h = (c / max) * (canvas.height - 20);
    ctx.fillRect(i * barW + 1, canvas.height - h, barW - 2, h);
  });
}

function drawBristolChart(bristolCounts) {
  const canvas = document.getElementById("bristolChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const max = Math.max(1, ...bristolCounts);
  const barW = canvas.width / 7;
  bristolCounts.forEach((c, i) => {
    const h = (c / max) * (canvas.height - 30);
    ctx.fillStyle = "#4fae72";
    ctx.fillRect(i * barW + 8, canvas.height - h - 16, barW - 16, h);
    ctx.fillStyle = "#93a1a6";
    ctx.font = "11px sans-serif";
    ctx.fillText(`Type ${i + 1}`, i * barW + 8, canvas.height - 2);
  });
}

/* -------------------------------------------------------------------------
   Circle tab
   ------------------------------------------------------------------------- */

async function renderCircle() {
  const el = document.getElementById("leaderboard");
  const reqEl = document.getElementById("friendRequests");
  try {
    const [{ leaderboard }, { requests }] = await Promise.all([
      api("/circle"),
      api("/circle/requests"),
    ]);

    reqEl.innerHTML = requests.map((r) => `
      <div class="friend-request-row">
        <span>${r.username} wants to be friends</span>
        <button class="btn btn-primary btn-small" data-accept="${r.id}">Accept</button>
      </div>
    `).join("");

    el.innerHTML = leaderboard.map((r, i) => `
      <div class="leaderboard-row ${r.isMe ? "me" : ""}">
        <span class="rank">#${i + 1}</span>
        <span class="avatar">${r.isMe ? "🫵" : "🧑"}</span>
        <span class="lb-name">${r.username}${r.isMe ? " (you)" : ""}</span>
        <span class="lb-stat">${r.streak}d streak · ${Math.round(r.consistency * 100)}% consistent</span>
      </div>
    `).join("");
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Couldn't load circle.</div>`;
  }
}

/* -------------------------------------------------------------------------
   Achievements tab
   ------------------------------------------------------------------------- */

async function renderAchievements() {
  const grid = document.getElementById("badgeGrid");
  try {
    const data = await api("/dashboard");
    grid.innerHTML = data.badges.map((b) => `
      <div class="badge ${b.unlocked ? "unlocked" : ""}">
        <span class="badge-icon">${b.icon}</span>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div>
      </div>
    `).join("");
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Couldn't load achievements.</div>`;
  }
}

/* -------------------------------------------------------------------------
   Wiring
   ------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  // Auth screen
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchAuthForm(tab.dataset.form));
  });

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("loginError");
    errEl.classList.add("hidden");
    try {
      currentUser = await api("/auth/login", {
        method: "POST",
        body: {
          username: document.getElementById("loginUsername").value.trim(),
          password: document.getElementById("loginPassword").value,
        },
      });
      showApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
    }
  });

  document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("signupError");
    errEl.classList.add("hidden");
    try {
      currentUser = await api("/auth/signup", {
        method: "POST",
        body: {
          username: document.getElementById("signupUsername").value.trim(),
          email: document.getElementById("signupEmail").value.trim(),
          password: document.getElementById("signupPassword").value,
        },
      });
      showApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await api("/auth/logout", { method: "POST" });
    currentUser = null;
    showAuthScreen();
  });

  // App tabs
  document.getElementById("tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) switchTab(btn.dataset.tab);
  });

  // Quick log
  document.getElementById("quickLogBtn").addEventListener("click", async () => {
    try {
      const result = await api("/sessions", { method: "POST", body: {} });
      showToast("Logged! 💩");
      handleUnlockedBadges(result.newlyUnlocked);
      renderSessionList();
      renderStreakPill();
    } catch (err) {
      showToast(err.message);
    }
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

  document.getElementById("photoInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingPhotoFile = file;

    const img = document.getElementById("photoPreview");
    img.src = URL.createObjectURL(file);
    document.getElementById("photoPreviewWrap").classList.remove("hidden");

    const suggestionEl = document.getElementById("aiSuggestion");
    suggestionEl.textContent = "Analyzing photo…";
    suggestionEl.classList.remove("hidden");

    try {
      const fd = new FormData();
      fd.append("photo", file);
      const result = await api("/vision/analyze", { method: "POST", body: fd });
      if (result.withheld) {
        pendingAiSuggestion = null;
        suggestionEl.innerHTML = `Model wasn't confident enough to make a call on this photo — please set fields manually.`;
      } else {
        pendingAiSuggestion = result;
        const parts = [];
        if (result.colorGuess) parts.push(`color looks like "${result.colorGuess}"`);
        if (result.bristolTypeGuess) parts.push(`Bristol type looks like ${result.bristolTypeGuess}`);
        if (result.notes) parts.push(result.notes);
        suggestionEl.innerHTML = `<strong>AI estimate (confidence ${Math.round(result.confidence * 100)}%):</strong> ${parts.join(", ") || "no strong signal"}. Please confirm or correct the fields above — this is a pattern-recognition aid, not a diagnosis.`;
        if (result.colorGuess) document.getElementById("colorSelect").value = result.colorGuess;
        if (result.bristolTypeGuess) {
          document.querySelectorAll(".bristol-opt").forEach((b) => b.classList.toggle("selected", Number(b.dataset.value) === result.bristolTypeGuess));
          pendingBristol = result.bristolTypeGuess;
        }
        if (result.visibleFoodGuess) document.getElementById("visibleFood").checked = true;
      }
    } catch (err) {
      pendingAiSuggestion = null;
      suggestionEl.textContent = `Photo analysis unavailable: ${err.message}`;
    }
  });

  document.getElementById("analysisForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      bristolType: pendingBristol,
      color: document.getElementById("colorSelect").value,
      odor: document.getElementById("odorSelect").value,
      pain: document.getElementById("painSelect").value,
      visibleFood: document.getElementById("visibleFood").checked,
      bloodFlag: document.getElementById("bloodFlag").checked,
      symptoms: Array.from(pendingSymptoms),
      notes: document.getElementById("notesInput").value.trim(),
      aiSuggested: !!pendingAiSuggestion,
      aiConfidence: pendingAiSuggestion ? pendingAiSuggestion.confidence : null,
      keepPhoto: document.getElementById("keepPhoto").checked,
    };

    if (body.keepPhoto && pendingPhotoFile) {
      body.photoDataUrl = await fileToDataUrl(pendingPhotoFile);
    }

    try {
      const result = await api("/sessions", { method: "POST", body });
      handleUnlockedBadges(result.newlyUnlocked);
      resetDetailForm();
      document.getElementById("detailForm").classList.add("hidden");
      showToast("Session saved 📋");
      renderSessionList();
      renderStreakPill();
    } catch (err) {
      showToast(err.message);
    }
  });

  document.getElementById("freezeStreakBtn").addEventListener("click", async () => {
    const days = prompt("Freeze your streak for how many days?", "3");
    const n = parseInt(days, 10);
    if (!n || n <= 0) return;
    try {
      await api("/dashboard/freeze", { method: "POST", body: { days: n } });
      showToast(`Streak frozen for ${n} day(s)`);
      renderDashboard();
    } catch (err) {
      showToast(err.message);
    }
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    window.location.href = "/api/dashboard/export";
  });

  document.getElementById("addFriendBtn").addEventListener("click", async () => {
    const input = document.getElementById("addFriendInput");
    const username = input.value.trim();
    if (!username) return;
    try {
      await api("/circle/friends", { method: "POST", body: { username } });
      input.value = "";
      showToast(`Friend request sent to ${username}`);
      renderCircle();
    } catch (err) {
      showToast(err.message);
    }
  });

  document.getElementById("friendRequests").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-accept]");
    if (!btn) return;
    try {
      await api(`/circle/requests/${btn.dataset.accept}/accept`, { method: "POST" });
      showToast("Friend added!");
      renderCircle();
    } catch (err) {
      showToast(err.message);
    }
  });
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
