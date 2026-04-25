const REQUIRED_COLUMNS = [
  "facility",
  "rules_and_regulations",
  "timings",
  "booking_process",
  "instructor_details",
  "coordinator_name"
];

const OPTIONAL_COLUMNS = ["contact", "notes"];
const SOCIETY_REQUIRED_COLUMNS = ["name", "role"];
const CONTACT_REQUIRED_COLUMNS = ["service", "contact"];
const OPS_CONTACT_REQUIRED_COLUMNS = [
  "scope_of_work",
  "name",
  "contact",
  "office_hours",
  "escalation_contact"
];

const state = {
  facilities: [],
  filtered: [],
  societyMembers: [],
  importantContacts: [],
  operationsContacts: []
};

const statusEl = document.getElementById("status");
const listEl = document.getElementById("facilityList");
const societyListEl = document.getElementById("societyList");
const contactsListEl = document.getElementById("contactsList");
const operationsContactsListEl = document.getElementById("operationsContactsList");
const template = document.getElementById("cardTemplate");
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const updatedAt = document.getElementById("updatedAt");
const homeSections = document.getElementById("homeSections");
const facilityHomeCard = document
  .querySelector('[aria-controls="home-body-facility"]')
  ?.closest(".home-card");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function closeCard(card) {
  card.classList.remove("open");
  const toggleBtn = card.querySelector(".card-toggle");
  const body = card.querySelector(".card-body");
  toggleBtn.setAttribute("aria-expanded", "false");
  body.classList.add("hidden");
}

function openCard(card) {
  card.classList.add("open");
  const toggleBtn = card.querySelector(".card-toggle");
  const body = card.querySelector(".card-body");
  toggleBtn.setAttribute("aria-expanded", "true");
  body.classList.remove("hidden");
}

function closeHomeCard(card) {
  card.classList.remove("open");
  const toggleBtn = card.querySelector(".home-card-toggle");
  const body = card.querySelector(".home-card-body");
  toggleBtn.setAttribute("aria-expanded", "false");
  body.classList.add("hidden");
}

function openHomeCard(card) {
  card.classList.add("open");
  const toggleBtn = card.querySelector(".home-card-toggle");
  const body = card.querySelector(".home-card-body");
  toggleBtn.setAttribute("aria-expanded", "true");
  body.classList.remove("hidden");
}

function openFacilitySection() {
  if (!facilityHomeCard) {
    return;
  }
  homeSections.querySelectorAll(".home-card.open").forEach((card) => {
    closeHomeCard(card);
  });
  openHomeCard(facilityHomeCard);
}

function collapseAllAccordions() {
  homeSections.querySelectorAll(".home-card.open").forEach((card) => {
    closeHomeCard(card);
  });
  listEl.querySelectorAll(".card.open").forEach((card) => {
    closeCard(card);
  });
}

function getFacilityMatches(query) {
  return state.facilities.filter((item) => {
    const searchBlob = [
      item.facility,
      item.timings,
      item.rules_and_regulations,
      item.booking_process,
      item.instructor_details,
      item.coordinator_name,
      item.contact,
      item.notes
    ].join(" ").toLowerCase();
    return searchBlob.includes(query);
  });
}

function searchAndOpenMatch() {
  const query = searchBox.value.trim().toLowerCase();
  if (query.length < 3) {
    return;
  }

  const homeCards = Array.from(homeSections.querySelectorAll(".home-card"));
  const facilityMatches = getFacilityMatches(query);
  let matchedCard = null;
  let matchedType = "";

  for (const card of homeCards) {
    const bodyId = card.querySelector(".home-card-body")?.id || "";
    if (bodyId === "home-body-facility") {
      if (facilityMatches.length) {
        matchedCard = card;
        matchedType = "facility";
        break;
      }
      continue;
    }

    const cardText = card.textContent.toLowerCase();
    if (cardText.includes(query)) {
      matchedCard = card;
      matchedType = "static";
      break;
    }
  }

  if (!matchedCard) {
    openFacilitySection();
    state.filtered = facilityMatches;
    renderFacilities(state.filtered);
    return;
  }

  homeSections.querySelectorAll(".home-card.open").forEach((card) => {
    closeHomeCard(card);
  });
  openHomeCard(matchedCard);

  if (matchedType !== "facility") {
    return;
  }

  state.filtered = facilityMatches;
  renderFacilities(state.filtered);
  const firstCard = listEl.querySelector(".card");
  if (!firstCard) {
    return;
  }

  listEl.querySelectorAll(".card.open").forEach((card) => {
    closeCard(card);
  });
  openCard(firstCard);
}

