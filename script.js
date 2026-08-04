const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");
const prizeOverlay = document.getElementById("prizeOverlay");
const prizeAnnouncementText = document.getElementById("prizeAnnouncementText");
const prizeContinueButton = document.getElementById("prizeContinueButton");
const loseOverlay = document.getElementById("loseOverlay");
const losePrimaryText = document.getElementById("losePrimaryText");
const loseSecondaryText = document.getElementById("loseSecondaryText");
const loseContinueButton = document.getElementById("loseContinueButton");
const loseCard = document.querySelector(".lose-card");
const pointer = document.querySelector(".pointer");
const spinButton = document.getElementById("spinButton");
const resultText = document.getElementById("resultText");
const currentPlayerText = document.getElementById("currentPlayerText");
const startOverlay = document.getElementById("startOverlay");
const adminAccessButton = document.getElementById("adminAccessButton");
const playerModal = document.getElementById("playerModal");
const adminModal = document.getElementById("adminModal");
const closeAdminModalButton = document.getElementById("closeAdminModalButton");
const playerForm = document.getElementById("playerForm");
const closeFormButton = document.getElementById("closeFormButton");
const nameInput = document.getElementById("nameInput");
const schoolInput = document.getElementById("schoolInput");
const emailInput = document.getElementById("emailInput");
const exportLoginTools = document.getElementById("exportLoginTools");
const exportTools = document.getElementById("exportTools");
const exportAdminEmailInput = document.getElementById("exportAdminEmail");
const exportAccessKeyInput = document.getElementById("exportAccessKey");
const adminLoginButton = document.getElementById("adminLoginButton");
const exportFromDateInput = document.getElementById("exportFromDate");
const exportToDateInput = document.getElementById("exportToDate");
const downloadExportButton = document.getElementById("downloadExportButton");
const adminEntryInput = document.getElementById("adminEntryInput");
const addAdminEntryButton = document.getElementById("addAdminEntryButton");
const adminEntriesList = document.getElementById("adminEntriesList");
const wheelSection = document.querySelector(".wheel-section");

const entriesUrl = "/entries.json";
const siteUrl = import.meta.env.VITE_SITE_URL || import.meta.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
const adminLoginApiUrl = new URL("/api/admin/login", siteUrl).toString();
const publicEntriesApiUrl = new URL("/api/entries", siteUrl).toString();
const adminEntriesApiUrl = new URL("/api/admin/entries", siteUrl).toString();
const participantsApiUrl = new URL("/api/participants", siteUrl).toString();
const participantsExportApiUrl = new URL("/api/participants/export", siteUrl).toString();
const storageKey = "spin-wheel-state-v1";
const nonRemovablePrizes = new Set([
  "so close",
  "better luck next time",
  "almost",
  "free spin",
  "oops",
  "not today",
  "troos prys",
]);

