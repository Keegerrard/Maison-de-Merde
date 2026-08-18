/* =========================================================================
   Maison de Merde — frontend, backed by the real API (server.js + src/routes/*).
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
   Confetti — dependency-free canvas particle burst. Fired on every log
   (small burst) and on achievement unlocks (bigger burst, via the
   celebration modal below). Purely decorative, never blocks anything.
   ------------------------------------------------------------------------- */

const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas ? confettiCanvas.getContext("2d") : null;
let confettiParticles = [];
let confettiRunning = false;
const CONFETTI_COLORS = ["#d4af37", "#f2d786", "#8a6a1f", "#6e1f2b", "#f3ead9", "#4fae72"];

function resizeConfettiCanvas() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

function spawnConfetti(count = 50, originY = 0.3) {
  if (!confettiCanvas || !confettiCtx) return;
  const w = confettiCanvas.width, h = confettiCanvas.height;
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: w / 2 + (Math.random() - 0.5) * w * 0.5,
      y: h * originY + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 11 - 3,
      size: Math.random() * 6 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: 80 + Math.random() * 45,
      shape: Math.random() < 0.5 ? "rect" : "circle",
    });
  }
  if (!confettiRunning) {
    confettiRunning = true;
    confettiCanvas.classList.add("active");
    requestAnimationFrame(animateConfetti);
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach((p) => {
    p.vy += 0.28; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    p.life += 1;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation);
    confettiCtx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
    confettiCtx.fillStyle = p.color;
    if (p.shape === "rect") {
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    }
    confettiCtx.restore();
  });
  confettiParticles = confettiParticles.filter((p) => p.life < p.maxLife && p.y < confettiCanvas.height + 60);
  if (confettiParticles.length > 0) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiCanvas.classList.remove("active");
  }
}

/* -------------------------------------------------------------------------
   Ambient sparkles — a handful of small, non-interactive gold motes drifting
   slowly upward behind the UI. Plain absolutely-positioned <span> elements
   (not a canvas, not opaque) animated with transform/opacity only, so
   there's no persistent full-viewport paint surface sitting over the page —
   the confetti canvas caused exactly that class of rendering problem, so
   this is deliberately built differently.
   ------------------------------------------------------------------------- */

function initAmbientSparkles() {
  const container = document.getElementById("ambientSparkles");
  if (!container) return;
  const COUNT = 22;
  for (let i = 0; i < COUNT; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.style.left = `${Math.random() * 100}%`;
    s.style.bottom = `${-10 - Math.random() * 20}px`;
    s.style.animationDuration = `${9 + Math.random() * 10}s`;
    s.style.animationDelay = `${Math.random() * 12}s`;
    container.appendChild(s);
  }
}

/* -------------------------------------------------------------------------
   Card tilt — subtle perspective tilt following the pointer, scoped to each
   card individually (never a full-viewport effect). Skipped on touch
   devices since there's no hover pointer to track.
   ------------------------------------------------------------------------- */