function normalizeKey(key) {
  return key.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");
}

function getDataSourceUrl(configKey, legacyKey) {
  if (window.APP_CONFIG?.dataSources?.[configKey]) {
    return window.APP_CONFIG.dataSources[configKey];
  }
  if (legacyKey && window.APP_CONFIG?.[legacyKey]) {
    return window.APP_CONFIG[legacyKey];
  }
  return "";
}

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      value = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function mapRows(rows) {
  if (!rows.length) {
    throw new Error("No data found in sheet.");
  }

  // Some CSV exports wrap each whole row in a single quoted field.
  // If detected, unwrap and parse once more.
  if (rows[0].length === 1 && rows[0][0].includes(",")) {
    const rebuiltCsv = rows.map((row) => row[0] || "").join("\n");
    rows = parseCSV(rebuiltCsv);
  }

  if (!rows.length) {
    throw new Error("No data found in sheet.");
  }

  const headers = rows[0].map((h) => normalizeKey(h));
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));

  if (missingColumns.length) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  return rows.slice(1)
    .map((cells) => {
      const item = {};
      headers.forEach((header, idx) => {
        item[header] = (cells[idx] || "").trim();
      });
      return item;
    })
    .filter((item) => item.facility);
}

function mapRowsBySchema(rows, requiredColumns, filterKey) {
  if (!rows.length) {
    throw new Error("No data found in sheet.");
  }

  if (rows[0].length === 1 && rows[0][0].includes(",")) {
    const rebuiltCsv = rows.map((row) => row[0] || "").join("\n");
    rows = parseCSV(rebuiltCsv);
  }

  if (!rows.length) {
    throw new Error("No data found in sheet.");
  }

  const headers = rows[0].map((h) => normalizeKey(h));
  const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

  if (missingColumns.length) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  return rows
    .slice(1)
    .map((cells) => {
      const item = {};
      headers.forEach((header, idx) => {
        item[header] = (cells[idx] || "").trim();
      });
      return item;
    })
    .filter((item) => item[filterKey]);
}

function splitIntoPoints(value) {
  const text = (value || "").trim();
  if (!text) {
    return [];
  }

  if (text.includes("\n") || text.includes(";") || text.includes("|")) {
    return text
      .split(/\r?\n|;|\|/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.replace(/^\d+[\).]\s*/, "").trim())
      .filter(Boolean);
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  const numberedChunks = normalized.split(/\s(?=\d+[\).]\s)/);
  if (numberedChunks.length > 1) {
    return numberedChunks
      .map((part) => part.replace(/^\d+[\).]\s*/, "").trim())
      .filter(Boolean);
  }

  // Handle single numbered input that contains multiple sentences:
  // "1. No fireworks... Event cleanup mandatory."
  // -> ["No fireworks...", "Event cleanup mandatory."]
  const strippedNumber = normalized.replace(/^\d+[\).]\s*/, "");
  const sentenceChunks = strippedNumber
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (sentenceChunks.length > 1) {
    return sentenceChunks;
  }

  return [text];
}

function isTruthyFlag(value) {
  if (typeof value !== "string") {
    return false;
  }
  return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
}

function renderNumberedList(listEl, rawValue, fallbackText = "N/A") {
  listEl.innerHTML = "";
  const points = splitIntoPoints(rawValue);
  const finalPoints = points.length ? points : [fallbackText];

  finalPoints.forEach((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    listEl.appendChild(li);
  });
}