const colors = [
  "#f43f5e",
  "#fb7185",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

const confettiColors = ["#f43f5e", "#f97316", "#f59e0b", "#22c55e", "#3b82f6", "#d946ef"];

let allEntries = [];
let entries = [];
let currentRotation = 0;
let isSpinning = false;
let activePlayer = null;
let confettiParticles = [];
let confettiAnimationId = 0;
let confettiEndAt = 0;
let idleAnimationId = 0;
let idleLastTick = 0;
let prizeAnnouncementTimeoutId = 0;
let loseAnnouncementTimeoutId = 0;
let exportAdminSession = null;
let state = {
  initialized: false,
  availableEntries: [],
  participants: [],
  wins: [],
  pendingTurn: null,
  currentRotation: 0,
};

function setExportToolsVisibility(isLoggedIn) {
  exportTools.hidden = !isLoggedIn;
  exportLoginTools.hidden = isLoggedIn;
}

function getAdminRequestHeaders() {
  if (!exportAdminSession) {
    return null;
  }

  return {
    "X-Admin-Email": exportAdminSession.email,
    "X-Export-Key": exportAdminSession.accessKey,
  };
}

function openAdminModal() {
  adminModal.classList.add("is-visible");
  adminModal.setAttribute("aria-hidden", "false");
}

function closeAdminModal() {
  adminModal.classList.remove("is-visible");
  adminModal.setAttribute("aria-hidden", "true");
}

function normalizeLabel(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLoseKey(value) {
  const label = normalizeLabel(value);
  if (label === "so close") {
    return "so close";
  }
  if (label === "better luck next time") {
    return "better luck next time";
  }
  if (label === "almost") {
    return "almost";
  }
  if (label === "free spin") {
    return "free spin";
  }
  if (label === "oops") {
    return "oops";
  }
  if (label === "not today") {
    return "not today";
  }
  return null;
}

function normalizeEntries(list, allowEmpty = false) {
  if (!Array.isArray(list)) {
    return allowEmpty ? [] : ["Option 1", "Option 2"];
  }

  const normalized = list
    .map((entry) => String(entry).trim())
    .filter(Boolean);

  if (normalized.length > 0 || allowEmpty) {
    return normalized;
  }

  return ["Option 1", "Option 2"];
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function normalizeParticipant(participant) {
  if (!participant || typeof participant !== "object") {
    return null;
  }

  const fullName = String(participant.fullName || participant.name || "").trim();
  const school = String(participant.school || "").trim();
  const email = String(participant.email || "").trim();

  if (!fullName && !school && !email) {
    return null;
  }

  return {
    id: participant.id || createId(),
    fullName,
    name: fullName,
    school,
    email,
    submittedAt: participant.submittedAt || new Date().toISOString(),
  };
}

function normalizeParticipants(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map(normalizeParticipant).filter(Boolean);
}

function renderRegisteredPlayers() {
  return;
}

async function loadParticipantsFromServer() {
  try {
    const response = await fetch(participantsApiUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const participants = normalizeParticipants(await response.json());
    state.participants = participants;
    saveState();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`Could not load participants from server (${message}).`);
  }
}

async function saveParticipantToServer(participant) {
  const response = await fetch(participantsApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: participant.fullName || participant.name,
      school: participant.school,
      email: participant.email,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return normalizeParticipant(await response.json());
}

async function downloadParticipantsExport() {
  if (!exportAdminSession) {
    resultText.textContent = "Admin login is required before downloading registrations.";
    return;
  }

  const fromDate = exportFromDateInput.value;
  const toDate = exportToDateInput.value;

  if (!fromDate || !toDate) {
    resultText.textContent = "Select both From and To dates before downloading.";
    return;
  }

  if (fromDate > toDate) {
    resultText.textContent = "The From date must be earlier than or equal to the To date.";
    return;
  }

  const originalButtonText = downloadExportButton.textContent;
  downloadExportButton.disabled = true;
  downloadExportButton.textContent = "Preparing Excel...";

  try {
    const url = new URL(participantsExportApiUrl);
    url.searchParams.set("from", fromDate);
    url.searchParams.set("to", toDate);
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "X-Admin-Email": exportAdminSession.email,
        "X-Export-Key": exportAdminSession.accessKey,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    const fileBlob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const filenameMatch = disposition.match(/filename=\"([^\"]+)\"/);
    const filename = filenameMatch?.[1] || `spin-wheel-registrations-${fromDate}-to-${toDate}.xlsx`;
    const downloadUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
    resultText.textContent = `Downloaded registrations from ${fromDate} to ${toDate}.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not download registrations (${message}).`;
  } finally {
    downloadExportButton.disabled = false;
    downloadExportButton.textContent = originalButtonText;
  }
}

async function handleAdminLogin() {
  const email = exportAdminEmailInput.value.trim().toLowerCase();
  const accessKey = exportAccessKeyInput.value.trim();

  if (!email || !accessKey) {
    resultText.textContent = "Enter admin email and access key to login.";
    return;
  }

  adminLoginButton.disabled = true;
  const originalText = adminLoginButton.textContent;
  adminLoginButton.textContent = "Logging in...";

  try {
    const response = await fetch(adminLoginApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        accessKey,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    exportAdminSession = { email, accessKey };
    setExportToolsVisibility(true);
    exportAccessKeyInput.value = "";
    await loadAdminEntries();
    resultText.textContent = "Admin login successful. You can now download registrations.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Admin login failed (${message}).`;
  } finally {
    adminLoginButton.disabled = false;
    adminLoginButton.textContent = originalText;
  }
}

function createCounts(values) {
  const counts = new Map();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return counts;
}

function reconcileAvailableEntries(currentAvailable, sourceEntries) {
  const sourceCounts = createCounts(sourceEntries);
  const usedCounts = new Map();
  const nextEntries = [];

  currentAvailable.forEach((value) => {
    const allowed = sourceCounts.get(value) || 0;
    const used = usedCounts.get(value) || 0;
    if (used < allowed) {
      nextEntries.push(value);
      usedCounts.set(value, used + 1);
    }
  });

  sourceEntries.forEach((value) => {
    const allowed = sourceCounts.get(value) || 0;
    const used = usedCounts.get(value) || 0;
    if (used < allowed) {
      nextEntries.push(value);
      usedCounts.set(value, used + 1);
    }
  });

  return nextEntries;
}

function applyEntriesUpdate(newEntries) {
  allEntries = normalizeEntries(newEntries, true);
  const currentAvailable = normalizeEntries(state.availableEntries, true);
  entries = reconcileAvailableEntries(currentAvailable, allEntries);
  state.initialized = true;
  state.availableEntries = [...entries];
  state.currentRotation = currentRotation;
  saveState();
  drawWheel(currentRotation);
  updateSpinAvailability();
}

function renderAdminEntries(adminEntries) {
  adminEntriesList.innerHTML = "";

  if (adminEntries.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "admin-entries-item";
    emptyItem.innerHTML = "<span class=\"admin-entries-item__label\">No wheel entries configured.</span>";
    adminEntriesList.appendChild(emptyItem);
    return;
  }

  const fragment = document.createDocumentFragment();

  adminEntries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "admin-entries-item";

    const label = document.createElement("span");
    label.className = "admin-entries-item__label";
    label.textContent = entry;

    const removeButton = document.createElement("button");
    removeButton.className = "admin-entries-item__remove";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      void removeAdminEntry(index);
    });

    item.append(label, removeButton);
    fragment.appendChild(item);
  });

  adminEntriesList.appendChild(fragment);
}

async function loadAdminEntries() {
  const headers = getAdminRequestHeaders();
  if (!headers) {
    return;
  }

  const response = await fetch(adminEntriesApiUrl, {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  const payload = await response.json();
  const list = normalizeEntries(payload.entries, true);
  renderAdminEntries(list);
  applyEntriesUpdate(list);
}

async function addAdminEntry() {
  const headers = getAdminRequestHeaders();
  if (!headers) {
    resultText.textContent = "Admin login is required before managing entries.";
    return;
  }

  const label = adminEntryInput.value.trim();
  if (!label) {
    resultText.textContent = "Enter an entry label before adding.";
    return;
  }

  addAdminEntryButton.disabled = true;
  const originalText = addAdminEntryButton.textContent;
  addAdminEntryButton.textContent = "Adding...";

  try {
    const response = await fetch(adminEntriesApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ label }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    const payload = await response.json();
    const list = normalizeEntries(payload.entries, true);
    adminEntryInput.value = "";
    renderAdminEntries(list);
    applyEntriesUpdate(list);
    resultText.textContent = `Added wheel entry: ${label}.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not add wheel entry (${message}).`;
  } finally {
    addAdminEntryButton.disabled = false;
    addAdminEntryButton.textContent = originalText;
  }
}

async function removeAdminEntry(index) {
  const headers = getAdminRequestHeaders();
  if (!headers) {
    resultText.textContent = "Admin login is required before managing entries.";
    return;
  }

  try {
    const response = await fetch(adminEntriesApiUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ index }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    const payload = await response.json();
    const list = normalizeEntries(payload.entries, true);
    renderAdminEntries(list);
    applyEntriesUpdate(list);
    resultText.textContent = "Wheel entry removed.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not remove wheel entry (${message}).`;
  }
}

function resizeConfettiCanvas() {
  const ratio = window.devicePixelRatio || 1;
  confettiCanvas.width = Math.floor(window.innerWidth * ratio);
  confettiCanvas.height = Math.floor(window.innerHeight * ratio);
  confettiCanvas.style.width = `${window.innerWidth}px`;
  confettiCanvas.style.height = `${window.innerHeight}px`;
  confettiCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createConfettiPiece() {
  const spread = window.innerWidth;
  const fromLeft = Math.random() > 0.5;
  const x = fromLeft ? Math.random() * (spread * 0.35) : spread * 0.65 + Math.random() * (spread * 0.35);
  return {
    x,
    y: -20 - Math.random() * 80,
    size: 6 + Math.random() * 8,
    speedY: 2 + Math.random() * 5,
    speedX: (Math.random() - 0.5) * 3,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.25,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    life: 75 + Math.random() * 35,
  };
}

function renderConfetti() {
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  confettiParticles = confettiParticles.filter((piece) => piece.life > 0 && piece.y < window.innerHeight + 40);

  for (const piece of confettiParticles) {
    piece.x += piece.speedX;
    piece.y += piece.speedY;
    piece.rotation += piece.rotationSpeed;
    piece.life -= 1;

    confettiCtx.save();
    confettiCtx.translate(piece.x, piece.y);
    confettiCtx.rotate(piece.rotation);
    confettiCtx.fillStyle = piece.color;
    confettiCtx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.65);
    confettiCtx.restore();
  }
}

function stepConfetti(now) {
  if (now < confettiEndAt) {
    confettiParticles.push(createConfettiPiece(), createConfettiPiece(), createConfettiPiece());
  }

  renderConfetti();

  if (now < confettiEndAt || confettiParticles.length > 0) {
    confettiAnimationId = requestAnimationFrame(stepConfetti);
    return;
  }

  confettiAnimationId = 0;
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function launchConfetti(duration = 2600) {
  confettiParticles = [];
  confettiEndAt = performance.now() + duration;

  for (let i = 0; i < 120; i += 1) {
    confettiParticles.push(createConfettiPiece());
  }

  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
  }
  confettiAnimationId = requestAnimationFrame(stepConfetti);
}

function getPrizeAnnouncementLabel(winner) {
  const cleaned = String(winner).trim();
  if (!cleaned) {
    return "PRIZE";
  }

  return cleaned.toUpperCase();
}

function showPrizeAnnouncement(winner) {
  prizeAnnouncementText.textContent = getPrizeAnnouncementLabel(winner);
  prizeOverlay.classList.add("is-visible");
  prizeOverlay.setAttribute("aria-hidden", "false");
}

function getLoseMessage(winner) {
  const loseKey = getLoseKey(winner);
  if (loseKey === "so close") {
    return { primary: "So Close! 😅", secondary: "That was closer in your imagination. 😉" };
  }
  if (loseKey === "almost") {
    return { primary: "Almost! 🤏", secondary: "If the wheel moved just one more click..." };
  }
  if (loseKey === "free spin") {
    return { primary: "Free Spin! 🔄", secondary: "Go again — this one doesn't count you out." };
  }
  if (loseKey === "oops") {
    return { primary: "Oops! 😬", secondary: "Looks like luck took a quick break! 😄" };
  }
    if (loseKey === "not today") {
    return { primary: "Not Today!", secondary: "Even the wheel needs a coffee break." };
  }
  return { primary: "Better Luck Next Time! 🍀", secondary: "The wheel wasn't on your side this time—but don't stop smiling!" };
}

function createLoseEmojiBurst() {
  const emojis = ["😅", "😂", "🤪", "🥲", "😹"];
  const count = 5 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i += 1) {
    const emoji = document.createElement("span");
    const driftX = (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 36);
    const driftY = -(36 + Math.random() * 48);
    emoji.className = "lose-funny-emoji";
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${10 + Math.random() * 80}%`;
    emoji.style.top = `${16 + Math.random() * 46}%`;
    emoji.style.setProperty("--drift-x", `${driftX}px`);
    emoji.style.setProperty("--drift-y", `${driftY}px`);
    emoji.style.animationDuration = `${950 + Math.random() * 250}ms`;
    loseCard.appendChild(emoji);

    window.setTimeout(() => {
      emoji.remove();
    }, 1400);
  }
}

function playLoseAnimation() {
  if (!loseCard) {
    return;
  }

  loseCard.classList.remove("is-funny");
  void loseCard.offsetWidth;
  loseCard.classList.add("is-funny");
  createLoseEmojiBurst();
}

function showLoseAnnouncement(winner) {
  const message = getLoseMessage(winner);
  losePrimaryText.textContent = message.primary;
  loseSecondaryText.textContent = message.secondary;
  loseOverlay.classList.remove("is-visible");
  void loseOverlay.offsetWidth;
  loseOverlay.classList.add("is-visible");
  loseOverlay.setAttribute("aria-hidden", "false");
  playLoseAnimation();
}

function triggerPointerHit() {
  pointer.classList.remove("is-hit");
  wheelSection.classList.remove("is-hit");
  void pointer.offsetWidth;
  pointer.classList.add("is-hit");
  wheelSection.offsetWidth;
  wheelSection.classList.add("is-hit");
}

function showResultOverlays(result) {
  if (getLoseKey(result.winner)) {
    showLoseAnnouncement(result.winner);
    return;
  }

  showPrizeAnnouncement(result.winner);
  launchConfetti();
}

function clearResultOverlays() {
  prizeOverlay.classList.remove("is-visible");
  prizeOverlay.setAttribute("aria-hidden", "true");
  loseOverlay.classList.remove("is-visible");
  loseOverlay.setAttribute("aria-hidden", "true");
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    state = {
      initialized: Boolean(parsed.initialized),
      availableEntries: normalizeEntries(parsed.availableEntries, true),
      participants: normalizeParticipants(parsed.participants),
      wins: Array.isArray(parsed.wins) ? parsed.wins : [],
      pendingTurn: parsed.pendingTurn && typeof parsed.pendingTurn === "object" ? parsed.pendingTurn : null,
      currentRotation: typeof parsed.currentRotation === "number" ? parsed.currentRotation : 0,
    };
  } catch {
    state = {
      initialized: false,
      availableEntries: [],
      participants: [],
      wins: [],
      pendingTurn: null,
      currentRotation: 0,
    };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function stopIdleSpin() {
  if (!idleAnimationId) {
    return;
  }

  cancelAnimationFrame(idleAnimationId);
  idleAnimationId = 0;
  idleLastTick = 0;
}

function startIdleSpin() {
  if (idleAnimationId || entries.length === 0) {
    return;
  }

  function animate(now) {
    const waiting = startOverlay.classList.contains("is-visible");
    if (!waiting || isSpinning || activePlayer || entries.length === 0) {
      idleAnimationId = 0;
      idleLastTick = 0;
      return;
    }

    if (idleLastTick === 0) {
      idleLastTick = now;
    }

    const delta = now - idleLastTick;
    idleLastTick = now;
    currentRotation += (delta / 1000) * 0.55;
    drawWheel(currentRotation);
    idleAnimationId = requestAnimationFrame(animate);
  }

  idleAnimationId = requestAnimationFrame(animate);
}

function setWaitingForPlayer() {
  startOverlay.classList.add("is-visible");
  startOverlay.setAttribute("aria-hidden", "false");
  startIdleSpin();
}

function hideWaitingForPlayer() {
  startOverlay.classList.remove("is-visible");
  startOverlay.setAttribute("aria-hidden", "true");
  stopIdleSpin();
}

function openPlayerForm() {
  if (isSpinning || activePlayer) {
    return;
  }

  stopIdleSpin();
  playerModal.classList.add("is-visible");
  playerModal.setAttribute("aria-hidden", "false");
  nameInput.focus();
}

function closePlayerForm() {
  playerModal.classList.remove("is-visible");
  playerModal.setAttribute("aria-hidden", "true");
}

function handleFormExit() {
  playerForm.reset();
  closePlayerForm();
  setWaitingForPlayer();
  drawWheel(currentRotation);
  if (!state.pendingTurn && entries.length > 0) {
    resultText.textContent = "Stand A Chance To Win.";
  }
  updateSpinAvailability();
}

function updateSpinAvailability() {
  spinButton.disabled = isSpinning || !activePlayer || entries.length === 0;
}

function drawWheel(rotation = currentRotation) {
  const center = canvas.width / 2;
  const radius = center - 8;
  const pegRadius = radius + 3;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (entries.length === 0) {
    ctx.fillStyle = "#60657d";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No prizes left", center, center);
    return;
  }

  const arc = (Math.PI * 2) / entries.length;

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);

  for (let i = 0; i < entries.length; i += 1) {
    const startAngle = i * arc;
    const endAngle = startAngle + arc;
    const midAngle = startAngle + arc / 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(midAngle);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 23px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(entries[i], radius - 24, 0);
    ctx.restore();

    ctx.save();
    ctx.rotate(startAngle);
    ctx.beginPath();
    ctx.arc(pegRadius, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pegRadius, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(219, 39, 119, 0.65)";
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function getWinningEntry() {
  if (entries.length === 0) {
    return "";
  }

  const fullCircle = Math.PI * 2;
  const pointerAngle = -Math.PI / 2;
  const normalized = ((pointerAngle - currentRotation) % fullCircle + fullCircle) % fullCircle;
  const arc = fullCircle / entries.length;
  const index = Math.floor(normalized / arc) % entries.length;
  return entries[index];
}

function isRemovablePrize(prize) {
  return !nonRemovablePrizes.has(normalizeLabel(prize));
}

function removeEntryOnce(target) {
  const index = entries.findIndex((entry) => entry === target);
  if (index === -1) {
    return false;
  }

  entries.splice(index, 1);
  return true;
}

function completeTurn(winner) {
  const removable = isRemovablePrize(winner);
  const playerSnapshot = activePlayer;
  const isFreeSpin = getLoseKey(winner) === "free spin";

  state.wins.push({
   id: createId(),
   wonAt: new Date().toISOString(),
   winner,
   removedFromWheel: removable,
   player: playerSnapshot,
  });
  state.pendingTurn = {
   winner,
   removable,
   freeSpin: isFreeSpin,
   player: playerSnapshot,
  };
  state.currentRotation = currentRotation;
  saveState();

  resultText.textContent = isFreeSpin ? "Free spin! Press spin to play again." : `Winner: ${winner}`;
  currentPlayerText.textContent = isFreeSpin && playerSnapshot
   ? `Player: ${playerSnapshot.name} (${playerSnapshot.school})`
   : "Waiting for player details.";
  activePlayer = isFreeSpin ? playerSnapshot : null;
  stopIdleSpin();
  drawWheel(currentRotation);
  triggerPointerHit();
  showResultOverlays({ winner, removable });
  updateSpinAvailability();
}

function finalizePendingTurn() {
  const pendingTurn = state.pendingTurn;
  if (!pendingTurn) {
   return;
  }

  if (pendingTurn.removable) {
   removeEntryOnce(pendingTurn.winner);
   state.availableEntries = [...entries];
  }

  if (pendingTurn.freeSpin) {
   const playerSnapshot = pendingTurn.player || activePlayer;
   if (playerSnapshot) {
     activePlayer = playerSnapshot;
     currentPlayerText.textContent = `Player: ${playerSnapshot.name} (${playerSnapshot.school})`;
     resultText.textContent = "Free spin! Press spin to play again.";
   }
   state.pendingTurn = null;
   state.currentRotation = currentRotation;
   saveState();
   clearResultOverlays();
   hideWaitingForPlayer();
   drawWheel(currentRotation);
   updateSpinAvailability();
   return;
  }

  state.pendingTurn = null;
  state.currentRotation = currentRotation;
  saveState();

  clearResultOverlays();
  setWaitingForPlayer();
  drawWheel(currentRotation);
  updateSpinAvailability();
}

function spinWheel() {
  if (isSpinning || !activePlayer || entries.length === 0) {
    return;
  }

  stopIdleSpin();
  isSpinning = true;
  updateSpinAvailability();
  resultText.textContent = "Spinning...";

  const extraTurns = 5 + Math.random() * 4;
  const fullCircle = Math.PI * 2;
  const arc = fullCircle / entries.length;
  const pointerAngle = -Math.PI / 2;
  const winningIndex = Math.floor(Math.random() * entries.length);
  const start = performance.now();
  const duration = 4500;
  const startRotation = currentRotation;
  const targetAngle = ((pointerAngle - (winningIndex * arc + arc / 2)) % fullCircle + fullCircle) % fullCircle;
  const startAngle = ((startRotation % fullCircle) + fullCircle) % fullCircle;
  const deltaToTarget = (targetAngle - startAngle + fullCircle) % fullCircle;
  const targetRotation = startRotation + deltaToTarget + (fullCircle * extraTurns);

  function animate(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    currentRotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel(currentRotation);

    if (t < 1) {
      requestAnimationFrame(animate);
      return;
    }

    currentRotation = targetRotation;
    drawWheel(currentRotation);
    state.currentRotation = currentRotation;
    saveState();
    const winner = getWinningEntry();
    isSpinning = false;
    completeTurn(winner);
  }

  requestAnimationFrame(animate);
}

async function loadJsonEntries() {
  try {
    const response = await fetch(publicEntriesApiUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    const json = await response.json();
    const fromJson = Array.isArray(json) ? json : json.entries;
    if (!Array.isArray(fromJson)) {
      throw new Error("Expected an array or { entries: [] }");
    }

    allEntries = normalizeEntries(fromJson, true);
  } catch (error) {
    try {
      const response = await fetch(entriesUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const json = await response.json();
      const fromJson = Array.isArray(json) ? json : json.entries;
      if (!Array.isArray(fromJson)) {
        throw new Error("Expected an array or { entries: [] }");
      }

      allEntries = normalizeEntries(fromJson, true);
    } catch {
      allEntries = ["Option 1", "Option 2"];
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not load managed entries (${message}).`;
  }
}

function initializeEntriesFromState() {
  const sourceEntries = normalizeEntries(allEntries, true);
  const availableEntries = normalizeEntries(state.availableEntries, true);
  entries = state.initialized
    ? reconcileAvailableEntries(availableEntries, sourceEntries)
    : [...sourceEntries];
  state.initialized = true;
  state.availableEntries = [...entries];
  state.currentRotation = typeof state.currentRotation === "number" ? state.currentRotation : 0;
  saveState();
}

function restorePendingTurn() {
  if (!state.pendingTurn) {
    return false;
  }

  currentRotation = typeof state.currentRotation === "number" ? state.currentRotation : 0;
  drawWheel(currentRotation);
  resultText.textContent = `Winner: ${state.pendingTurn.winner}`;
  currentPlayerText.textContent = "Waiting for player details.";
  showResultOverlays(state.pendingTurn);
  updateSpinAvailability();
  return true;
}

async function handlePlayerSubmit(event) {
  event.preventDefault();

  if (!playerForm.reportValidity()) {
    return;
  }

  const submittedPlayer = {
    id: createId(),
    fullName: nameInput.value.trim(),
    school: schoolInput.value.trim(),
    email: emailInput.value.trim(),
  };

  try {
    const participantFromServer = await saveParticipantToServer(submittedPlayer);

    if (!participantFromServer) {
      throw new Error("The server did not return a valid participant." );
    }

    activePlayer = participantFromServer;
    state.participants.push({
      ...participantFromServer,
      submittedAt: participantFromServer.submittedAt || new Date().toISOString(),
    });
    state.participants = normalizeParticipants(state.participants);
    saveState();

    currentPlayerText.textContent = `Player: ${activePlayer.name} (${activePlayer.school})`;
    resultText.textContent = "Press spin to choose a winner.";
    playerForm.reset();
    closePlayerForm();
    hideWaitingForPlayer();
    updateSpinAvailability();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not save registration (${message}).`;
  }
}

function handleOverlayActivate() {
  openPlayerForm();
}

function handleOverlayKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  openPlayerForm();
}

function handleAdminAccess(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  openAdminModal();
}

spinButton.addEventListener("click", spinWheel);
playerForm.addEventListener("submit", handlePlayerSubmit);
closeFormButton.addEventListener("click", handleFormExit);
adminAccessButton.addEventListener("click", handleAdminAccess);
closeAdminModalButton.addEventListener("click", closeAdminModal);
adminModal.addEventListener("click", (event) => {
  if (event.target === adminModal) {
    closeAdminModal();
  }
});
startOverlay.addEventListener("click", handleOverlayActivate);
startOverlay.addEventListener("keydown", handleOverlayKeydown);
window.addEventListener("resize", resizeConfettiCanvas);
prizeContinueButton.addEventListener("click", finalizePendingTurn);
loseContinueButton.addEventListener("click", finalizePendingTurn);
adminLoginButton.addEventListener("click", handleAdminLogin);
downloadExportButton.addEventListener("click", downloadParticipantsExport);
addAdminEntryButton.addEventListener("click", () => {
  void addAdminEntry();
});
adminEntryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void addAdminEntry();
  }
});

async function init() {
  setExportToolsVisibility(false);
  resizeConfettiCanvas();
  loadState();
  await loadParticipantsFromServer();
  await loadJsonEntries();
  initializeEntriesFromState();
  if (!restorePendingTurn()) {
    drawWheel(currentRotation);
    setWaitingForPlayer();
  }

  if (entries.length === 0) {
    resultText.textContent = "No prizes left on the wheel.";
  } else {
    resultText.textContent = state.pendingTurn ? resultText.textContent : "Stand A Chance To Win.";
  }

  updateSpinAvailability();
}

void init();