function initCardTilt() {
  if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.dataset.tilt = "1";
    card.style.transform = `perspective(700px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
  });
  document.addEventListener("pointerleave", (e) => {
    const card = e.target.closest && e.target.closest(".card");
    if (card) card.style.transform = "";
  }, true);
}

/* -------------------------------------------------------------------------
   Celebration modal — bigger moment than a toast, for achievement unlocks.
   Queued so multiple simultaneous badge unlocks show one at a time.
   ------------------------------------------------------------------------- */

let celebrationQueue = [];
let celebrationShowing = false;

function queueCelebration({ icon, title, subtitle }) {
  celebrationQueue.push({ icon, title, subtitle });
  if (!celebrationShowing) showNextCelebration();
}

function showNextCelebration() {
  if (celebrationQueue.length === 0) {
    celebrationShowing = false;
    return;
  }
  celebrationShowing = true;
  const { icon, title, subtitle } = celebrationQueue.shift();
  document.getElementById("celebrationIcon").textContent = icon;
  document.getElementById("celebrationTitle").textContent = title;
  document.getElementById("celebrationSubtitle").textContent = subtitle || "";
  document.getElementById("celebrationOverlay").classList.remove("hidden");
  spawnConfetti(150, 0.25);
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
  stopNotificationPolling();
}

function showApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  renderSessionList();
  renderStreakPill();
  refreshNotifications();
  startNotificationPolling();
}

function switchAuthForm(which) {
  document.querySelectorAll(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.form === which));
  document.getElementById("loginForm").classList.toggle("hidden", which !== "login");
  document.getElementById("signupForm").classList.toggle("hidden", which !== "signup");
}

/* -------------------------------------------------------------------------
   Paywall (dummy) — gates "Freeze Streak" and "Recover a Missed Day"
   behind a fake Gold Membership upsell. No payment is ever actually
   processed: the card fields are decorative, "subscribing" just sets a
   client-side flag in localStorage for this browser and runs whatever
   action was waiting behind the paywall. Freeze Streak still calls the
   real API afterward; Recover a Missed Day has no backend behind it at
   all (there's no streak-recovery endpoint), so it's cosmetic only —
   labeled honestly as such in its own toast, not faked as a real change.
   ------------------------------------------------------------------------- */

const PREMIUM_KEY = "maison_de_merde_premium_v1";
let pendingPremiumAction = null;
let selectedPaywallTier = { tier: "annual", price: "39.99" };

function isPremium() {
  return localStorage.getItem(PREMIUM_KEY) === "1";
}

function setPremium() {
  localStorage.setItem(PREMIUM_KEY, "1");
  document.getElementById("goldBadge").classList.remove("hidden");
}

function refreshGoldBadge() {
  document.getElementById("goldBadge").classList.toggle("hidden", !isPremium());
}

function gateWithPaywall(reason, action) {
  if (isPremium()) {
    action();
    return;
  }
  pendingPremiumAction = action;
  document.getElementById("paywallReason").textContent = reason;
  const form = document.getElementById("paywallForm");
  form.reset();
  const submitBtn = document.getElementById("paywallSubmit");
  submitBtn.classList.remove("success");
  submitBtn.querySelector(".paywall-submit-label").classList.remove("hidden");
  submitBtn.querySelector(".paywall-spinner").classList.add("hidden");
  document.getElementById("paywallOverlay").classList.remove("hidden");
}

function closePaywall() {
  document.getElementById("paywallOverlay").classList.add("hidden");
  pendingPremiumAction = null;
}

/* -------------------------------------------------------------------------
   Notifications — polled rather than pushed (no websocket infra here).
   Friend requests/accepts, shared sessions, and chat messages all create
   a notification server-side; this just surfaces them.
   ------------------------------------------------------------------------- */

let notifPollTimer = null;
let notifPanelOpen = false;

function startNotificationPolling() {
  stopNotificationPolling();
  notifPollTimer = setInterval(refreshNotifications, 20000);
}

function stopNotificationPolling() {
  if (notifPollTimer) clearInterval(notifPollTimer);
  notifPollTimer = null;
}

async function refreshNotifications() {
  try {
    const data = await api("/notifications");
    const badge = document.getElementById("bellBadge");
    if (data.unreadCount > 0) {
      badge.textContent = data.unreadCount > 9 ? "9+" : String(data.unreadCount);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
    if (notifPanelOpen) renderNotifList(data.notifications);
    return data.notifications;
  } catch (e) {
    return [];
  }
}

function notifCopy(n) {
  const username = escapeHtml(n.payload.username || "Someone");
  const preview = escapeHtml(n.payload.preview || "sent a message");
  switch (n.type) {
    case "friend_request": return { icon: "🤝", text: `<strong>${username}</strong> wants to join your Circle.` };
    case "friend_accept": return { icon: "👑", text: `<strong>${username}</strong> accepted your Circle invitation.` };
    case "message": return { icon: "💬", text: `<strong>${username}</strong>: ${preview}` };
    case "session_shared": return { icon: "📋", text: `<strong>${username}</strong> shared a session with you.` };
    default: return { icon: "🔔", text: "New notification." };
  }
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function renderNotifList(notifications) {
  const list = document.getElementById("notifList");
  if (!notifications.length) {
    list.innerHTML = `<div class="notif-empty">Nothing yet — quiet in the Circle.</div>`;
    return;
  }
  list.innerHTML = notifications.map((n) => {
    const { icon, text } = notifCopy(n);
    return `
      <div class="notif-row ${n.read ? "" : "unread"}" data-id="${n.id}" data-type="${n.type}" data-payload='${JSON.stringify(n.payload).replace(/'/g, "&#39;")}'>
        <span class="notif-icon">${icon}</span>
        <div>
          <div class="notif-text">${text}</div>
          <div class="notif-time">${timeAgo(n.created_at)}</div>
        </div>
      </div>
    `;
  }).join("");
}

async function toggleNotifPanel() {
  const panel = document.getElementById("notifPanel");
  notifPanelOpen = !notifPanelOpen;
  panel.classList.toggle("hidden", !notifPanelOpen);
  if (notifPanelOpen) {
    const notifications = await refreshNotifications();
    renderNotifList(notifications);
  }
}

async function handleNotifClick(row) {
  const id = row.dataset.id;
  const type = row.dataset.type;
  let payload = {};
  try { payload = JSON.parse(row.dataset.payload); } catch (e) { /* ignore */ }

  try { await api(`/notifications/${id}/read`, { method: "POST" }); } catch (e) { /* non-fatal */ }
  refreshNotifications();

  if (type === "message") {
    openChat(payload.username);
  } else if (type === "friend_request" || type === "friend_accept") {
    document.getElementById("notifPanel").classList.add("hidden");
    notifPanelOpen = false;
    switchTab("circle");
  } else if (type === "session_shared" && payload.sessionId) {
    document.getElementById("notifPanel").classList.add("hidden");
    notifPanelOpen = false;
    openSessionDetail(payload.sessionId);
  }
}

/* -------------------------------------------------------------------------
   Session detail modal — full view of a single session, with an explicit
   per-session share control (never a Circle-wide default share).
   ------------------------------------------------------------------------- */

let currentDetailSessionId = null;

const COLOR_LABELS = { brown: "Brown (typical)", "dark-brown": "Dark brown", green: "Green", yellow: "Yellow", pale: "Pale / clay", black: "Black", red: "Red" };
const ODOR_LABELS = { typical: "Typical", mild: "Milder than usual", strong: "Stronger than usual", severe: "Much stronger than usual" };
const PAIN_LABELS = { none: "None", mild: "Mild", moderate: "Moderate", severe: "Severe" };

function detailRow(label, value) {
  if (value === null || value === undefined || value === "") return "";
  return `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
}