function createCard(item, idx) {
  const card = template.content.firstElementChild.cloneNode(true);
  const toggleBtn = card.querySelector(".card-toggle");
  const body = card.querySelector(".card-body");
  const bodyId = `facility-body-${idx}`;

  toggleBtn.setAttribute("aria-controls", bodyId);
  body.id = bodyId;

  card.querySelector(".facility-name").textContent = item.facility || "N/A";
  renderNumberedList(card.querySelector(".rules-list"), item.rules_and_regulations, "N/A");
  card.querySelector(".timings").textContent = item.timings || "N/A";
  card.querySelector(".booking").textContent = item.booking_process || "Not applicable";
  card.querySelector(".instructor").textContent = item.instructor_details || "N/A";
  card.querySelector(".coordinator").textContent = item.coordinator_name || "N/A";
  card.querySelector(".contact").textContent = item.contact || "N/A";
  renderNumberedList(card.querySelector(".notes-list"), item.notes, "N/A");

  if (!item.booking_process) {
    card.querySelector(".booking-row").classList.add("hidden");
  }
  if (!item.instructor_details) {
    card.querySelector(".instructor-row").classList.add("hidden");
  }
  if (!item.contact) {
    card.querySelector(".contact-row").classList.add("hidden");
  }
  if (!item.notes) {
    card.querySelector(".notes-row").classList.add("hidden");
  }

  return card;
}

function renderFacilities(list) {
  listEl.innerHTML = "";

  if (!list.length) {
    setStatus("No facilities matched your search.");
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach((item, idx) => {
    fragment.appendChild(createCard(item, idx));
  });
  listEl.appendChild(fragment);
  setStatus(`Showing ${list.length} facility record(s).`);
}

function renderSociety(list) {
  societyListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  list.forEach((member) => {
    const li = document.createElement("li");
    if (isTruthyFlag(member.imp)) {
      li.classList.add("important-item");
    }
    const extra = member.contact ? ` (${member.contact})` : "";
    li.textContent = `${member.name} - ${member.role}${extra}`;
    fragment.appendChild(li);
  });

  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = "No committee member data found.";
    fragment.appendChild(li);
  }

  societyListEl.appendChild(fragment);
}

function renderContacts(list) {
  contactsListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  list.forEach((entry) => {
    const li = document.createElement("li");
    const note = entry.notes ? ` (${entry.notes})` : "";
    li.textContent = `${entry.service}: ${entry.contact}${note}`;
    fragment.appendChild(li);
  });

  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = "No important contact data found.";
    fragment.appendChild(li);
  }

  contactsListEl.appendChild(fragment);
}

function renderOperationsContacts(list) {
  operationsContactsListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  list.forEach((entry) => {
    const li = document.createElement("li");
    li.classList.add("ops-item");

    const scope = document.createElement("strong");
    scope.textContent = entry.scope_of_work || "N/A";

    const ownerLine = document.createElement("div");
    ownerLine.textContent = `${entry.name || "N/A"} - ${entry.contact || "N/A"}`;

    const hoursLine = document.createElement("div");
    hoursLine.textContent = `Hours: ${entry.office_hours || "N/A"}`;

    const escalationLine = document.createElement("div");
    escalationLine.textContent = `Escalation: ${entry.escalation_contact || "N/A"}`;

    li.appendChild(scope);
    li.appendChild(ownerLine);
    li.appendChild(hoursLine);
    li.appendChild(escalationLine);
    fragment.appendChild(li);
  });

  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = "No society operations contact data found.";
    fragment.appendChild(li);
  }

  operationsContactsListEl.appendChild(fragment);
}

function applySearch() {
  const query = searchBox.value.trim().toLowerCase();
  if (query.length > 0 && query.length < 3) {
    return;
  }

  if (!query) {
    state.filtered = state.facilities;
    renderFacilities(state.filtered);
    return;
  }

  state.filtered = getFacilityMatches(query);

  renderFacilities(state.filtered);
}

