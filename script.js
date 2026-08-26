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
const adminSectionTitle = document.getElementById("adminSectionTitle");
const adminSectionSubtitle = document.getElementById("adminSectionSubtitle");
const adminTabs = document.getElementById("adminTabs");
const playerForm = document.getElementById("playerForm");
const playerFormError = document.getElementById("playerFormError");
const closeFormButton = document.getElementById("closeFormButton");
const nameInput = document.getElementById("nameInput");
const schoolInput = document.getElementById("schoolInput");
const emailInput = document.getElementById("emailInput");
const exportLoginTools = document.getElementById("exportLoginTools");
const exportTools = document.getElementById("exportTools");
const exportAdminEmailInput = document.getElementById("exportAdminEmail");
const exportAccessKeyInput = document.getElementById("exportAccessKey");
const adminLoginError = document.getElementById("adminLoginError");
const adminLoginButton = document.getElementById("adminLoginButton");
const adminLossMessageInput = document.getElementById("adminLossMessageInput");
const adminLossTypeSelect = document.getElementById("adminLossTypeSelect");
const exportFromDateInput = document.getElementById("exportFromDate");
const exportToDateInput = document.getElementById("exportToDate");
const downloadExportButton = document.getElementById("downloadExportButton");
const entriesFromDateInput = document.getElementById("entriesFromDate");
const entriesToDateInput = document.getElementById("entriesToDate");
const entriesDateSortSelect = document.getElementById("entriesDateSort");
const downloadEntriesExportButton = document.getElementById("downloadEntriesExportButton");
const entriesTableBody = document.getElementById("entriesTableBody");
const entriesCountBadge = document.getElementById("entriesCountBadge");
const entriesSummaryText = document.getElementById("entriesSummaryText");
const statTotalPrizesValue = document.getElementById("statTotalPrizesValue");
const statBigPrizesValue = document.getElementById("statBigPrizesValue");
const statRegularPrizesValue = document.getElementById("statRegularPrizesValue");
const adminEntryInput = document.getElementById("adminEntryInput");
const addAdminEntryButton = document.getElementById("addAdminEntryButton");
const adminEntriesList = document.getElementById("adminEntriesList");
const milestoneSpinRows = document.getElementById("milestoneSpinRows");
const addMilestoneSpinRowButton = document.getElementById("addMilestoneSpinRowButton");
const saveMilestoneSpinScheduleButton = document.getElementById("saveMilestoneSpinScheduleButton");
const regularPrizeRows = document.getElementById("regularPrizeRows");
const addRegularPrizeRowButton = document.getElementById("addRegularPrizeRowButton");
const saveRegularPrizeNamesButton = document.getElementById("saveRegularPrizeNamesButton");
const resetPrizeWinsButton = document.getElementById("resetPrizeWinsButton");
const spinCounterDateInput = document.getElementById("spinCounterDateInput");
const loadSpinCounterButton = document.getElementById("loadSpinCounterButton");
const spinCounterValueInput = document.getElementById("spinCounterValueInput");
const saveSpinCounterButton = document.getElementById("saveSpinCounterButton");
const spinCounterMetaText = document.getElementById("spinCounterMetaText");
const wheelFieldsCountBadge = document.getElementById("wheelFieldsCountBadge");
const prizeSearchInput = document.getElementById("prizeSearchInput");
const prizeSortSelect = document.getElementById("prizeSortSelect");
const wheelSection = document.querySelector(".wheel-section");
const sidebarItems = [...document.querySelectorAll(".sidebar-item")];
const adminTabButtons = [...document.querySelectorAll(".admin-tab-btn")];
const adminTabContents = [...document.querySelectorAll(".admin-tab-content")];

const siteUrl = (import.meta?.env?.VITE_SITE_URL || import.meta?.env?.NEXT_PUBLIC_SITE_URL || window.location.origin);
const adminLoginApiUrl = new URL("/api/admin/login", siteUrl).toString();
const publicEntriesApiUrl = new URL("/api/entries", siteUrl).toString();
const adminEntriesApiUrl = new URL("/api/admin/entries", siteUrl).toString();
const adminPrizeConfigApiUrl = new URL("/api/admin/prize-config", siteUrl).toString();
const publicPrizeConfigApiUrl = new URL("/api/prize-config", siteUrl).toString();
const adminMilestoneConfigApiUrl = new URL("/api/admin/milestone-config", siteUrl).toString();
const publicMilestoneConfigApiUrl = new URL("/api/milestone-config", siteUrl).toString();
const adminRegularPrizeConfigApiUrl = new URL("/api/admin/regular-prize-config", siteUrl).toString();
const publicRegularPrizeConfigApiUrl = new URL("/api/regular-prize-config", siteUrl).toString();
const adminPrizeWinApiUrl = new URL("/api/admin/prize-win", siteUrl).toString();
const adminResetPrizeWinsApiUrl = new URL("/api/admin/reset-prize-wins", siteUrl).toString();
const adminSpinCounterApiUrl = new URL("/api/admin/spin-counter", siteUrl).toString();
const participantsApiUrl = new URL("/api/participants", siteUrl).toString();
const spinResultsApiUrl = new URL("/api/winners", siteUrl).toString();
const spinCounterNextApiUrl = new URL("/api/spin-counter/next", siteUrl).toString();
const spinCounterNextFallbackApiUrl = new URL("/api/spin-counter-next", siteUrl).toString();
const spinCounterFlatApiUrl = new URL("/api/spin-counter", siteUrl).toString();
const participantsExportApiUrl = new URL("/api/participants/export", siteUrl).toString();
const storageKey = "spin-wheel-state-v1";
const regularSpinLossChance = 0.75;
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
let prizeConfigurations = {};
let draggedItem = null;
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

function setAdminLoginError(message = "") {
  if (adminLoginError) {
    adminLoginError.textContent = message;
  }
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
  setAdminLoginError("");
  adminModal.classList.add("is-visible");
  adminModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeAdminModal() {
  adminModal.classList.remove("is-visible");
  adminModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setActiveSidebarSection(sectionName) {
  sidebarItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.adminSection === sectionName);
  });
}

function activateAdminTab(tabName) {
  adminTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  adminTabContents.forEach((content) => {
    content.classList.toggle("active", content.id === `${tabName}-tab`);
  });
}

function setAdminSection(sectionName) {
  if (sectionName === "entries") {
    adminTabs?.classList.add("is-hidden");
    activateAdminTab("export");
    if (adminSectionTitle) {
      adminSectionTitle.textContent = "Entries";
    }
    if (adminSectionSubtitle) {
      adminSectionSubtitle.textContent = "View all registrations, sort by date, and export to Excel.";
    }
    setActiveSidebarSection("entries");
    return;
  }

  adminTabs?.classList.remove("is-hidden");
  if (!adminTabButtons.some((button) => button.classList.contains("active"))) {
    activateAdminTab("prizes");
  }
  if (adminSectionTitle) {
    adminSectionTitle.textContent = "Prize Settings";
  }
  if (adminSectionSubtitle) {
    adminSectionSubtitle.textContent = "Manage the prizes and odds for your wheel.";
  }
  setActiveSidebarSection("prizes");
}

let milestoneSpinSchedule = {};
let regularSpinPrizeNames = [];
let lossMessages = {};
let lossTypes = {};

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value) {
  const dateKey = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : "";
}

function getMilestonePrizeNames() {
  return [...new Set(Object.values(milestoneSpinSchedule))].filter(Boolean);
}

function updatePrizeStats() {
  const totalPrizes = normalizeEntries(allEntries, true).length;
  const bigPrizes = getMilestonePrizeNames().length;
  const regularPrizes = normalizeRegularPrizeNames(regularSpinPrizeNames).length;

  if (statTotalPrizesValue) {
    statTotalPrizesValue.textContent = String(totalPrizes);
  }
  if (statBigPrizesValue) {
    statBigPrizesValue.textContent = String(bigPrizes);
  }
  if (statRegularPrizesValue) {
    statRegularPrizesValue.textContent = String(regularPrizes);
  }
}

function isMilestonePrize(prize) {
  const normalizedPrize = normalizeLabel(prize);
  return getMilestonePrizeNames().some((milestonePrize) => {
    const normalizedMilestone = normalizeLabel(milestonePrize);
    return normalizedPrize === normalizedMilestone
      || normalizedPrize.includes(normalizedMilestone)
      || normalizedMilestone.includes(normalizedPrize);
  });
}

function normalizeRegularPrizeNames(prizes) {
  if (!Array.isArray(prizes)) {
    return [];
  }

  return [...new Set(
    prizes
      .map((prize) => String(prize || "").trim())
      .filter(Boolean)
  )];
}