async function openSessionDetail(id) {
  currentDetailSessionId = id;
  const overlay = document.getElementById("sessionDetailOverlay");
  const body = document.getElementById("sessionDetailBody");
  const shareWrap = document.getElementById("sessionDetailShare");
  body.innerHTML = skeletonRows(4);
  shareWrap.classList.add("hidden");
  overlay.classList.remove("hidden");

  try {
    const { session, isOwner } = await api(`/sessions/${id}`);
    const d = new Date(session.occurred_at);
    const time = d.toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

    let html = detailRow("Logged", time);
    if (session.bristol_type) html += detailRow("Bristol Type", `Type ${session.bristol_type}`);
    else html += detailRow("Type", "Quick log — no details recorded");
    if (session.color) html += detailRow("Color", COLOR_LABELS[session.color] || session.color);
    if (session.odor) html += detailRow("Odor", ODOR_LABELS[session.odor] || session.odor);
    if (session.pain) html += detailRow("Pain / straining", PAIN_LABELS[session.pain] || session.pain);
    if (session.visibleFood) html += detailRow("Visible food", "Yes");
    if (session.bloodFlag) html += detailRow("Blood present", "⚠ Yes");
    if (session.symptoms && session.symptoms.length) html += detailRow("Symptoms", escapeHtml(session.symptoms.join(", ")));
    if (session.aiSuggested) html += detailRow("AI-assisted", `Yes${session.ai_confidence ? ` (${Math.round(session.ai_confidence * 100)}% confidence)` : ""}`);

    body.innerHTML = html || `<div class="empty-state">No details recorded for this session.</div>`;

    if (session.notes) {
      body.innerHTML += `<div class="detail-notes">"${escapeHtml(session.notes)}"</div>`;
    }
    if (session.photo_kept) {
      body.innerHTML += `<img class="detail-photo" src="${session.photo_kept}" alt="session photo" />`;
    }

    if (isOwner) {
      shareWrap.classList.remove("hidden");
      await populateFriendSelect();
    } else {
      body.innerHTML += `<p class="detail-shared-note">Shared with you from a friend's Circle.</p>`;
    }
  } catch (err) {
    body.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function closeSessionDetail() {
  document.getElementById("sessionDetailOverlay").classList.add("hidden");
  currentDetailSessionId = null;
}

async function populateFriendSelect() {
  const select = document.getElementById("shareFriendSelect");
  select.innerHTML = `<option>Loading…</option>`;
  try {
    const { leaderboard } = await api("/circle");
    const friends = leaderboard.filter((r) => !r.isMe);
    if (!friends.length) {
      select.innerHTML = `<option value="">No friends in your Circle yet</option>`;
      return;
    }
    select.innerHTML = friends.map((f) => `<option value="${f.username}">${f.username}</option>`).join("");
  } catch (e) {
    select.innerHTML = `<option value="">Couldn't load friends</option>`;
  }
}

async function shareCurrentSession() {
  const username = document.getElementById("shareFriendSelect").value;
  if (!username || !currentDetailSessionId) return;
  try {
    await api(`/sessions/${currentDetailSessionId}/share`, { method: "POST", body: { username } });
    showToast(`Shared with ${username} 📋`);
  } catch (err) {
    showToast(err.message);
  }
}

async function renderSharedSessions() {
  const list = document.getElementById("sharedList");
  if (!list) return;
  list.innerHTML = skeletonRows(2);
  try {
    const { sessions } = await api("/sessions/shared");
    if (!sessions.length) {
      list.innerHTML = `<div class="empty-state">No shared sessions yet.</div>`;
      return;
    }
    list.innerHTML = sessions.map((s) => {
      const d = new Date(s.occurred_at);
      const time = d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      return `
        <div class="session-item" data-shared-id="${s.id}">
          <span class="session-time">${time}</span>
          <span class="session-tags"><span class="tag">from ${s.shared_by_username}</span>${s.bristol_type ? `<span class="tag">Type ${s.bristol_type}</span>` : ""}</span>
        </div>
      `;
    }).join("");
  } catch (e) {
    list.innerHTML = `<div class="empty-state">Couldn't load shared sessions.</div>`;
  }
}

/* -------------------------------------------------------------------------
   Chat — 1:1 threads with confirmed friends only. Polled while open.
   ------------------------------------------------------------------------- */

let currentChatUsername = null;
let chatPollTimer = null;

async function openChat(username) {
  currentChatUsername = username;
  document.getElementById("chatTitle").textContent = `Chat with ${username}`;
  document.getElementById("chatOverlay").classList.remove("hidden");
  document.getElementById("chatMessages").innerHTML = skeletonRows(3);
  await loadChat();
  clearInterval(chatPollTimer);
  chatPollTimer = setInterval(loadChat, 5000);
  document.getElementById("chatInput").focus();
}

function closeChat() {
  document.getElementById("chatOverlay").classList.add("hidden");
  clearInterval(chatPollTimer);
  chatPollTimer = null;
  currentChatUsername = null;
}

async function loadChat() {
  if (!currentChatUsername) return;
  try {
    const { messages } = await api(`/chat/${currentChatUsername}`);
    const el = document.getElementById("chatMessages");
    const wasAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (!messages.length) {
      el.innerHTML = `<div class="chat-empty">No messages yet — say hello.</div>`;
    } else {
      el.innerHTML = messages.map((m) => `<div class="chat-msg ${m.isMine ? "mine" : "theirs"}">${escapeHtml(m.body)}</div>`).join("");
    }
    if (wasAtBottom) el.scrollTop = el.scrollHeight;
    refreshNotifications();
  } catch (e) {
    // Friendship might have changed etc. — fail quietly, chat is non-critical.
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const body = input.value.trim();
  if (!body || !currentChatUsername) return;
  input.value = "";
  try {
    await api(`/chat/${currentChatUsername}`, { method: "POST", body: { body } });
    await loadChat();
  } catch (err) {
    showToast(err.message);
  }
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
  document.getElementById("dropzonePreview").classList.add("hidden");
  document.getElementById("dropzonePrompt").classList.remove("hidden");
  document.getElementById("keepPhotoWrap").classList.add("hidden");
  document.getElementById("aiSuggestion").classList.add("hidden");
  document.getElementById("aiSuggestion").className = "ai-card hidden";
}

/**
 * Renders the AI vision result as a structured card instead of one inline
 * sentence. `state` is "loading" | "withheld" | "result" | "error".
 */
function renderAiCard(state, data) {
  const card = document.getElementById("aiSuggestion");
  const badge = document.getElementById("aiConfidenceBadge");
  const body = document.getElementById("aiCardBody");
  card.classList.remove("hidden");
  card.classList.toggle("pending", state === "loading");

  if (state === "loading") {
    badge.textContent = "";
    badge.className = "ai-card-confidence";
    body.innerHTML = `<div class="ai-card-empty">Analyzing photo…</div>`;
    return;
  }

  if (state === "error") {
    badge.textContent = "";
    badge.className = "ai-card-confidence";
    body.innerHTML = `<div class="ai-card-empty">${escapeHtml(data.message || "Photo analysis unavailable.")}</div>`;
    return;
  }

  if (state === "withheld") {
    badge.textContent = `${Math.round((data.confidence || 0) * 100)}%`;
    badge.className = "ai-card-confidence";
    body.innerHTML = `<div class="ai-card-empty">Not confident enough to make a call on this photo — please set the fields above manually.</div>`;
    return;
  }

  const confidencePct = Math.round((data.confidence || 0) * 100);
  badge.textContent = `${confidencePct}% confident`;
  badge.className = "ai-card-confidence " + (confidencePct >= 60 ? "high" : confidencePct >= 45 ? "medium" : "");

  const rows = [];
  if (data.bristolTypeGuess) rows.push(`<div class="ai-row"><span class="ai-row-label">Bristol Type</span><span class="ai-row-value">Type ${data.bristolTypeGuess}</span></div>`);
  if (data.colorGuess) rows.push(`<div class="ai-row"><span class="ai-row-label">Color</span><span class="ai-row-value">${escapeHtml(COLOR_LABELS[data.colorGuess] || data.colorGuess)}</span></div>`);
  if (data.visibleFoodGuess) rows.push(`<div class="ai-row"><span class="ai-row-label">Visible food</span><span class="ai-row-value">Likely present</span></div>`);
  body.innerHTML = rows.length ? rows.join("") : `<div class="ai-card-empty">No strong signal on any specific attribute.</div>`;
  if (data.notes) body.innerHTML += `<div class="ai-note">"${escapeHtml(data.notes)}"</div>`;
}

async function handlePhotoFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("Please choose an image file.");
    return;
  }
  pendingPhotoFile = file;

  document.getElementById("photoPreview").src = URL.createObjectURL(file);
  document.getElementById("photoFileName").textContent = file.name;
  document.getElementById("dropzonePrompt").classList.add("hidden");
  document.getElementById("dropzonePreview").classList.remove("hidden");
  document.getElementById("keepPhotoWrap").classList.remove("hidden");

  renderAiCard("loading");

  try {
    const fd = new FormData();
    fd.append("photo", file);
    const result = await api("/vision/analyze", { method: "POST", body: fd });
    if (result.withheld) {
      pendingAiSuggestion = null;
      renderAiCard("withheld", result);
    } else {
      pendingAiSuggestion = result;
      renderAiCard("result", result);
      if (result.colorGuess) document.getElementById("colorSelect").value = result.colorGuess;
      if (result.bristolTypeGuess) {
        document.querySelectorAll(".bristol-opt").forEach((b) => b.classList.toggle("selected", Number(b.dataset.value) === result.bristolTypeGuess));
        pendingBristol = result.bristolTypeGuess;
      }
      if (result.visibleFoodGuess) document.getElementById("visibleFood").checked = true;
    }
  } catch (err) {
    pendingAiSuggestion = null;
    renderAiCard("error", { message: err.message });
  }
}

function removePendingPhoto() {
  pendingPhotoFile = null;
  pendingAiSuggestion = null;
  document.getElementById("photoInput").value = "";
  document.getElementById("dropzonePreview").classList.add("hidden");
  document.getElementById("dropzonePrompt").classList.remove("hidden");
  document.getElementById("keepPhotoWrap").classList.add("hidden");
  document.getElementById("keepPhoto").checked = false;
  document.getElementById("aiSuggestion").classList.add("hidden");
}

function handleUnlockedBadges(newlyUnlocked) {
  (newlyUnlocked || []).forEach((b) => {
    queueCelebration({ icon: b.icon, title: `${b.name} unlocked!`, subtitle: b.desc });
  });
}

/* -------------------------------------------------------------------------
   Streak pill — animated count-up + glow tier based on streak length.
   ------------------------------------------------------------------------- */

let lastRenderedStreak = null;

function updateStreakDisplay(newValue) {
  const pill = document.getElementById("streakPill");
  const countEl = document.getElementById("streakCount");
  const prev = lastRenderedStreak;
  lastRenderedStreak = newValue;

  let tier = 0;
  if (newValue >= 100) tier = 4;
  else if (newValue >= 30) tier = 3;
  else if (newValue >= 7) tier = 2;
  else if (newValue >= 1) tier = 1;
  pill.className = "streak-pill" + (tier ? ` tier-${tier}` : "");

  if (prev === null || prev === newValue) {
    countEl.textContent = newValue;
    return;
  }

  const start = prev;
  const end = newValue;
  const duration = 500;
  const startTime = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    countEl.textContent = Math.round(start + (end - start) * eased);
    if (t < 1) requestAnimationFrame(tick);
    else countEl.textContent = end;
  }
  requestAnimationFrame(tick);

  if (end > start) {
    pill.classList.add("bump");
    setTimeout(() => pill.classList.remove("bump"), 400);
  }
}