async function fetchFacilities() {
  const facilitiesCsvUrl = getDataSourceUrl("facilitiesCsvUrl", "sheetCsvUrl");
  if (!facilitiesCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.facilitiesCsvUrl is missing in config.js");
  }

  const response = await fetch(facilitiesCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch sheet data (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);
  return mapRows(rows);
}

async function fetchSocietyMembers() {
  const societyCsvUrl = getDataSourceUrl("societyCsvUrl");
  if (!societyCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.societyCsvUrl is missing in config.js");
  }

  const response = await fetch(societyCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch society data (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);
  return mapRowsBySchema(rows, SOCIETY_REQUIRED_COLUMNS, "name");
}

async function fetchImportantContacts() {
  const contactsCsvUrl = getDataSourceUrl("contactsCsvUrl");
  if (!contactsCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.contactsCsvUrl is missing in config.js");
  }

  const response = await fetch(contactsCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch contacts data (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);
  return mapRowsBySchema(rows, CONTACT_REQUIRED_COLUMNS, "service");
}

async function fetchOperationsContacts() {
  const operationsContactsCsvUrl = getDataSourceUrl("operationsContactsCsvUrl");
  if (!operationsContactsCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.operationsContactsCsvUrl is missing in config.js");
  }

  const response = await fetch(operationsContactsCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch society operations contacts data (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);
  return mapRowsBySchema(rows, OPS_CONTACT_REQUIRED_COLUMNS, "scope_of_work");
}

async function loadData() {
  setStatus("Loading data...");
  try {
    const [facilities, societyMembers, importantContacts, operationsContacts] = await Promise.all([
      fetchFacilities(),
      fetchSocietyMembers(),
      fetchImportantContacts(),
      fetchOperationsContacts()
    ]);

    // facilities.sort((a, b) => a.facility.localeCompare(b.facility));
    // Preserve society member order exactly as provided in society.csv.
    importantContacts.sort((a, b) => a.service.localeCompare(b.service));

    state.facilities = facilities;
    state.filtered = facilities;
    state.societyMembers = societyMembers;
    state.importantContacts = importantContacts;
    state.operationsContacts = operationsContacts;

    renderFacilities(state.filtered);
    renderSociety(state.societyMembers);
    renderContacts(state.importantContacts);
    renderOperationsContacts(state.operationsContacts);

    const optionalMissing = OPTIONAL_COLUMNS.filter(
      (column) => !Object.keys(facilities[0] || {}).includes(column)
    );

    if (optionalMissing.length) {
      setStatus(
        `Showing ${facilities.length} facility record(s). Optional columns not found: ${optionalMissing.join(", ")}`
      );
    }

    updatedAt.textContent = `Last refreshed: ${new Date().toLocaleString()}`;
  } catch (error) {
    listEl.innerHTML = "";
    societyListEl.innerHTML = "";
    contactsListEl.innerHTML = "";
    operationsContactsListEl.innerHTML = "";
    setStatus(error.message, true);
    updatedAt.textContent = "Last refreshed: failed";
  }
}

searchBox.addEventListener("input", applySearch);
searchBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchAndOpenMatch();
  }
});
searchBtn.addEventListener("click", searchAndOpenMatch);
refreshBtn.addEventListener("click", () => {
  searchBox.value = "";
  collapseAllAccordions();
  loadData();
});
listEl.addEventListener("click", (event) => {
  const toggleBtn = event.target.closest(".card-toggle");
  if (!toggleBtn) {
    return;
  }

  const currentCard = toggleBtn.closest(".card");
  const isAlreadyOpen = currentCard.classList.contains("open");

  listEl.querySelectorAll(".card.open").forEach((card) => {
    closeCard(card);
  });

  if (!isAlreadyOpen) {
    openCard(currentCard);
  }
});

homeSections.addEventListener("click", (event) => {
  const toggleBtn = event.target.closest(".home-card-toggle");
  if (!toggleBtn) {
    return;
  }

  const currentCard = toggleBtn.closest(".home-card");
  const isAlreadyOpen = currentCard.classList.contains("open");

  homeSections.querySelectorAll(".home-card.open").forEach((card) => {
    closeHomeCard(card);
  });

  if (!isAlreadyOpen) {
    openHomeCard(currentCard);
  }
});

//openFacilitySection();

loadData();