function parseRegularPrizeNamesInput(value) {
  return normalizeRegularPrizeNames(
    String(value || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function formatRegularPrizeNamesForInput(prizes) {
  return normalizeRegularPrizeNames(prizes).join(", ");
}

function isRegularSpinPrize(prize) {
  const normalizedPrize = normalizeLabel(prize);
  return regularSpinPrizeNames.some((regularPrize) => {
    const normalizedRegular = normalizeLabel(regularPrize);
    return normalizedPrize === normalizedRegular
      || normalizedPrize.includes(normalizedRegular)
      || normalizedRegular.includes(normalizedPrize);
  });
}

function getPrizeConfigForEntry(prize) {
  return prizeConfigurations[normalizeLabel(prize)] || null;
}

function getLossMessageForEntry(prize) {
  const normalizedPrize = normalizeLabel(prize);
  const configuredMessage = String(getPrizeConfigForEntry(prize)?.lossMessage || "").trim();
  if (configuredMessage) {
    return configuredMessage;
  }
  return String(lossMessages[normalizedPrize] || "").trim();
}

function getLossTypeForEntry(prize) {
  const normalizedPrize = normalizeLabel(prize);
  const configuredType = String(getPrizeConfigForEntry(prize)?.lossType || "").trim().toLowerCase();
  if (configuredType === "loss" || configuredType === "free-spin") {
    return configuredType;
  }
  const mappedType = String(lossTypes[normalizedPrize] || "").trim().toLowerCase();
  return mappedType === "free-spin" ? "free-spin" : (mappedType === "loss" ? "loss" : "");
}

function isLossEntry(prize) {
  return Boolean(getLossTypeForEntry(prize)) || (!isMilestonePrize(prize) && !isRegularSpinPrize(prize));
}

function isFreeSpinEntry(prize) {
  return getLossTypeForEntry(prize) === "free-spin";
}

function normalizeMilestoneSchedule(schedule) {
  if (!schedule || typeof schedule !== "object") {
    return {};
  }

  const normalized = {};
  Object.entries(schedule).forEach(([spinNumber, prizeName]) => {
    const numericSpinNumber = Number(spinNumber);
    const cleanedPrizeName = String(prizeName || "").trim();
    if (!Number.isInteger(numericSpinNumber) || numericSpinNumber <= 0 || !cleanedPrizeName) {
      return;
    }
    normalized[String(numericSpinNumber)] = cleanedPrizeName;
  });

  return normalized;
}

function parseMilestoneScheduleInput(value) {
  const schedule = {};
  const entries = String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  entries.forEach((entry) => {
    const [spinText, ...prizeParts] = entry.split("=");
    const spinNumber = Number(String(spinText || "").trim());
    const prizeName = prizeParts.join("=").trim();

    if (!Number.isInteger(spinNumber) || spinNumber <= 0 || !prizeName) {
      return;
    }

    schedule[String(spinNumber)] = prizeName;
  });

  return normalizeMilestoneSchedule(schedule);
}

function formatMilestoneScheduleForInput(schedule) {
  return Object.entries(normalizeMilestoneSchedule(schedule))
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([spinNumber, prizeName]) => `${spinNumber}=${prizeName}`)
    .join(", ");
}

function createMilestoneRow(spinNumber = "", prizeName = "") {
  const row = document.createElement("div");
  row.className = "milestone-spin-row";

  const spinField = document.createElement("div");
  spinField.className = "milestone-spin-field";
  const spinLabel = document.createElement("label");
  spinLabel.textContent = "Spin";
  const spinInput = document.createElement("input");
  spinInput.type = "number";
  spinInput.min = "1";
  spinInput.step = "1";
  spinInput.className = "milestone-spin-number";
  spinInput.placeholder = "20";
  spinInput.value = spinNumber;
  spinField.append(spinLabel, spinInput);

  const prizeField = document.createElement("div");
  prizeField.className = "milestone-spin-field";
  const prizeLabel = document.createElement("label");
  prizeLabel.textContent = "Prize";
  const prizeInput = document.createElement("input");
  prizeInput.type = "text";
  prizeInput.className = "milestone-spin-prize";
  prizeInput.placeholder = "Pilot";
  prizeInput.value = prizeName;
  prizeField.append(prizeLabel, prizeInput);

  row.append(spinField, prizeField);
  return row;
}

function renderMilestoneSpinRows(schedule) {
  if (!milestoneSpinRows) {
    return;
  }

  milestoneSpinRows.innerHTML = "";
  const entries = Object.entries(normalizeMilestoneSchedule(schedule)).sort(([left], [right]) => Number(left) - Number(right));

  if (entries.length === 0) {
    milestoneSpinRows.appendChild(createMilestoneRow());
    return;
  }

  entries.forEach(([spinNumber, prizeName]) => {
    milestoneSpinRows.appendChild(createMilestoneRow(spinNumber, prizeName));
  });

  milestoneSpinRows.appendChild(createMilestoneRow());
}

function collectMilestoneRows() {
  if (!milestoneSpinRows) {
    return {};
  }

  const schedule = {};
  const rowElements = [...milestoneSpinRows.querySelectorAll(".milestone-spin-row")];

  rowElements.forEach((row) => {
    const spinInput = row.querySelector(".milestone-spin-number");
    const prizeInput = row.querySelector(".milestone-spin-prize");
    const spinNumber = Number(String(spinInput?.value || "").trim());
    const prizeName = String(prizeInput?.value || "").trim();

    if (!Number.isInteger(spinNumber) || spinNumber <= 0 || !prizeName) {
      return;
    }

    schedule[String(spinNumber)] = prizeName;
  });

  return normalizeMilestoneSchedule(schedule);
}

function createRegularPrizeRow(prizeName = "") {
  const row = document.createElement("div");
  row.className = "regular-prize-row";

  const prizeInput = document.createElement("input");
  prizeInput.type = "text";
  prizeInput.className = "regular-prize-input";
  prizeInput.placeholder = "Prize name";
  prizeInput.value = prizeName;

  row.append(prizeInput);
  return row;
}

function renderRegularPrizeRows(names) {
  if (!regularPrizeRows) {
    return;
  }

  regularPrizeRows.innerHTML = "";
  const cleanedNames = normalizeRegularPrizeNames(names);

  if (cleanedNames.length === 0) {
    regularPrizeRows.appendChild(createRegularPrizeRow());
    return;
  }

  cleanedNames.forEach((name) => {
    regularPrizeRows.appendChild(createRegularPrizeRow(name));
  });

  regularPrizeRows.appendChild(createRegularPrizeRow());
}

function collectRegularPrizeRows() {
  if (!regularPrizeRows) {
    return [];
  }

  return normalizeRegularPrizeNames(
    [...regularPrizeRows.querySelectorAll(".regular-prize-input")]
      .map((input) => input.value)
      .filter((value) => value && value.trim())
  );
}

async function persistEntriesOrder(nextEntries) {
  const headers = getAdminRequestHeaders();
  if (!headers) {
    return normalizeEntries(nextEntries, true);
  }

  const response = await fetch(adminEntriesApiUrl, {
    method: "PUT",
    cache: "no-store",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order: nextEntries }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  const payload = await response.json();
  return normalizeEntries(payload.entries, true);
}

async function syncRegularPrizeEntries(nextNames, options = {}) {
  const { persist = false } = options;
  const normalizedNext = normalizeRegularPrizeNames(nextNames);
  const previousRegularNames = new Set(regularSpinPrizeNames.map((entry) => normalizeLabel(entry)).filter(Boolean));
  const nextRegularNames = new Set(normalizedNext.map((entry) => normalizeLabel(entry)).filter(Boolean));
  const retainedEntries = normalizeEntries(allEntries, true).filter((entry) => {
    const normalized = normalizeLabel(entry);
    if (!normalized) {
      return false;
    }
    if (!previousRegularNames.has(normalized)) {
      return true;
    }
    return nextRegularNames.has(normalized);
  });
  const nextEntries = [...retainedEntries];
  normalizedNext.forEach((entry) => {
    const normalized = normalizeLabel(entry);
    if (!normalized || nextEntries.some((currentEntry) => normalizeLabel(currentEntry) === normalized)) {
      return;
    }
    nextEntries.push(entry);
  });

  const uniqueEntries = [];
  const seen = new Set();
  nextEntries.forEach((entry) => {
    const label = normalizeLabel(entry);
    if (!label || seen.has(label)) {
      return;
    }
    seen.add(label);
    uniqueEntries.push(entry);
  });

  allEntries = normalizeEntries(uniqueEntries, true);
  regularSpinPrizeNames = normalizedNext;

  if (persist) {
    allEntries = await persistEntriesOrder(allEntries);
  }

  renderAdminEntries(allEntries);
  applyEntriesUpdate(allEntries);
}

async function syncMilestonePrizeEntries(nextSchedule, options = {}) {
  const { persist = false } = options;
  const previousSchedule = normalizeMilestoneSchedule(milestoneSpinSchedule || {});
  const normalizedSchedule = normalizeMilestoneSchedule(nextSchedule);
  const nextEntries = normalizeEntries(allEntries, true);
  const nextNames = [...new Set(Object.values(normalizedSchedule).filter(Boolean))];
  const previousNamesBySpin = new Map(Object.entries(previousSchedule));
  const nextNamesBySpin = new Map(Object.entries(normalizedSchedule));
  const removedMilestoneLabels = [];

  previousNamesBySpin.forEach((previousPrizeName, spinNumber) => {
    const nextPrizeName = nextNamesBySpin.get(spinNumber);
    const normalizedPrevious = normalizeLabel(previousPrizeName);
    const normalizedNext = normalizeLabel(nextPrizeName || "");
    if (normalizedPrevious && normalizedPrevious !== normalizedNext) {
      removedMilestoneLabels.push(normalizedPrevious);
    }
  });

  removedMilestoneLabels.forEach((normalizedLabelToRemove) => {
    const entryIndex = nextEntries.findIndex((entry) => normalizeLabel(entry) === normalizedLabelToRemove);
    if (entryIndex >= 0) {
      nextEntries.splice(entryIndex, 1);
    }
  });

  nextNames.forEach((entry) => {
    const normalized = normalizeLabel(entry);
    if (!normalized || nextEntries.some((currentEntry) => normalizeLabel(currentEntry) === normalized)) {
      return;
    }
    nextEntries.push(entry);
  });

  const uniqueEntries = [];
  const seen = new Set();
  nextEntries.forEach((entry) => {
    const label = normalizeLabel(entry);
    if (!label || seen.has(label)) {
      return;
    }
    seen.add(label);
    uniqueEntries.push(entry);
  });

  allEntries = normalizeEntries(uniqueEntries, true);
  milestoneSpinSchedule = normalizedSchedule;

  if (persist) {
    allEntries = await persistEntriesOrder(allEntries);
  }

  renderAdminEntries(allEntries);
  applyEntriesUpdate(allEntries);
}

function getMilestonePrizeForSpin(spinNumber) {
  if (spinNumber <= 0) {
    return null;
  }

  return milestoneSpinSchedule[String(spinNumber)] || null;
}

function findEntryInWheel(targetLabel) {
  if (!targetLabel) return null;
  const normalizedTarget = normalizeLabel(targetLabel);
  const exactMatchIndex = entries.findIndex((entry) => normalizeLabel(entry) === normalizedTarget);
  if (exactMatchIndex >= 0) {
    return exactMatchIndex;
  }

  const partialMatchIndex = entries.findIndex((entry) => {
    const normalizedEntry = normalizeLabel(entry);
    return normalizedEntry.includes(normalizedTarget) || normalizedTarget.includes(normalizedEntry);
  });
  return partialMatchIndex >= 0 ? partialMatchIndex : null;
}

function getPointerAngle() {
  if (!pointer || !canvas) {
    return -Math.PI / 2;
  }

  const wheelRect = canvas.getBoundingClientRect();
  const pointerRect = pointer.getBoundingClientRect();
  const centerX = wheelRect.left + wheelRect.width / 2;
  const centerY = wheelRect.top + wheelRect.height / 2;
  const tipX = pointerRect.left + pointerRect.width / 2;
  const tipY = pointerRect.top + pointerRect.height;
  const angle = Math.atan2(tipY - centerY, tipX - centerX);

  return Number.isFinite(angle) ? angle : -Math.PI / 2;
}

function normalizeLabel(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLossMessages(messages) {
  if (!messages || typeof messages !== "object" || Array.isArray(messages)) {
    return {};
  }

  return Object.entries(messages).reduce((acc, [label, message]) => {
    const normalizedLabel = normalizeLabel(label);
    const cleanedMessage = String(message || "").trim();
    if (normalizedLabel && cleanedMessage) {
      acc[normalizedLabel] = cleanedMessage;
    }
    return acc;
  }, {});
}

function normalizeLossTypes(types) {
  if (!types || typeof types !== "object" || Array.isArray(types)) {
    return {};
  }

  return Object.entries(types).reduce((acc, [label, type]) => {
    const normalizedLabel = normalizeLabel(label);
    const cleanedType = String(type || "").trim().toLowerCase();
    if (normalizedLabel && (cleanedType === "loss" || cleanedType === "free-spin")) {
      acc[normalizedLabel] = cleanedType;
    }
    return acc;
  }, {});
}

function deriveLossMetadataFromPrizeConfigs(prizeConfigs) {
  const nextMessages = {};
  const nextTypes = {};
  if (!Array.isArray(prizeConfigs)) {
    return { lossMessages: nextMessages, lossTypes: nextTypes };
  }

  prizeConfigs.forEach((config) => {
    const normalizedLabel = normalizeLabel(config?.prizeName || "");
    if (!normalizedLabel) {
      return;
    }
    const message = String(config?.lossMessage || "").trim();
    const type = String(config?.lossType || "").trim().toLowerCase();
    if (message) {
      nextMessages[normalizedLabel] = message;
    }
    if (type === "loss" || type === "free-spin") {
      nextTypes[normalizedLabel] = type;
    }
  });

  return { lossMessages: nextMessages, lossTypes: nextTypes };
}

function syncLossMetadataFromPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return;
  }

  const hasLossMessages = Object.prototype.hasOwnProperty.call(payload, "lossMessages")
    || Object.prototype.hasOwnProperty.call(payload, "messages");
  const hasLossTypes = Object.prototype.hasOwnProperty.call(payload, "lossTypes")
    || Object.prototype.hasOwnProperty.call(payload, "types");

  const payloadLossMessages = hasLossMessages
    ? normalizeLossMessages(payload.lossMessages || payload.messages || {})
    : null;
  const payloadLossTypes = hasLossTypes
    ? normalizeLossTypes(payload.lossTypes || payload.types || {})
    : null;

  const derived = deriveLossMetadataFromPrizeConfigs(payload.prizeConfigs);

  if (payloadLossMessages) {
    lossMessages = { ...derived.lossMessages, ...payloadLossMessages };
  } else if (Object.keys(derived.lossMessages).length > 0) {
    lossMessages = derived.lossMessages;
  }

  if (payloadLossTypes) {
    lossTypes = { ...derived.lossTypes, ...payloadLossTypes };
  } else if (Object.keys(derived.lossTypes).length > 0) {
    lossTypes = derived.lossTypes;
  }
}

function formatLossHeadline(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) {
    return "LOSS!";
  }

  return `${cleaned
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : "")
    .join(" ")}!`;
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

function getDateKeyFromIso(value) {
  const date = new Date(String(value || "").trim());
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatSubmittedAt(value) {
  const date = new Date(String(value || "").trim());
  if (Number.isNaN(date.getTime())) {
    return String(value || "").trim() || "—";
  }

  return date.toLocaleString();
}

function getParticipantsDateBounds(participants = []) {
  const dateKeys = participants
    .map((participant) => getDateKeyFromIso(participant.submittedAt))
    .filter(Boolean)
    .sort();

  if (dateKeys.length === 0) {
    return null;
  }

  return { fromDate: dateKeys[0], toDate: dateKeys[dateKeys.length - 1] };
}

function getEntriesFilters() {
  const fromDate = normalizeDateKey(entriesFromDateInput?.value);
  const toDate = normalizeDateKey(entriesToDateInput?.value);
  const sortOrder = entriesDateSortSelect?.value === "oldest" ? "oldest" : "newest";
  return { fromDate, toDate, sortOrder };
}

function getFilteredParticipants({ fromDate, toDate, sortOrder }) {
  const participants = normalizeParticipants(state.participants);
  const filteredParticipants = participants.filter((participant) => {
    const dateKey = getDateKeyFromIso(participant.submittedAt);
    if (!dateKey) {
      return false;
    }
    if (fromDate && dateKey < fromDate) {
      return false;
    }
    if (toDate && dateKey > toDate) {
      return false;
    }
    return true;
  });

  filteredParticipants.sort((left, right) => {
    const leftTime = new Date(left.submittedAt).getTime();
    const rightTime = new Date(right.submittedAt).getTime();
    if (sortOrder === "oldest") {
      return leftTime - rightTime;
    }
    return rightTime - leftTime;
  });

  return filteredParticipants;
}

function renderEntriesTable() {
  if (!entriesTableBody || !entriesSummaryText || !entriesCountBadge) {
    return;
  }

  if (!exportAdminSession) {
    entriesTableBody.innerHTML = "";
    entriesSummaryText.textContent = "Sign in as admin to view entries.";
    entriesCountBadge.textContent = "0 entries";
    return;
  }

  const { fromDate, toDate, sortOrder } = getEntriesFilters();
  if (fromDate && toDate && fromDate > toDate) {
    entriesTableBody.innerHTML = "";
    entriesSummaryText.textContent = "From date must be before or equal to To date.";
    entriesCountBadge.textContent = "0 entries";
    return;
  }

  const filteredParticipants = getFilteredParticipants({ fromDate, toDate, sortOrder });
  entriesTableBody.innerHTML = "";

  if (filteredParticipants.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No entries found for the selected date filter.";
    row.appendChild(cell);
    entriesTableBody.appendChild(row);
  } else {
    filteredParticipants.forEach((participant) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const schoolCell = document.createElement("td");
      const emailCell = document.createElement("td");
      const submittedAtCell = document.createElement("td");
      nameCell.textContent = participant.fullName || participant.name || "—";
      schoolCell.textContent = participant.school || "—";
      emailCell.textContent = participant.email || "—";
      submittedAtCell.textContent = formatSubmittedAt(participant.submittedAt);
      row.append(nameCell, schoolCell, emailCell, submittedAtCell);
      entriesTableBody.appendChild(row);
    });
  }

  entriesCountBadge.textContent = `${filteredParticipants.length} ${filteredParticipants.length === 1 ? "entry" : "entries"}`;
  const rangeText = fromDate || toDate
    ? `Filtered by ${fromDate || "start"} to ${toDate || "today"}`
    : "Showing all dates";
  entriesSummaryText.textContent = `${rangeText} • Sorted ${sortOrder === "oldest" ? "oldest first" : "newest first"}.`;
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
    renderEntriesTable();
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

async function downloadParticipantsExport(options = {}) {
  const fromInput = options.fromInput || exportFromDateInput;
  const toInput = options.toInput || exportToDateInput;
  const downloadButton = options.button || downloadExportButton;
  const sourceLabel = options.sourceLabel || "registrations";

  if (!exportAdminSession) {
    resultText.textContent = "Admin login is required before downloading registrations.";
    return;
  }

  const fromDate = normalizeDateKey(fromInput?.value);
  const toDate = normalizeDateKey(toInput?.value);

  if (!fromDate || !toDate) {
    resultText.textContent = "Select both From and To dates before downloading.";
    return;
  }

  if (fromDate > toDate) {
    resultText.textContent = "The From date must be earlier than or equal to the To date.";
    return;
  }

  const originalButtonText = downloadButton?.textContent || "Download Excel";
  if (downloadButton) {
    downloadButton.disabled = true;
    downloadButton.textContent = "Preparing Excel...";
  }

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
    resultText.textContent = `Downloaded ${sourceLabel} from ${fromDate} to ${toDate}.`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not download registrations (${message}).`;
  } finally {
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.textContent = originalButtonText;
    }
  }
}

async function downloadEntriesExport() {
  if (!exportAdminSession) {
    resultText.textContent = "Admin login is required before downloading entries.";
    return;
  }

  if (!entriesFromDateInput || !entriesToDateInput) {
    resultText.textContent = "Entries date fields are not available.";
    return;
  }

  const fromDate = normalizeDateKey(entriesFromDateInput.value);
  const toDate = normalizeDateKey(entriesToDateInput.value);
  if (!fromDate || !toDate) {
    const bounds = getParticipantsDateBounds(normalizeParticipants(state.participants));
    if (!bounds) {
      resultText.textContent = "No entries available to export.";
      return;
    }
    entriesFromDateInput.value = bounds.fromDate;
    entriesToDateInput.value = bounds.toDate;
  }

  await downloadParticipantsExport({
    fromInput: entriesFromDateInput,
    toInput: entriesToDateInput,
    button: downloadEntriesExportButton,
    sourceLabel: "entries",
  });
}

async function handleAdminLogin() {
  const email = exportAdminEmailInput.value.trim().toLowerCase();
  const accessKey = exportAccessKeyInput.value.trim();

  if (!email || !accessKey) {
    setAdminLoginError("Enter your email and access key to log in.");
    return;
  }

  setAdminLoginError("");
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
    setAdminLoginError("");
    await loadAdminEntries();
    await loadPrizeConfigurations();
    await loadMilestoneSchedule();
    await loadRegularPrizeNames();
    await loadAdminSpinCounter({ announceResult: false });
    renderEntriesTable();
    resultText.textContent = "Admin login successful.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const loginMessage = message === "Invalid admin credentials."
      ? "Incorrect email or access key."
      : message;
    setAdminLoginError(loginMessage);
    resultText.textContent = `Admin login failed (${message}).`;
  } finally {
    adminLoginButton.disabled = false;
    adminLoginButton.textContent = originalText;
  }
}

async function loadAdminSpinCounter({ dateKey, announceResult = true } = {}) {
    const headers = getAdminRequestHeaders();
    if (!headers) {
      if (announceResult) {
        resultText.textContent = "Admin login is required before viewing spin counters.";
      }
      return;
    }

    const chosenDateKey = normalizeDateKey(dateKey)
      || normalizeDateKey(spinCounterDateInput?.value)
      || getTodayDateKey();
    const url = new URL(adminSpinCounterApiUrl);
    url.searchParams.set("dateKey", chosenDateKey);

    try {
      const response = await fetch(url.toString(), {
        cache: "no-store",
        headers,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Request failed (${response.status})`);
      }

      const payload = await response.json();
      const spinDateKey = normalizeDateKey(payload.spinDateKey) || chosenDateKey;
      const spinNumber = Number(payload.spinNumber);
      if (!Number.isInteger(spinNumber) || spinNumber < 0) {
        throw new Error("Server returned an invalid counter value.");
      }

      if (spinCounterDateInput) {
        spinCounterDateInput.value = spinDateKey;
      }
      if (spinCounterValueInput) {
        spinCounterValueInput.value = String(spinNumber);
      }
      if (spinCounterMetaText) {
        spinCounterMetaText.textContent = payload.exists
          ? `Counter for ${spinDateKey}: ${spinNumber} spin(s).`
          : `No counter exists yet for ${spinDateKey}. Current value is 0 until you save.`;
      }
      if (announceResult) {
        resultText.textContent = `Loaded counter for ${spinDateKey}.`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      resultText.textContent = `Could not load spin counter (${message}).`;
    }
  }

async function saveAdminSpinCounter() {
    const headers = getAdminRequestHeaders();
    if (!headers) {
      resultText.textContent = "Admin login is required before editing spin counters.";
      return;
    }

    const spinDateKey = normalizeDateKey(spinCounterDateInput?.value) || getTodayDateKey();
    const spinNumber = Number(spinCounterValueInput?.value);
    if (!Number.isInteger(spinNumber) || spinNumber < 0) {
      resultText.textContent = "Enter a whole number greater than or equal to 0 for the counter.";
      return;
    }

    const originalButtonText = saveSpinCounterButton?.textContent || "Save counter";
    if (saveSpinCounterButton) {
      saveSpinCounterButton.disabled = true;
      saveSpinCounterButton.textContent = "Saving...";
    }

    try {
      const response = await fetch(adminSpinCounterApiUrl, {
        method: "POST",
        cache: "no-store",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey: spinDateKey, spinNumber }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Request failed (${response.status})`);
      }

      const payload = await response.json();
      const savedDateKey = normalizeDateKey(payload.spinDateKey) || spinDateKey;
      if (spinCounterDateInput) {
        spinCounterDateInput.value = savedDateKey;
      }
      if (spinCounterValueInput) {
        spinCounterValueInput.value = String(spinNumber);
      }
      if (spinCounterMetaText) {
        spinCounterMetaText.textContent = `Counter for ${savedDateKey}: ${spinNumber} spin(s).`;
      }
      resultText.textContent = `Saved counter for ${savedDateKey}.`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      resultText.textContent = `Could not save spin counter (${message}).`;
    } finally {
      if (saveSpinCounterButton) {
        saveSpinCounterButton.disabled = false;
        saveSpinCounterButton.textContent = originalButtonText;
      }
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
  const configuredEntries = getConfiguredWheelEntries(allEntries);
  const currentAvailable = normalizeEntries(state.availableEntries, true);
  entries = Object.keys(prizeConfigurations).length > 0
    ? configuredEntries
    : reconcileAvailableEntries(currentAvailable, configuredEntries);
  state.initialized = true;
  state.availableEntries = [...entries];
  state.currentRotation = currentRotation;
  saveState();
  drawWheel(currentRotation);
  updateSpinAvailability();
}

function handleEntryDragStart(event) {
  console.log("Drag start:", this.dataset.entry);
  draggedItem = this;
  this.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", this.dataset.entry);
}

function handleEntryDragEnter(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleEntryDragOver(event) {
  console.log("Drag over:", this.dataset.entry);
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  
  if (this !== draggedItem && draggedItem) {
    this.classList.add("is-drag-over");
  }

  // Auto-scroll the list container
  const listContainer = adminEntriesList;
  const rect = this.getBoundingClientRect();
  const containerRect = listContainer.getBoundingClientRect();
  
  const scrollThreshold = 50;
  const scrollSpeed = 5;
  
  // Scroll down if near bottom
  if (containerRect.bottom - rect.bottom < scrollThreshold) {
    listContainer.scrollTop += scrollSpeed;
  }
  
  // Scroll up if near top
  if (rect.top - containerRect.top < scrollThreshold) {
    listContainer.scrollTop -= scrollSpeed;
  }
}

function handleEntryDragLeave(event) {
  if (event.target === this) {
    this.classList.remove("is-drag-over");
  }
}

async function handleEntryDrop(event) {
  console.log("Drop event on:", this.dataset.entry);
  event.preventDefault();
  event.stopPropagation();
  
  this.classList.remove("is-drag-over");
  
  if (this === draggedItem) {
    console.log("Dropped on itself, ignoring");
    return;
  }
  
  if (!draggedItem) {
    console.log("No dragged item, ignoring");
    return;
  }
  
  const draggedEntry = draggedItem.dataset.entry;
  const targetEntry = this.dataset.entry;
  
  if (!draggedEntry || !targetEntry) {
    console.log("Missing entry data");
    return;
  }
  
  console.log(`Reordering: ${draggedEntry} -> ${targetEntry}`);
  
  // Reorder the entries array
  const currentIndex = allEntries.indexOf(draggedEntry);
  const targetIndex = allEntries.indexOf(targetEntry);
  
  console.log(`Current index: ${currentIndex}, Target index: ${targetIndex}`);
  
  if (currentIndex !== -1 && targetIndex !== -1 && currentIndex !== targetIndex) {
    allEntries.splice(currentIndex, 1);
    allEntries.splice(targetIndex, 0, draggedEntry);
    
    console.log("New order:", allEntries);
    
    // Send the new order to the backend
    const headers = getAdminRequestHeaders();
    if (!headers) {
      console.log("No admin headers");
      return;
    }
    
    try {
      const response = await fetch(adminEntriesApiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ order: allEntries }),
      });
      
      console.log("Server response status:", response.status);
      
      if (response.ok) {
        const payload = await response.json();
        console.log("Server returned entries:", payload.entries);
        syncLossMetadataFromPayload(payload);
        const list = normalizeEntries(payload.entries, true);
        if (Array.isArray(payload.prizeConfigs)) {
          prizeConfigurations = {};
          payload.prizeConfigs.forEach((config) => {
            prizeConfigurations[normalizeLabel(config.prizeName)] = {
              maxWins: config.maxWins || 1,
              currentWins: config.currentWins || 0,
              isEternal: config.isEternal || false,
              isDisabled: config.isDisabled || false,
              lossMessage: config.lossMessage || "",
              lossType: config.lossType || "",
            };
          });
        }
        await loadPrizeConfigurations();
        applyEntriesUpdate(list);
        renderAdminEntries(list);
        resultText.textContent = "Wheel entries reordered.";
      } else {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Request failed (${response.status})`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Drop error:", message);
      resultText.textContent = `Could not reorder entries (${message}).`;
      // Restore the original order
      allEntries.splice(targetIndex, 1);
      allEntries.splice(currentIndex, 0, draggedEntry);
      renderAdminEntries(allEntries);
    }
  } else {
    console.log("Invalid indices or same position");
  }
}

function handleEntryDragEnd(event) {
  console.log("🏁 Drag end");
  draggedItem = null;
  document.querySelectorAll(".admin-entries-item").forEach(item => {
    item.classList.remove("is-dragging");
    item.classList.remove("is-drag-over");
  });
}

function renderAdminEntries(adminEntries) {
  adminEntriesList.innerHTML = "";
  updatePrizeStats();

  const searchTerm = (prizeSearchInput?.value || "").toLowerCase().trim();
  const sortMode = prizeSortSelect?.value || "default";
  
  // Filter entries based on search term
  const filteredEntries = searchTerm 
    ? adminEntries.filter(entry => entry.toLowerCase().includes(searchTerm))
    : adminEntries;
  const sortedEntries = [...filteredEntries];
  if (sortMode === "forever-first") {
    sortedEntries.sort((a, b) => Number(isForeverPrize(b)) - Number(isForeverPrize(a)) || a.localeCompare(b));
  } else if (sortMode === "removable-first") {
    sortedEntries.sort((a, b) => Number(isForeverPrize(a)) - Number(isForeverPrize(b)) || a.localeCompare(b));
  } else if (sortMode === "name-asc") {
    sortedEntries.sort((a, b) => a.localeCompare(b));
  }

  if (sortedEntries.length === 0) {
    if (wheelFieldsCountBadge) {
      wheelFieldsCountBadge.textContent = "0 fields";
    }
    const emptyItem = document.createElement("li");
    emptyItem.className = "admin-entries-item";
    emptyItem.innerHTML = searchTerm 
      ? `<span class="admin-entries-item__label">No wheel fields match "${searchTerm}"</span>`
      : "<span class=\"admin-entries-item__label\">No wheel fields configured.</span>";
    adminEntriesList.appendChild(emptyItem);
    return;
  }

  if (wheelFieldsCountBadge) {
    wheelFieldsCountBadge.textContent = `${sortedEntries.length} ${sortedEntries.length === 1 ? "field" : "fields"}`;
  }

  const fragment = document.createDocumentFragment();

  sortedEntries.forEach((entry, displayIndex) => {
   const item = document.createElement("li");
   item.className = "admin-entries-item";
   item.draggable = true;
   item.dataset.entry = entry;
   // Store the original index in allEntries for proper reordering
   item.dataset.originalIndex = allEntries.indexOf(entry);

   const normalized = normalizeLabel(entry);
   const config = prizeConfigurations[normalized] || { maxWins: 1, currentWins: 0, isEternal: false, isDisabled: false };
   prizeConfigurations[normalized] = config;
   const localPrizeWins = getLocalPrizeWinCount(entry);
   const displayedWins = Math.max(config.currentWins || 0, localPrizeWins);
   const lossEntry = isLossEntry(entry);

   const label = document.createElement("span");
   label.className = "admin-entries-item__label";
   label.textContent = entry;

   const labelBlock = document.createElement("div");
   labelBlock.className = "admin-entries-item__label-block";
   labelBlock.appendChild(label);

   if (lossEntry) {
     const lossMessagePreview = document.createElement("span");
     lossMessagePreview.className = "admin-entries-item__loss-message";
     lossMessagePreview.textContent = getLossMessageForEntry(entry) || "No cute message saved.";
     labelBlock.appendChild(lossMessagePreview);
   }
     
   const configDiv = document.createElement("div");
   configDiv.className = "admin-entries-item__config";
    
   const maxWinsLabel = document.createElement("label");
   maxWinsLabel.className = "admin-entries-item__wins-label";
   maxWinsLabel.textContent = "Can be won:";
    
   const maxWinsSelect = document.createElement("select");
   maxWinsSelect.className = "admin-entries-item__wins-select";
   for (let i = 1; i <= 5; i++) {
     const option = document.createElement("option");
     option.value = i;
     option.textContent = i === 1 ? "1 time (removed)" : `${i} times`;
     if (config.maxWins === i) {
       option.selected = true;
     }
     maxWinsSelect.appendChild(option);
   }
    
   const eternalCheckbox = document.createElement("input");
   eternalCheckbox.type = "checkbox";
   eternalCheckbox.className = "admin-entries-item__eternal-checkbox";
   eternalCheckbox.checked = config.isEternal || false;
   const refreshRowConfigDisplay = () => {
     const isEternal = eternalCheckbox.checked;
     const isDisabled = Boolean(config.isDisabled);
     const configuredMaxWins = parseInt(maxWinsSelect.value, 10) || config.maxWins || 1;
     item.classList.toggle("is-forever", isEternal);
     item.classList.toggle("is-disabled", isDisabled);
     configDiv.style.display = isEternal || lossEntry ? "none" : "";
     winCountSpan.textContent = lossEntry
       ? (isDisabled ? "(Loss • Disabled)" : "(Loss)")
       : (isEternal
         ? (isDisabled ? "(Disabled • Forever)" : "(Forever)")
         : (isDisabled ? "(Disabled)" : `(Won ${displayedWins}/${configuredMaxWins})`));
   };

   const persistRowConfig = () => {
     const maxWins = parseInt(maxWinsSelect.value, 10);
     const isEternal = eternalCheckbox.checked;
     const isDisabled = Boolean(config.isDisabled);
     void updatePrizeConfiguration(entry, maxWins, isEternal, isDisabled);
   };

   eternalCheckbox.addEventListener("change", () => {
     config.isEternal = eternalCheckbox.checked;
     refreshRowConfigDisplay();
     persistRowConfig();
   });

   maxWinsSelect.addEventListener("change", () => {
     config.maxWins = parseInt(maxWinsSelect.value, 10) || config.maxWins || 1;
     refreshRowConfigDisplay();
     persistRowConfig();
   });

   const toggleActiveButton = document.createElement("button");
   toggleActiveButton.className = "admin-entries-item__toggle-active";
   toggleActiveButton.type = "button";

   const refreshToggleButton = () => {
     const isDisabled = Boolean(config.isDisabled);
     toggleActiveButton.textContent = isDisabled ? "Enable" : "Disable";
     toggleActiveButton.setAttribute("aria-label", isDisabled ? "Enable prize on wheel" : "Disable prize on wheel");
   };

   toggleActiveButton.addEventListener("click", () => {
     config.isDisabled = !config.isDisabled;
     refreshToggleButton();
     refreshRowConfigDisplay();
     initializeEntriesFromState();
     drawWheel(currentRotation);
     updateSpinAvailability();
     persistRowConfig();
   });

   refreshToggleButton();

   const deleteButton = document.createElement("button");
   deleteButton.className = "admin-entries-item__remove";
   deleteButton.type = "button";
   deleteButton.textContent = "Delete";
   deleteButton.addEventListener("click", () => {
     void removeAdminEntry(allEntries.indexOf(entry), entry);
   });

   configDiv.append(maxWinsLabel, maxWinsSelect);

   const winCountSpan = document.createElement("span");
   winCountSpan.className = "admin-entries-item__win-count";
   refreshRowConfigDisplay();

   const eternalContainer = document.createElement("div");
   eternalContainer.className = "admin-entries-item__eternal-container";
   eternalContainer.appendChild(eternalCheckbox);

   // Create drag handle
   const dragHandle = document.createElement("div");
   dragHandle.className = "admin-entries-item__drag-handle";
   dragHandle.textContent = "⋮⋮";
   dragHandle.title = "Click and drag to reorder entries";

   // Add drag event listeners
   item.addEventListener("dragstart", handleEntryDragStart);
   item.addEventListener("dragenter", handleEntryDragEnter);
   item.addEventListener("dragover", handleEntryDragOver);
   item.addEventListener("drop", handleEntryDrop);
   item.addEventListener("dragend", handleEntryDragEnd);
   item.addEventListener("dragleave", handleEntryDragLeave);

   item.append(dragHandle, eternalContainer, labelBlock, configDiv, winCountSpan, toggleActiveButton, deleteButton);
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
  syncLossMetadataFromPayload(payload);
  const list = normalizeEntries(payload.entries, true);
  if (Array.isArray(payload.prizeConfigs)) {
    prizeConfigurations = {};
    payload.prizeConfigs.forEach((config) => {
      prizeConfigurations[normalizeLabel(config.prizeName)] = {
        maxWins: config.maxWins || 1,
        currentWins: config.currentWins || 0,
        isEternal: config.isEternal || false,
        isDisabled: config.isDisabled || false,
        lossMessage: config.lossMessage || "",
        lossType: config.lossType || "",
      };
    });
  }
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
  const message = adminLossMessageInput?.value.trim() || "";
  const lossType = adminLossTypeSelect?.value === "free-spin" ? "free-spin" : "loss";
  if (!label) {
    resultText.textContent = "Enter an entry label before adding.";
    return;
  }
  if (!message) {
    resultText.textContent = "Enter the bottom message for this loss entry.";
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
      body: JSON.stringify({ label, message, lossType }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    const payload = await response.json();
    syncLossMetadataFromPayload(payload);
    const list = normalizeEntries(payload.entries, true);
    if (Array.isArray(payload.prizeConfigs)) {
      prizeConfigurations = {};
      payload.prizeConfigs.forEach((config) => {
        prizeConfigurations[normalizeLabel(config.prizeName)] = {
          maxWins: config.maxWins || 1,
          currentWins: config.currentWins || 0,
          isEternal: config.isEternal || false,
          isDisabled: config.isDisabled || false,
          lossMessage: config.lossMessage || "",
          lossType: config.lossType || "",
        };
      });
    }
    adminEntryInput.value = "";
    if (adminLossMessageInput) {
      adminLossMessageInput.value = "";
    }
    if (adminLossTypeSelect) {
      adminLossTypeSelect.value = "loss";
    }
    await loadPrizeConfigurations();
    renderAdminEntries(list);
    applyEntriesUpdate(list);
    resultText.textContent = payload.action === "updated"
      ? `Updated loss entry: ${label} with a custom loss message.`
      : `Added wheel entry: ${label}${message ? " with a custom loss message." : "."}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not add wheel entry (${message}).`;
  } finally {
    addAdminEntryButton.disabled = false;
    addAdminEntryButton.textContent = originalText;
  }
}

async function removeAdminEntry(index, entryLabel = "") {
  const headers = getAdminRequestHeaders();
  if (!headers) {
    resultText.textContent = "Admin login is required before managing entries.";
    return;
  }

  const removedEntry = entryLabel || allEntries[index];
  const normalizedRemovedEntry = normalizeLabel(removedEntry);

  try {
    const response = await fetch(adminEntriesApiUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ index, label: removedEntry }),
    });
    if (!response.ok) {
      if (response.status === 404) {
        await loadAdminEntries();
      }
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Request failed (${response.status})`);
    }

    const payload = await response.json();
    syncLossMetadataFromPayload(payload);
    const list = normalizeEntries(payload.entries, true);
    if (Array.isArray(payload.prizeConfigs)) {
      prizeConfigurations = {};
      payload.prizeConfigs.forEach((config) => {
        prizeConfigurations[normalizeLabel(config.prizeName)] = {
          maxWins: config.maxWins || 1,
          currentWins: config.currentWins || 0,
          isEternal: config.isEternal || false,
          isDisabled: config.isDisabled || false,
          lossMessage: config.lossMessage || "",
          lossType: config.lossType || "",
        };
      });
    }
    await loadPrizeConfigurations();
    let syncedConfigMessages = [];

    if (normalizedRemovedEntry) {
      const nextMilestoneSchedule = Object.fromEntries(
        Object.entries(milestoneSpinSchedule).filter(([, prizeName]) => normalizeLabel(prizeName) !== normalizedRemovedEntry)
      );
      const nextRegularPrizeNames = regularSpinPrizeNames.filter(
        (prizeName) => normalizeLabel(prizeName) !== normalizedRemovedEntry
      );
      const milestoneChanged = Object.keys(nextMilestoneSchedule).length !== Object.keys(milestoneSpinSchedule).length;
      const regularChanged = nextRegularPrizeNames.length !== regularSpinPrizeNames.length;

      if (milestoneChanged) {
        const milestoneResponse = await fetch(adminMilestoneConfigApiUrl, {
          method: "POST",
          cache: "no-store",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneSpinSchedule: nextMilestoneSchedule }),
        });
        if (!milestoneResponse.ok) {
          const milestonePayload = await milestoneResponse.json().catch(() => ({}));
          throw new Error(milestonePayload.error || `Could not sync milestone spins (${milestoneResponse.status})`);
        }
        milestoneSpinSchedule = normalizeMilestoneSchedule(nextMilestoneSchedule);
        renderMilestoneSpinRows(milestoneSpinSchedule);
        syncedConfigMessages.push("milestone schedule");
      }

      if (regularChanged) {
        const regularResponse = await fetch(adminRegularPrizeConfigApiUrl, {
          method: "POST",
          cache: "no-store",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ regularPrizeNames: nextRegularPrizeNames }),
        });
        if (!regularResponse.ok) {
          const regularPayload = await regularResponse.json().catch(() => ({}));
          throw new Error(regularPayload.error || `Could not sync regular prizes (${regularResponse.status})`);
        }
        regularSpinPrizeNames = normalizeRegularPrizeNames(nextRegularPrizeNames);
        renderRegularPrizeRows(regularSpinPrizeNames);
        syncedConfigMessages.push("regular prizes");
      }
    }

    renderAdminEntries(list);
    applyEntriesUpdate(list);
    resultText.textContent = syncedConfigMessages.length > 0
      ? `Prize deleted from wheel and ${syncedConfigMessages.join(" + ")}.`
      : "Prize deleted from wheel.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not delete prize (${message}).`;
  }
}

async function loadPrizeConfigurations() {
  const headers = getAdminRequestHeaders();
  const apiUrl = headers ? adminPrizeConfigApiUrl : publicPrizeConfigApiUrl;
  const requestHeaders = headers ? { headers } : {};
  try {
   const response = await fetch(apiUrl, {
    cache: "no-store",
    ...requestHeaders,
   });
   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   const payload = await response.json();
   prizeConfigurations = {};
   if (Array.isArray(payload.prizeConfigs)) {
     payload.prizeConfigs.forEach((config) => {
       prizeConfigurations[normalizeLabel(config.prizeName)] = {
         maxWins: config.maxWins || 1,
         currentWins: config.currentWins || 0,
         isEternal: config.isEternal || false,
         isDisabled: config.isDisabled || false,
         lossMessage: config.lossMessage || "",
         lossType: config.lossType || "",
       };
     });
   }
   initializeEntriesFromState();
   drawWheel(currentRotation);
   updateSpinAvailability();
  } catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   console.warn(`Could not load prize configurations (${message}).`);
  }
}

async function loadMilestoneSchedule() {
const headers = getAdminRequestHeaders();
const apiUrl = headers ? adminMilestoneConfigApiUrl : publicMilestoneConfigApiUrl;
const requestHeaders = headers ? { headers } : {};

try {
   const response = await fetch(apiUrl, {
     cache: "no-store",
     ...requestHeaders,
   });
   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   const payload = await response.json();
   const loadedSchedule = normalizeMilestoneSchedule(payload.milestoneSpinSchedule || payload.schedule || {});
   milestoneSpinSchedule = loadedSchedule;
   renderMilestoneSpinRows(loadedSchedule);
   await syncMilestonePrizeEntries(loadedSchedule, { persist: false });
} catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   console.warn(`Could not load milestone schedule (${message}).`);
   renderMilestoneSpinRows(milestoneSpinSchedule);
}
}