async function renderStreakPill() {
  try {
    const data = await api("/dashboard");
    updateStreakDisplay(data.streak.current);
  } catch (e) { /* non-fatal */ }
}

function skeletonRows(n, cls = "skeleton-row") {
  return Array.from({ length: n }, () => `<div class="skeleton ${cls}"></div>`).join("");
}

async function renderSessionList() {
  const list = document.getElementById("sessionList");
  list.innerHTML = skeletonRows(3);
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
      return `<div class="session-item" data-id="${s.id}"><span class="session-time">${time}</span><span class="session-tags">${tags.join("")}</span></div>`;
    }).join("");
  } catch (e) {
    list.innerHTML = `<div class="empty-state">Couldn't load sessions.</div>`;
  }
}

/* -------------------------------------------------------------------------
   Dashboard tab
   ------------------------------------------------------------------------- */

async function renderDashboard() {
  document.getElementById("heatmap").innerHTML = `<div class="skeleton skeleton-block" style="width:100%"></div>`;
  let data;
  try {
    data = await api("/dashboard");
  } catch (e) {
    return showToast("Couldn't load dashboard.");
  }
  document.getElementById("statCurrentStreak").textContent = data.streak.current;
  document.getElementById("statLongestStreak").textContent = data.streak.longest;
  document.getElementById("statGraceTokens").textContent = data.graceTokens;

  renderHeatmap(data.heatmap);
  drawBristolChart(data.bristolCounts);
}

