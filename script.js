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
const playerFormError = document.getElementById("playerFormError");
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
const resetPrizeWinsButton = document.getElementById("resetPrizeWinsButton");
const prizeSearchInput = document.getElementById("prizeSearchInput");
const prizeSortSelect = document.getElementById("prizeSortSelect");
const wheelSection = document.querySelector(".wheel-section");

const siteUrl = (import.meta?.env?.VITE_SITE_URL || import.meta?.env?.NEXT_PUBLIC_SITE_URL || window.location.origin);
const adminLoginApiUrl = new URL("/api/admin/login", siteUrl).toString();
const publicEntriesApiUrl = new URL("/api/entries", siteUrl).toString();
const adminEntriesApiUrl = new URL("/api/admin/entries", siteUrl).toString();
const adminPrizeConfigApiUrl = new URL("/api/admin/prize-config", siteUrl).toString();
const publicPrizeConfigApiUrl = new URL("/api/prize-config", siteUrl).toString();
const adminPrizeWinApiUrl = new URL("/api/admin/prize-win", siteUrl).toString();
const adminResetPrizeWinsApiUrl = new URL("/api/admin/reset-prize-wins", siteUrl).toString();
const participantsApiUrl = new URL("/api/participants", siteUrl).toString();
const spinResultsApiUrl = new URL("/api/winners", siteUrl).toString();
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
  if (label === "uh oh") {
    return "uh oh";
  }
  if (label === "maybe next time") {
    return "maybe next time";
  }
  if (label === "nice try") {
    return "nice try";
  }
  if (label === "404 prize not found") {
    return "404: prize not found";
  }
  if (label === "close but no prize") {
    return "close, but no prize";
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
    await loadPrizeConfigurations();
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
        const list = normalizeEntries(payload.entries, true);
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
    const emptyItem = document.createElement("li");
    emptyItem.className = "admin-entries-item";
    emptyItem.innerHTML = searchTerm 
      ? `<span class="admin-entries-item__label">No prizes match "${searchTerm}"</span>`
      : "<span class=\"admin-entries-item__label\">No wheel entries configured.</span>";
    adminEntriesList.appendChild(emptyItem);
    return;
  }

  const fragment = document.createDocumentFragment();

  sortedEntries.forEach((entry, displayIndex) => {
   const item = document.createElement("li");
   item.className = "admin-entries-item";
   item.draggable = true;
   item.dataset.entry = entry;
   // Store the original index in allEntries for proper reordering
   item.dataset.originalIndex = allEntries.indexOf(entry);

   const label = document.createElement("span");
   label.className = "admin-entries-item__label";
   label.textContent = entry;

   const normalized = normalizeLabel(entry);
   const config = prizeConfigurations[normalized] || { maxWins: 1, currentWins: 0, isEternal: false };
    
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
   eternalCheckbox.addEventListener("change", () => {
     const maxWins = parseInt(maxWinsSelect.value, 10);
     const isEternal = eternalCheckbox.checked;
     void updatePrizeConfiguration(entry, maxWins, isEternal);
   });
    
   maxWinsSelect.addEventListener("change", () => {
     const maxWins = parseInt(maxWinsSelect.value, 10);
     const isEternal = eternalCheckbox.checked;
     void updatePrizeConfiguration(entry, maxWins, isEternal);
   });
    
   configDiv.append(maxWinsLabel, maxWinsSelect);
    
   const winCountSpan = document.createElement("span");
   winCountSpan.className = "admin-entries-item__win-count";
   winCountSpan.textContent = `(Won ${config.currentWins}/${config.maxWins})`;
    
   const eternalContainer = document.createElement("div");
   eternalContainer.className = "admin-entries-item__eternal-container";
   eternalContainer.appendChild(eternalCheckbox);

   // Create drag handle
   const dragHandle = document.createElement("div");
   dragHandle.className = "admin-entries-item__drag-handle";
   dragHandle.textContent = "⋮⋮";
   dragHandle.title = "Click and drag to reorder entries";

   const removeButton = document.createElement("button");
   removeButton.className = "admin-entries-item__remove";
   removeButton.type = "button";
   removeButton.textContent = "Remove";
   removeButton.addEventListener("click", () => {
     void removeAdminEntry(allEntries.indexOf(entry));
   });

   // Add drag event listeners
   item.addEventListener("dragstart", handleEntryDragStart);
   item.addEventListener("dragenter", handleEntryDragEnter);
   item.addEventListener("dragover", handleEntryDragOver);
   item.addEventListener("drop", handleEntryDrop);
   item.addEventListener("dragend", handleEntryDragEnd);
   item.addEventListener("dragleave", handleEntryDragLeave);

   item.append(dragHandle, eternalContainer, label, configDiv, winCountSpan, removeButton);
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

async function updatePrizeConfiguration(prizeName, maxWins, isEternal) {
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
     body: JSON.stringify({ prizeName, maxWins, isEternal: isEternal || false }),
   });

   if (!response.ok) {
     const payload = await response.json().catch(() => ({}));
     throw new Error(payload.error || `Request failed (${response.status})`);
   }

   await loadPrizeConfigurations();
   const eternalText = isEternal ? " and stays forever" : "";
   resultText.textContent = `Updated ${prizeName} to be won up to ${maxWins} time(s)${eternalText}.`;
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

async function resetPrizeWinCounts() {
  const headers = getAdminRequestHeaders();
  if (!headers) {
   resultText.textContent = "Admin login is required before resetting.";
   return;
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

   await loadPrizeConfigurations();
   resultText.textContent = "All prize win counts have been reset.";
  } catch (error) {
   const message = error instanceof Error ? error.message : "Unknown error";
   resultText.textContent = `Could not reset prize win counts (${message}).`;
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
    if (loseKey === "uh oh") {
    return { primary: "Uh Oh! ", secondary: "The prize escaped this time!" };
  }
    if (loseKey === "maybe next time") {
    return { primary: "Maybe Next Time! ", secondary: "No prize, but you earned bragging rights for spinning!" };
  }
    if (loseKey === "nice try") {
    return { primary: "Nice Try", secondary: "A+ for effort!" };
  }
    if (loseKey === "404: prize not found") {
    return { primary: "404: Prize Not Found.", secondary: "The wheel is in a silly mood." };
  }
    if (loseKey === "close, but no prize") {
    return { primary: "Close But No Prize!", secondary: "Luck was fashionably late." };
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

  const fullCircle = Math.PI * 2;
  const pointerAngle = -Math.PI / 2;
  const normalized = ((pointerAngle - currentRotation) % fullCircle + fullCircle) % fullCircle;
  const arc = fullCircle / entries.length;
  const index = Math.floor(normalized / arc) % entries.length;
  return entries[index];
}

function isRemovablePrize(prize) {
  const normalized = normalizeLabel(prize);
  
  // If it's in the non-removable list, never remove it
  if (nonRemovablePrizes.has(normalized)) {
    return false;
  }
  
  // Check prize configuration - only remove if it has reached max wins and is not eternal
  const config = prizeConfigurations[normalized];
  if (config) {
    // If marked as eternal, never remove
    if (config.isEternal) {
      return false;
    }
    // Remove on the final allowed win (e.g. on 2nd of 2, 5th of 5)
    if (config.currentWins + 1 < config.maxWins) {
      return false;
    }
  }
  
  return true;
}

function isForeverPrize(prize) {
  const normalized = normalizeLabel(prize);
  if (nonRemovablePrizes.has(normalized)) {
    return true;
  }

  const config = prizeConfigurations[normalized];
  return Boolean(config?.isEternal);
}

function hasReachedConfiguredLimit(prize) {
  const normalized = normalizeLabel(prize);
  if (nonRemovablePrizes.has(normalized)) {
    return false;
  }

  const config = prizeConfigurations[normalized];
  if (!config || config.isEternal) {
    return false;
  }

  return config.currentWins >= config.maxWins;
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
  const loseKey = getLoseKey(winner);
  const isFreeSpin = loseKey === "free spin";
  const outcomeType = isFreeSpin ? "free-spin" : (loseKey ? "loss" : "win");
  const wonAt = new Date().toISOString();

  state.wins.push({
   id: createId(),
   wonAt,
   winner,
   removedFromWheel: removable,
   player: playerSnapshot,
  });
  void recordSpinResult({
   id: createId(),
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

  if (!getLoseKey(pendingTurn.winner)) {
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
  const hasConfigState = Object.keys(prizeConfigurations).length > 0;
  entries = hasConfigState
    ? sourceEntries.filter((entry) => !hasReachedConfiguredLimit(entry))
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
resetPrizeWinsButton?.addEventListener("click", () => {
  void resetPrizeWinCounts();
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
document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-tab");
    
    // Update active button
    document.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    
    // Update active content
    document.querySelectorAll(".admin-tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
      tabContent.classList.add("active");
    }
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
  resizeConfettiCanvas();
  loadState();
  await loadParticipantsFromServer();
  await loadJsonEntries();
  await loadPrizeConfigurations();
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