async function loadRegularPrizeNames() {
const headers = getAdminRequestHeaders();
const apiUrl = headers ? adminRegularPrizeConfigApiUrl : publicRegularPrizeConfigApiUrl;
const requestHeaders = headers ? { headers } : {};

try {
   const response = await fetch(apiUrl, {
     cache: "no-store",
     ...requestHeaders,
   });
   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   const payload = await response.json();
   const loadedNames = normalizeRegularPrizeNames(payload.regularPrizeNames || payload.prizes || []);
   regularSpinPrizeNames = loadedNames;
   renderRegularPrizeRows(loadedNames);
   await syncRegularPrizeEntries(loadedNames, { persist: false });
} catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   console.warn(`Could not load regular prize names (${message}).`);
   renderRegularPrizeRows(regularSpinPrizeNames);
}
}

async function saveMilestoneSchedule() {
const headers = getAdminRequestHeaders();
if (!headers) {
   resultText.textContent = "Admin login is required before editing milestone spins.";
   return;
}

const schedule = collectMilestoneRows();

try {
   const response = await fetch(adminMilestoneConfigApiUrl, {
     method: "POST",
     cache: "no-store",
     headers: { ...headers, "Content-Type": "application/json" },
     body: JSON.stringify({ milestoneSpinSchedule: schedule }),
   });

   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   const payload = await response.json();
   const savedSchedule = normalizeMilestoneSchedule(payload.milestoneSpinSchedule || payload.schedule || schedule);
   renderMilestoneSpinRows(savedSchedule);
   await syncMilestonePrizeEntries(savedSchedule, { persist: true });
   resultText.textContent = "Updated milestone prize spins.";
} catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   resultText.textContent = `Could not save milestone spins (${message}).`;
}
}