/**
 * GitHub/Duolingo-style contribution heatmap. Buckets the flat chronological
 * day list from the API into weeks (columns of 7, Sun-Sat) and colors each
 * cell by session count relative to this user's own busiest day, so it
 * scales sensibly whether someone logs once a day or five times.
 */
function renderHeatmap(heatmapData) {
  const container = document.getElementById("heatmap");
  if (!heatmapData || !heatmapData.length) {
    container.innerHTML = `<div class="empty-state">No data yet.</div>`;
    return;
  }
  const cells = heatmapData.map((d) => ({ ...d, dow: new Date(d.day + "T00:00:00Z").getUTCDay() }));

  const weeks = [];
  let week = new Array(7).fill(null);
  for (let i = 0; i < cells[0].dow; i++) week[i] = null;
  cells.forEach((c) => {
    week[c.dow] = c;
    if (c.dow === 6) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
  });
  if (week.some((c) => c !== null)) weeks.push(week);

  const maxCount = Math.max(1, ...cells.map((c) => c.count));
  container.innerHTML = weeks.map((w) => w.map((c) => {
    if (!c) return `<div class="heatmap-cell"></div>`;
    let level = 0;
    if (c.count > 0) {
      const ratio = c.count / maxCount;
      level = ratio > 0.66 ? 3 : ratio > 0.33 ? 2 : 1;
    }
    const label = `${c.day}: ${c.count} session${c.count === 1 ? "" : "s"}`;
    return `<div class="heatmap-cell level-${level}" title="${label}"></div>`;
  }).join("")).join("");
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
  el.innerHTML = skeletonRows(3);
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
        ${r.isMe ? "" : `<span class="leaderboard-row-actions"><button type="button" class="icon-btn" data-chat="${r.username}" title="Chat">💬</button></span>`}
      </div>
    `).join("");
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Couldn't load circle.</div>`;
  }
  renderSharedSessions();
}

/* -------------------------------------------------------------------------
   Achievements tab
   ------------------------------------------------------------------------- */

async function renderAchievements() {
  const grid = document.getElementById("badgeGrid");
  grid.innerHTML = `<div class="skeleton skeleton-block" style="grid-column: 1 / -1;"></div>`;
  try {
    const data = await api("/dashboard");
    grid.innerHTML = data.badges.map((b) => `
      <div class="badge ${b.unlocked ? "unlocked stamp" : ""}">
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
  initAmbientSparkles();
  initCardTilt();
  refreshGoldBadge();

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
          remember: document.getElementById("rememberMe").checked,
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
      spawnConfetti(50, 0.22);
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

  document.getElementById("photoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handlePhotoFile(file);
  });

  document.getElementById("removePhotoBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    removePendingPhoto();
  });

  const dropzone = document.getElementById("photoDropzone");
  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag-over");
    });
  });
  ["dragleave", "dragend"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      if (evt === "dragleave" && dropzone.contains(e.relatedTarget)) return;
      dropzone.classList.remove("drag-over");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handlePhotoFile(file);
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
      showToast("Session saved 📋");
      spawnConfetti(70, 0.22);
      handleUnlockedBadges(result.newlyUnlocked);
      resetDetailForm();
      document.getElementById("detailForm").classList.add("hidden");
      renderSessionList();
      renderStreakPill();
    } catch (err) {
      showToast(err.message);
    }
  });

  document.getElementById("freezeStreakBtn").addEventListener("click", () => {
    gateWithPaywall("Streak Freeze is a privilege of the Gold Circle.", async () => {
      const days = prompt("Freeze your streak for how many days?", "3");
      const n = parseInt(days, 10);
      if (!n || n <= 0) return;
      try {
        await api("/dashboard/freeze", { method: "POST", body: { days: n } });
        showToast(`Streak frozen for ${n} day(s) 👑`);
        renderDashboard();
      } catch (err) {
        showToast(err.message);
      }
    });
  });

  document.getElementById("recoverStreakBtn").addEventListener("click", () => {
    gateWithPaywall("Missed-Day Recovery is a privilege of the Gold Circle.", () => {
      showToast("A member of our team has been dispatched to discreetly recover your missed day 👑");
    });
  });

  // Paywall wiring
  document.getElementById("paywallCard").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  });
  document.getElementById("paywallExpiry").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length > 2) v = `${v.slice(0, 2)} / ${v.slice(2)}`;
    e.target.value = v;
  });
  document.getElementById("paywallCvc").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });

  document.getElementById("paywallClose").addEventListener("click", closePaywall);
  document.getElementById("paywallOverlay").addEventListener("click", (e) => {
    if (e.target.id === "paywallOverlay") closePaywall();
  });

  document.getElementById("paywallTiers").addEventListener("click", (e) => {
    const tier = e.target.closest(".paywall-tier");
    if (!tier) return;
    document.querySelectorAll(".paywall-tier").forEach((t) => t.classList.toggle("selected", t === tier));
    selectedPaywallTier = { tier: tier.dataset.tier, price: tier.dataset.price };
    const unit = tier.dataset.tier === "annual" ? "/yr" : "/mo";
    document.getElementById("paywallSubmitPrice").textContent = `$${tier.dataset.price}${unit}`;
  });

  document.getElementById("paywallForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = document.getElementById("paywallSubmit");
    const label = btn.querySelector(".paywall-submit-label");
    const spinner = btn.querySelector(".paywall-spinner");
    label.classList.add("hidden");
    spinner.classList.remove("hidden");
    btn.disabled = true;

    setTimeout(() => {
      setPremium();
      spinner.classList.add("hidden");
      label.classList.remove("hidden");
      label.textContent = "Welcome to the Gold Circle 👑";
      btn.classList.add("success");
      spawnConfetti(120, 0.2);

      setTimeout(() => {
        closePaywall();
        btn.disabled = false;
        const unit = selectedPaywallTier.tier === "annual" ? "/yr" : "/mo";
        label.innerHTML = `Join the Gold Circle — <span id="paywallSubmitPrice">$${selectedPaywallTier.price}${unit}</span>`;
        btn.classList.remove("success");
        if (pendingPremiumAction) {
          const action = pendingPremiumAction;
          pendingPremiumAction = null;
          action();
        }
      }, 1100);
    }, 1400);
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

  // Chat button on each Circle row
  document.getElementById("leaderboard").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-chat]");
    if (btn) openChat(btn.dataset.chat);
  });

  document.getElementById("celebrationDismiss").addEventListener("click", () => {
    document.getElementById("celebrationOverlay").classList.add("hidden");
    showNextCelebration();
  });

  // Session detail modal — opened from either the Recent Sessions list or
  // the Shared With You list.
  document.getElementById("sessionList").addEventListener("click", (e) => {
    const row = e.target.closest("[data-id]");
    if (row) openSessionDetail(row.dataset.id);
  });
  document.getElementById("sharedList").addEventListener("click", (e) => {
    const row = e.target.closest("[data-shared-id]");
    if (row) openSessionDetail(row.dataset.sharedId);
  });
  document.getElementById("sessionDetailClose").addEventListener("click", closeSessionDetail);
  document.getElementById("sessionDetailOverlay").addEventListener("click", (e) => {
    if (e.target.id === "sessionDetailOverlay") closeSessionDetail();
  });
  document.getElementById("shareSessionBtn").addEventListener("click", shareCurrentSession);

  // Chat modal
  document.getElementById("chatClose").addEventListener("click", closeChat);
  document.getElementById("chatOverlay").addEventListener("click", (e) => {
    if (e.target.id === "chatOverlay") closeChat();
  });
  document.getElementById("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    sendChatMessage();
  });

  // Notification bell
  document.getElementById("bellBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNotifPanel();
  });
  document.getElementById("notifList").addEventListener("click", (e) => {
    const row = e.target.closest(".notif-row");
    if (row) handleNotifClick(row);
  });
  document.getElementById("notifMarkAll").addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      await api("/notifications/read-all", { method: "POST" });
      const notifications = await refreshNotifications();
      renderNotifList(notifications);
    } catch (err) { /* non-fatal */ }
  });
  document.addEventListener("click", (e) => {
    const panel = document.getElementById("notifPanel");
    if (!notifPanelOpen || panel.contains(e.target) || e.target.closest("#bellBtn")) return;
    notifPanelOpen = false;
    panel.classList.add("hidden");
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