async function saveRegularPrizeNames() {
const headers = getAdminRequestHeaders();
if (!headers) {
   resultText.textContent = "Admin login is required before editing regular prize names.";
   return;
}

const names = collectRegularPrizeRows();

try {
   const response = await fetch(adminRegularPrizeConfigApiUrl, {
     method: "POST",
     cache: "no-store",
     headers: { ...headers, "Content-Type": "application/json" },
     body: JSON.stringify({ regularPrizeNames: names }),
   });

   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   const payload = await response.json();
   const savedNames = normalizeRegularPrizeNames(payload.regularPrizeNames || payload.prizes || names);
   renderRegularPrizeRows(savedNames);
   await syncRegularPrizeEntries(savedNames, { persist: true });
   resultText.textContent = names.length > 0 ? "Updated regular prize names." : "Cleared regular prize names.";
} catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   resultText.textContent = `Could not save regular prize names (${message}).`;
}
}

async function updatePrizeConfiguration(prizeName, maxWins, isEternal, isDisabled = false) {
  const headers = getAdminRequestHeaders();
  if (!headers) {
   resultText.textContent = "Admin login is required before managing prize configuration.";
   return;
  }

  try {
   const response = await fetch(adminPrizeConfigApiUrl, {
     method: "POST",
     cache: "no-store",
     headers: { ...headers, "Content-Type": "application/json" },
     body: JSON.stringify({ prizeName, maxWins, isEternal: isEternal || false, isDisabled: isDisabled || false }),
   });

   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   await loadPrizeConfigurations();
   const eternalText = isEternal ? " and stays forever" : "";
   const disabledText = isDisabled ? " and is disabled on the wheel" : "";
   resultText.textContent = `Updated ${prizeName} to be won up to ${maxWins} time(s)${eternalText}${disabledText}.`;
  } catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   resultText.textContent = `Could not update prize configuration (${message}).`;
  }
}

async function recordPrizeWin(prizeName) {
  const headers = getAdminRequestHeaders();
  if (!headers) {
   return;
  }

  try {
   const response = await fetch(adminPrizeWinApiUrl, {
     method: "POST",
     cache: "no-store",
     headers: { ...headers, "Content-Type": "application/json" },
     body: JSON.stringify({ prizeName }),
   });

   if (!response.ok) {
     throw new Error(`Failed to record prize win (${response.status})`);
   }

   await loadPrizeConfigurations();
  } catch (error) {
   console.warn(`Could not record prize win (${String(error)})`);
  }
}

async function recordSpinResult(result) {
  try {
    const response = await fetch(spinResultsApiUrl, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    if (!response.ok) {
      throw new Error(`Failed to record spin result (${response.status})`);
    }
  } catch (error) {
    console.warn(`Could not record spin result (${String(error)})`);
  }
}

async function reserveNextSpinNumber() {
  const candidateUrls = [
    spinCounterNextApiUrl,
    spinCounterNextFallbackApiUrl,
    spinCounterFlatApiUrl,
    "/api/spin-counter/next",
    "/api/spin-counter-next",
    "/api/spin-counter",
  ];
  let lastError = new Error("Unable to reserve spin number.");

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      const responseText = await response.text();

      let payload;
      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Spin counter endpoint returned HTML instead of JSON.");
      }

      if (!response.ok) {
        throw new Error(payload.error || `Failed to reserve spin number (${response.status})`);
      }

      const spinNumber = Number(payload?.spinNumber);
      const spinDateKey = String(payload?.spinDateKey || "").trim();
      if (!Number.isInteger(spinNumber) || spinNumber < 1 || !spinDateKey) {
        throw new Error("Server returned an invalid spin counter payload.");
      }

      return { spinNumber, spinDateKey };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError;
}

async function resetPrizeWinCounts() {
  const headers = getAdminRequestHeaders();
  if (!headers) {
   resultText.textContent = "Admin login is required before resetting.";
   return;
  }

  const originalButtonText = resetPrizeWinsButton?.textContent || "↻ Reset Win Counts";
  if (resetPrizeWinsButton) {
    resetPrizeWinsButton.disabled = true;
    resetPrizeWinsButton.classList.add("is-loading");
    resetPrizeWinsButton.textContent = "Resetting...";
  }

  try {
   const response = await fetch(adminResetPrizeWinsApiUrl, {
     method: "POST",
     cache: "no-store",
     headers,
   });

   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   // Reset local win history used for on-device max-win enforcement.
   state.wins = [];
   saveState();
   await loadPrizeConfigurations();
   initializeEntriesFromState();
   drawWheel(currentRotation);
   updateSpinAvailability();
   resultText.textContent = "All prize win counts have been reset.";
  } catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   resultText.textContent = `Could not reset prize win counts (${message}).`;
  } finally {
    if (resetPrizeWinsButton) {
      resetPrizeWinsButton.disabled = false;
      resetPrizeWinsButton.classList.remove("is-loading");
      resetPrizeWinsButton.textContent = originalButtonText;
    }
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
  const customSecondary = getLossMessageForEntry(winner);
  return {
    primary: formatLossHeadline(winner),
    secondary: customSecondary || "No message configured.",
  };
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
  if (isLossEntry(result.winner)) {
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
  if (playerFormError) {
    playerFormError.textContent = "";
  }
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
  if (playerFormError) {
    playerFormError.textContent = "";
  }
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

  const index = getWinningIndexForRotation(currentRotation);
  return entries[index] || "";
}

function getWinningIndexForRotation(rotation, pointerAngle = getPointerAngle()) {
  if (entries.length === 0) {
    return 0;
  }

  const fullCircle = Math.PI * 2;
  const normalized = ((pointerAngle - rotation) % fullCircle + fullCircle) % fullCircle;
  const arc = fullCircle / entries.length;
  return Math.floor(normalized / arc) % entries.length;
}

function isRemovablePrize(prize) {
  if (isLossEntry(prize)) {
    return false;
  }

  const normalized = normalizeLabel(prize);
  // Check prize configuration - only remove if it has reached max wins and is not eternal
  const config = prizeConfigurations[normalized];
  if (config) {
    const localPrizeWins = getLocalPrizeWinCount(prize);
    const currentWins = Math.max(config.currentWins || 0, localPrizeWins);

    // If marked as eternal, never remove
    if (config.isEternal) {
      return false;
    }
    // Remove on the final allowed win (e.g. on 2nd of 2, 5th of 5)
    if (currentWins + 1 < config.maxWins) {
      return false;
    }
  }
  
  return true;
}

function isForeverPrize(prize) {
  if (isLossEntry(prize)) {
    return true;
  }

  const normalized = normalizeLabel(prize);
  const config = prizeConfigurations[normalized];
  return Boolean(config?.isEternal);
}

function isPrizeDisabled(prize) {
  const normalized = normalizeLabel(prize);
  const config = prizeConfigurations[normalized];
  return Boolean(config?.isDisabled);
}

function getConfiguredWheelEntries(sourceEntries) {
  const normalizedSource = normalizeEntries(sourceEntries, true);
  const hasConfigState = Object.keys(prizeConfigurations).length > 0;
  if (!hasConfigState) {
    return normalizedSource;
  }

  return normalizedSource.filter((entry) => !hasReachedConfiguredLimit(entry) && !isPrizeDisabled(entry));
}

function hasReachedConfiguredLimit(prize) {
  if (isLossEntry(prize)) {
   return false;
  }

  const normalized = normalizeLabel(prize);
  const config = prizeConfigurations[normalized];
  if (!config || config.isEternal) {
    return false;
  }

  const localPrizeWins = getLocalPrizeWinCount(prize);
  const currentWins = Math.max(config.currentWins || 0, localPrizeWins);
  return currentWins >= config.maxWins;
}

function getLocalPrizeWinCount(prize) {
  const normalizedPrize = normalizeLabel(prize);
  return state.wins.reduce((total, win) => {
    if (!win || typeof win !== "object") {
      return total;
    }

    const wonPrize = String(win.winner || "");
    if (isLossEntry(wonPrize)) {
      return total;
    }

    return normalizeLabel(wonPrize) === normalizedPrize ? total + 1 : total;
  }, 0);
}

function removeEntryOnce(target) {
  const index = entries.findIndex((entry) => entry === target);
  if (index === -1) {
    return false;
  }

  entries.splice(index, 1);
  return true;
}

function completeTurn(winner, spinCounter = null) {
  const removable = isRemovablePrize(winner);
  const playerSnapshot = activePlayer;
  const isFreeSpin = isFreeSpinEntry(winner);
  const outcomeType = isFreeSpin ? "free-spin" : (isLossEntry(winner) ? "loss" : "win");
  const wonAt = new Date().toISOString();
  const spinNumber = spinCounter?.spinNumber ?? null;
  const spinDateKey = spinCounter?.spinDateKey ?? null;

  state.wins.push({
   id: createId(),
   wonAt,
   spinNumber,
   spinDateKey,
   winner,
   removedFromWheel: removable,
   player: playerSnapshot,
  });
  void recordSpinResult({
   id: createId(),
   spinNumber,
   spinDateKey,
   winner,
   outcomeType,
   removedFromWheel: removable,
   spunAt: wonAt,
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

  resultText.textContent = `Winner: ${winner}`;
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

  if (!isLossEntry(pendingTurn.winner)) {
    void recordPrizeWin(pendingTurn.winner);
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
     resultText.textContent = `Winner: ${pendingTurn.winner}`;
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

async function spinWheel() {
  if (isSpinning || !activePlayer || entries.length === 0) {
    return;
  }

  stopIdleSpin();
  isSpinning = true;
  updateSpinAvailability();
  resultText.textContent = "Spinning...";

  const extraTurns = 5 + Math.random() * 4;
  const fullCircle = Math.PI * 2;
  const pointerAngle = getPointerAngle();

  let spinCounter;
  try {
    spinCounter = await reserveNextSpinNumber();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    isSpinning = false;
    updateSpinAvailability();
    resultText.textContent = `Could not start spin (${message}).`;
    return;
  }

  // Check if this spin is a milestone spin with a guaranteed prize
  const milestonePrize = getMilestonePrizeForSpin(spinCounter.spinNumber);
  console.log(`🎡 Spin #${spinCounter.spinNumber}${milestonePrize ? ` [MILESTONE] → ${milestonePrize}` : ''}`);
  let winningIndex;
  
  if (milestonePrize) {
    // Milestone spin - find and land on the specific prize
    const milestoneIndex = findEntryInWheel(milestonePrize);
    if (milestoneIndex !== null) {
      winningIndex = milestoneIndex;
    }

    if (winningIndex === undefined) {
      // Fallback if prize not found on wheel
      const prizeIndices = entries
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => !isLossEntry(entry))
        .map(({ index }) => index);
      winningIndex = prizeIndices.length > 0
        ? prizeIndices[Math.floor(Math.random() * prizeIndices.length)]
        : Math.floor(Math.random() * entries.length);
    }
  } else {
    // Regular spin - losses, plus Troos Prys and Pilot Juice Pen only.
    const loseIndices = entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => isLossEntry(entry))
      .map(({ index }) => index);
    const regularPrizeIndices = entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !isLossEntry(entry) && !isMilestonePrize(entry) && isRegularSpinPrize(entry))
      .map(({ index }) => index);
    
    if (loseIndices.length > 0 && regularPrizeIndices.length > 0) {
      const pickLose = Math.random() < regularSpinLossChance;
      const selectedIndices = pickLose ? loseIndices : regularPrizeIndices;
      winningIndex = selectedIndices[Math.floor(Math.random() * selectedIndices.length)];
    } else if (loseIndices.length > 0) {
      // Only lose entries available
      winningIndex = loseIndices[Math.floor(Math.random() * loseIndices.length)];
    } else if (regularPrizeIndices.length > 0) {
      // Only regular non-milestone allowed prizes available
      winningIndex = regularPrizeIndices[Math.floor(Math.random() * regularPrizeIndices.length)];
    } else {
      // Only milestone/other excluded prizes remain on the wheel
      winningIndex = Math.floor(Math.random() * entries.length);
    }
  }
  const arc = fullCircle / entries.length;
  const selectedWinner = entries[winningIndex] || "";
  const start = performance.now();
  const duration = 4500;
  const startRotation = currentRotation;
  const targetAngle = ((pointerAngle - (winningIndex * arc + arc / 2)) % fullCircle + fullCircle) % fullCircle;
  const startAngle = ((startRotation % fullCircle) + fullCircle) % fullCircle;
  const deltaToTarget = (targetAngle - startAngle + fullCircle) % fullCircle;
  const baseTargetRotation = startRotation + deltaToTarget + (fullCircle * extraTurns);
  let targetRotation = baseTargetRotation;
  let resolvedWinningIndex = getWinningIndexForRotation(targetRotation, pointerAngle);

  if (resolvedWinningIndex !== winningIndex) {
    for (let step = 1; step <= entries.length; step += 1) {
      const candidateRotation = baseTargetRotation + (step * arc);
      const candidateIndex = getWinningIndexForRotation(candidateRotation, pointerAngle);
      if (candidateIndex === winningIndex) {
        targetRotation = candidateRotation;
        resolvedWinningIndex = candidateIndex;
        break;
      }
    }
  }

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
    const winner = entries[resolvedWinningIndex] || selectedWinner || getWinningEntry();
    isSpinning = false;
    completeTurn(winner, spinCounter);
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

    if (Array.isArray(json)) {
      lossMessages = {};
      lossTypes = {};
    } else {
      syncLossMetadataFromPayload(json);
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

      if (Array.isArray(json)) {
        lossMessages = {};
        lossTypes = {};
      } else {
        syncLossMetadataFromPayload(json);
      }
      allEntries = normalizeEntries(fromJson, true);
    } catch {
      lossMessages = {};
      lossTypes = {};
      allEntries = ["Option 1", "Option 2"];
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    resultText.textContent = `Could not load managed entries (${message}).`;
  }
}

function initializeEntriesFromState() {
  const sourceEntries = getConfiguredWheelEntries(allEntries);
  const availableEntries = normalizeEntries(state.availableEntries, true);
  entries = Object.keys(prizeConfigurations).length > 0
    ? sourceEntries
    : (state.initialized
      ? reconcileAvailableEntries(availableEntries, sourceEntries)
      : [...sourceEntries]);
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
  if (playerFormError) {
    playerFormError.textContent = "";
  }

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
    renderEntriesTable();

    currentPlayerText.textContent = `Player: ${activePlayer.name} (${activePlayer.school})`;
    resultText.textContent = "Press spin to choose a winner.";
    if (playerFormError) {
      playerFormError.textContent = "";
    }
    playerForm.reset();
    closePlayerForm();
    hideWaitingForPlayer();
    updateSpinAvailability();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (/already played today/i.test(message)) {
      if (playerFormError) {
        playerFormError.textContent = "You’ve already had your spin for today.";
      }
      resultText.textContent = "You’ve already had your spin for today.";
      return;
    }
    if (playerFormError) {
      playerFormError.textContent = `Could not save registration (${message}).`;
    }
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
exportAdminEmailInput?.addEventListener("input", () => setAdminLoginError(""));
exportAccessKeyInput?.addEventListener("input", () => setAdminLoginError(""));
downloadExportButton?.addEventListener("click", downloadParticipantsExport);
downloadEntriesExportButton?.addEventListener("click", () => {
  void downloadEntriesExport();
});
entriesFromDateInput?.addEventListener("change", renderEntriesTable);
entriesToDateInput?.addEventListener("change", renderEntriesTable);
entriesDateSortSelect?.addEventListener("change", renderEntriesTable);
addAdminEntryButton.addEventListener("click", () => {
  void addAdminEntry();
});
adminEntryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void addAdminEntry();
  }
});

addMilestoneSpinRowButton?.addEventListener("click", () => {
  if (milestoneSpinRows) {
    milestoneSpinRows.appendChild(createMilestoneRow());
  }
});

milestoneSpinRows?.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement && event.key === "Enter") {
    event.preventDefault();
    void saveMilestoneSchedule();
  }
});

addRegularPrizeRowButton?.addEventListener("click", () => {
  if (regularPrizeRows) {
    regularPrizeRows.appendChild(createRegularPrizeRow());
  }
});

regularPrizeRows?.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement && event.key === "Enter") {
    event.preventDefault();
    void saveRegularPrizeNames();
  }
});

saveMilestoneSpinScheduleButton?.addEventListener("click", () => {
  void saveMilestoneSchedule();
});

saveRegularPrizeNamesButton?.addEventListener("click", () => {
  void saveRegularPrizeNames();
});
resetPrizeWinsButton?.addEventListener("click", () => {
  void resetPrizeWinCounts();
});
loadSpinCounterButton?.addEventListener("click", () => {
  void loadAdminSpinCounter();
});
saveSpinCounterButton?.addEventListener("click", () => {
  void saveAdminSpinCounter();
});
spinCounterValueInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void saveAdminSpinCounter();
  }
});

prizeSearchInput?.addEventListener("input", () => {
  const adminEntries = allEntries;
  renderAdminEntries(adminEntries);
});

prizeSortSelect?.addEventListener("change", () => {
  const adminEntries = allEntries;
  renderAdminEntries(adminEntries);
});

// Tab switching functionality
adminTabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-tab");

    if (tabName) {
      activateAdminTab(tabName);
      setActiveSidebarSection("prizes");
      if (adminSectionTitle) {
        adminSectionTitle.textContent = "Prize Settings";
      }
      if (adminSectionSubtitle) {
        adminSectionSubtitle.textContent = "Manage the prizes and odds for your wheel.";
      }
      adminTabs?.classList.remove("is-hidden");
    }
  });
});

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    const sectionName = item.dataset.adminSection;
    if (sectionName === "entries" || sectionName === "prizes") {
      setAdminSection(sectionName);
      return;
    }

    setActiveSidebarSection(sectionName || "prizes");
  });
});

// Add drop zone handler to the list container itself
if (adminEntriesList) {
  adminEntriesList.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  adminEntriesList.addEventListener("drop", (event) => {
    event.preventDefault();
    console.log("💧 Drop on list container");
  });
}

async function init() {
  setExportToolsVisibility(false);
  setAdminSection("prizes");
  if (spinCounterDateInput) {
    spinCounterDateInput.value = getTodayDateKey();
  }
  resizeConfettiCanvas();
  loadState();
  await loadParticipantsFromServer();
  const participantDateBounds = getParticipantsDateBounds(normalizeParticipants(state.participants));
  if (entriesDateSortSelect) {
    entriesDateSortSelect.value = "newest";
  }
  if (participantDateBounds) {
    if (entriesFromDateInput) {
      entriesFromDateInput.value = participantDateBounds.fromDate;
    }
    if (entriesToDateInput) {
      entriesToDateInput.value = participantDateBounds.toDate;
    }
  }
  renderEntriesTable();
  await loadJsonEntries();
  await loadPrizeConfigurations();
  await loadMilestoneSchedule();
  await loadRegularPrizeNames();
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
