const REQUIRED_COLUMNS = [
  "facility",
  "rules_and_regulations",
  "timings",
  "booking_process",
  "instructor_details",
  "coordinator_name"
];

const OPTIONAL_COLUMNS = ["contact", "notes"];
const MANAGEMENT_COMMITTEE_REQUIRED_COLUMNS = ["name", "role"];
const CONTACT_REQUIRED_COLUMNS = ["service", "contact"];
const OPS_CONTACT_REQUIRED_COLUMNS = [
  "scope_of_work",
  "name",
  "contact",
  "office_hours",
  "escalation_contact"
];
const NOTICE_REQUIRED_COLUMNS = ["notice_name", "pdf_url"];
const BANNER_REQUIRED_COLUMNS = ["banner_title"];

const state = {
  facilities: [],
  filtered: [],
  managementCommitteeMembers: [],
  emergencyContacts: [],
  operationsContacts: [],
  notices: [],
  banners: []
};

const statusEl = document.getElementById("status");
const listEl = document.getElementById("facilityList");
const managementCommitteeListEl = document.getElementById("managementCommitteeList");
const emergencyContactsListEl = document.getElementById("emergencyContactsList");
const operationsContactsListEl = document.getElementById("operationsContactsList");
const noticesListEl = document.getElementById("noticesList");
const noticeBannerTrackEl = document.getElementById("noticeBannerTrack");
const template = document.getElementById("cardTemplate");
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const updatedAt = document.getElementById("updatedAt");
const homeSections = document.getElementById("homeSections");
const facilityHomeCard = document
  .querySelector('[aria-controls="home-body-facility"]')
  ?.closest(".home-card");
const PHONE_PATTERN = /(?:\+91[\s-]?\d{5}\s?\d{5}|\b[6-9]\d{9}\b)/g;

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

function closeNoticeCard(card) {
  card.classList.remove("open");
  const toggleBtn = card.querySelector(".notice-toggle");
  const body = card.querySelector(".notice-body");
  toggleBtn.setAttribute("aria-expanded", "false");
  body.classList.add("hidden");
}

function openNoticeCard(card) {
  card.classList.add("open");
  const toggleBtn = card.querySelector(".notice-toggle");
  const body = card.querySelector(".notice-body");
  toggleBtn.setAttribute("aria-expanded", "true");
  body.classList.remove("hidden");

  if (body.dataset.loaded === "true") {
    return;
  }

  body.dataset.loaded = "true";
  const pdfSrc = body.dataset.pdfSrc || "";
  if (!pdfSrc) {
    body.textContent = "PDF link not available.";
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.className = "notice-pdf";
  iframe.src = pdfSrc;
  iframe.title = card.querySelector(".notice-title")?.textContent || "Notice PDF";
  iframe.loading = "lazy";

  const link = document.createElement("a");
  link.className = "notice-pdf-link";
  link.href = pdfSrc;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Open PDF in a new tab";

  body.appendChild(iframe);
  body.appendChild(link);
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
  noticesListEl.querySelectorAll(".notice-card.open").forEach((card) => {
    closeNoticeCard(card);
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

function getDataSourceUrl(configKey) {
  if (window.APP_CONFIG?.dataSources?.[configKey]) {
    return window.APP_CONFIG.dataSources[configKey];
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

function normalizeWrappedCsvRows(rows) {
  if (!rows.length) {
    return rows;
  }

  const firstRow = rows[0];
  const hasWrappedHeader = firstRow[0]?.includes(",");
  const hasOnlyOneNonEmptyCell = firstRow
    .slice(1)
    .every((cell) => cell.trim() === "");

  if (!hasWrappedHeader || !hasOnlyOneNonEmptyCell) {
    return rows;
  }

  const rebuiltCsv = rows.map((row) => row[0] || "").join("\n");
  return parseCSV(rebuiltCsv);
}

function mapRows(rows) {
  if (!rows.length) {
    throw new Error("No data found in sheet.");
  }

  // Some CSV exports wrap each whole row in a single quoted field.
  rows = normalizeWrappedCsvRows(rows);

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

  rows = normalizeWrappedCsvRows(rows);

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

function getTelHref(value) {
  const formatted = formatIndianMobile(value);
  if (formatted) {
    return `tel:${formatted.replace("-", "")}`;
  }

  return "";
}

function isPhoneMatch(value) {
  return Boolean(formatIndianMobile(value));
}

function getIndianMobileDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }
  return "";
}

function formatIndianMobile(value) {
  const digits = getIndianMobileDigits(value);
  if (digits) {
    return `+91-${digits}`;
  }
  return "";
}

function maskIndianMobile(value) {
  const digits = getIndianMobileDigits(value);
  if (!digits) {
    return value;
  }
  return `${digits.slice(0, 2)}XXXXXX${digits.slice(-2)}`;
}

function hasUnmaskedMobileContext(...values) {
  return values.some((value) => /aniket|society manager/i.test(String(value || "")));
}

function normalizeBadgeType(value) {
  const type = String(value || "").trim().toLowerCase();
  if (["info", "important", "danger", "new", "success"].includes(type)) {
    return type;
  }
  return "info";
}

function getBadgeConfig(item) {
  if (item.badge) {
    return {
      icon: item.icon || "",
      label: item.badge,
      type: normalizeBadgeType(item.badge_type)
    };
  }

  if (isTruthyFlag(item.imp)) {
    return {
      icon: "⭐",
      label: "Important",
      type: "important"
    };
  }

  return null;
}

function createBadge({ icon = "", label = "", type = "info" }) {
  const badge = document.createElement("span");
  badge.className = `ui-badge ui-badge-${normalizeBadgeType(type)}`;
  badge.textContent = [icon, label].filter(Boolean).join(" ");
  return badge;
}

function appendBadge(parent, item) {
  const badgeConfig = getBadgeConfig(item);
  if (!badgeConfig) {
    return;
  }
  parent.appendChild(createBadge(badgeConfig));
}

function appendInlineIcon(parent, icon) {
  const value = String(icon || "").trim();
  if (!value) {
    return;
  }

  const iconEl = document.createElement("span");
  iconEl.className = "row-icon";
  iconEl.setAttribute("aria-hidden", "true");
  iconEl.textContent = value;
  parent.appendChild(iconEl);
}

function createPhoneLink(value) {
  const formatted = formatIndianMobile(value);
  const link = document.createElement("a");
  link.className = "phone-link";
  link.href = getTelHref(value);
  link.textContent = formatted || value;
  link.setAttribute("aria-label", `Call ${formatted || value}`);
  return link;
}

function appendTextWithPhoneLinks(parent, value, fallbackText = "N/A", options = {}) {
  const text = value || fallbackText;
  if (!text) {
    parent.append(fallbackText);
    return;
  }

  let lastIndex = 0;
  const matches = String(text).matchAll(PHONE_PATTERN);

  for (const match of matches) {
    const phoneText = match[0];
    if (!isPhoneMatch(phoneText)) {
      continue;
    }

    if (match.index > lastIndex) {
      parent.append(String(text).slice(lastIndex, match.index));
    }
    if (options.allowFullMobile) {
      parent.appendChild(createPhoneLink(phoneText));
    } else {
      parent.append(maskIndianMobile(phoneText));
    }
    lastIndex = match.index + phoneText.length;
  }

  if (lastIndex === 0) {
    parent.append(text);
    return;
  }

  if (lastIndex < String(text).length) {
    parent.append(String(text).slice(lastIndex));
  }
}

function setTextWithPhoneLinks(element, value, fallbackText = "N/A", options = {}) {
  element.innerHTML = "";
  appendTextWithPhoneLinks(element, value, fallbackText, options);
}

function renderNumberedList(listEl, rawValue, fallbackText = "N/A", options = {}) {
  listEl.innerHTML = "";
  const points = splitIntoPoints(rawValue);
  const finalPoints = points.length ? points : [fallbackText];

  finalPoints.forEach((point) => {
    const li = document.createElement("li");
    appendTextWithPhoneLinks(li, point, "N/A", options);
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

  const facilityName = card.querySelector(".facility-name");
  facilityName.innerHTML = "";
  appendInlineIcon(facilityName, item.icon);
  appendTextWithPhoneLinks(facilityName, item.facility);
  appendBadge(facilityName, item);
  renderNumberedList(card.querySelector(".rules-list"), item.rules_and_regulations, "N/A");
  setTextWithPhoneLinks(card.querySelector(".timings"), item.timings);
  setTextWithPhoneLinks(card.querySelector(".booking"), item.booking_process, "Not applicable");
  setTextWithPhoneLinks(card.querySelector(".instructor"), item.instructor_details);
  setTextWithPhoneLinks(card.querySelector(".coordinator"), item.coordinator_name);
  setTextWithPhoneLinks(card.querySelector(".contact"), item.contact);
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

function renderBanners(list) {
  if (!noticeBannerTrackEl) {
    return;
  }

  const noticeBannerEl = noticeBannerTrackEl.closest(".notice-banner");
  noticeBannerTrackEl.innerHTML = "";

  if (!list.length) {
    noticeBannerEl?.classList.add("hidden");
    return;
  }

  noticeBannerEl?.classList.remove("hidden");

  const fragment = document.createDocumentFragment();

  list.forEach((banner) => {
    const span = document.createElement("span");
    span.className = "notice-banner-text";
    span.textContent = [banner.icon, banner.banner_title].filter(Boolean).join(" ");
    fragment.appendChild(span);
  });

  noticeBannerTrackEl.appendChild(fragment);
}

function renderManagementCommittee(list) {
  managementCommitteeListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  list.forEach((member) => {
    const li = document.createElement("li");
    if (isTruthyFlag(member.imp)) {
      li.classList.add("important-item");
    }
    const phoneOptions = {
      allowFullMobile: hasUnmaskedMobileContext(member.name, member.role)
    };
    appendTextWithPhoneLinks(li, `${member.name} - ${member.role}`, "N/A", phoneOptions);
    appendBadge(li, member);
    if (member.contact) {
      li.append(" (");
      appendTextWithPhoneLinks(li, member.contact, "N/A", phoneOptions);
      li.append(")");
    }
    fragment.appendChild(li);
  });

  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = "No management committee member data found.";
    fragment.appendChild(li);
  }

  managementCommitteeListEl.appendChild(fragment);
}

function renderEmergencyContacts(list) {
  emergencyContactsListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  list.forEach((entry) => {
    const li = document.createElement("li");
    if (isTruthyFlag(entry.imp)) {
      li.classList.add("important-item");
    }
    const note = entry.notes ? ` (${entry.notes})` : "";
    appendTextWithPhoneLinks(li, `${entry.service}: ${entry.contact}${note}`);
    appendBadge(li, entry);
    fragment.appendChild(li);
  });

  if (!list.length) {
    const li = document.createElement("li");
    li.textContent = "No emergency contact data found.";
    fragment.appendChild(li);
  }

  emergencyContactsListEl.appendChild(fragment);
}

function renderOperationsContacts(list) {
  operationsContactsListEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  list.forEach((entry) => {
    const li = document.createElement("li");
    li.classList.add("ops-item");

    const scope = document.createElement("strong");
    appendTextWithPhoneLinks(scope, entry.scope_of_work);
    appendBadge(scope, entry);

    const ownerLine = document.createElement("div");
    appendTextWithPhoneLinks(
      ownerLine,
      `${entry.name || "N/A"} - ${entry.contact || "N/A"}`,
      "N/A",
      {
        allowFullMobile: hasUnmaskedMobileContext(entry.name, entry.scope_of_work)
      }
    );

    const hoursLine = document.createElement("div");
    appendTextWithPhoneLinks(hoursLine, `Hours: ${entry.office_hours || "N/A"}`);

    const escalationLine = document.createElement("div");
    appendTextWithPhoneLinks(escalationLine, `Escalation: ${entry.escalation_contact || "N/A"}`);

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

function getGoogleDriveFileId(value) {
  const text = String(value || "").trim();
  const filePathMatch = text.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (filePathMatch) {
    return filePathMatch[1];
  }

  try {
    const url = new URL(text, window.location.href);
    if (!/(\.|^)drive\.google\.com$/i.test(url.hostname)) {
      return "";
    }
    return url.searchParams.get("id") || "";
  } catch (_error) {
    return "";
  }
}

function getNoticePdfUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const driveFileId = getGoogleDriveFileId(text);
  if (driveFileId) {
    return `https://drive.google.com/file/d/${driveFileId}/preview`;
  }

  return text;
}

function createNoticeCard(notice, idx) {
  const card = document.createElement("article");
  card.className = "notice-card";
  if (isTruthyFlag(notice.imp)) {
    card.classList.add("important-item");
  }

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "notice-toggle";
  toggleBtn.type = "button";
  toggleBtn.setAttribute("aria-expanded", "false");
  toggleBtn.setAttribute("aria-controls", `notice-body-${idx}`);

  const header = document.createElement("div");
  header.className = "notice-header";

  const title = document.createElement("h3");
  title.className = "notice-title";
  title.textContent = notice.notice_name;
  appendBadge(title, notice);
  header.appendChild(title);

  const metaItems = [];
  if (notice.issued_date) {
    metaItems.push(`Issued: ${notice.issued_date}`);
  }
  if (notice.effective_date) {
    metaItems.push(`Effective: ${notice.effective_date}`);
  }

  if (metaItems.length) {
    const meta = document.createElement("div");
    meta.className = "notice-meta";
    meta.textContent = metaItems.join(" | ");
    header.appendChild(meta);
  }

  const chevron = document.createElement("span");
  chevron.className = "chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "\u25BE";

  toggleBtn.appendChild(header);
  toggleBtn.appendChild(chevron);

  const body = document.createElement("div");
  body.className = "notice-body hidden";
  body.id = `notice-body-${idx}`;
  body.dataset.loaded = "false";
  body.dataset.pdfSrc = getNoticePdfUrl(notice.pdf_url);

  card.appendChild(toggleBtn);
  card.appendChild(body);
  return card;
}

function renderNotices(list) {
  noticesListEl.innerHTML = "";
  const validNotices = list
    .filter((notice) => notice.notice_name && notice.pdf_url)
    .reverse();
  const fragment = document.createDocumentFragment();

  validNotices.forEach((notice, idx) => {
    fragment.appendChild(createNoticeCard(notice, idx));
  });

  if (!validNotices.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No past notices found.";
    fragment.appendChild(empty);
  }

  noticesListEl.appendChild(fragment);
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
  const facilitiesCsvUrl = getDataSourceUrl("facilitiesCsvUrl");
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

async function fetchManagementCommitteeMembers() {
  const managementCommitteeCsvUrl = getDataSourceUrl("managementCommitteeCsvUrl");
  if (!managementCommitteeCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.managementCommitteeCsvUrl is missing in config.js");
  }

  const response = await fetch(managementCommitteeCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch management committee data (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);
  return mapRowsBySchema(rows, MANAGEMENT_COMMITTEE_REQUIRED_COLUMNS, "name");
}

async function fetchEmergencyContacts() {
  const emergencyContactsCsvUrl = getDataSourceUrl("emergencyContactsCsvUrl");
  if (!emergencyContactsCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.emergencyContactsCsvUrl is missing in config.js");
  }

  const response = await fetch(emergencyContactsCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch emergency contacts data (${response.status})`);
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

async function fetchNotices() {
  const noticesCsvUrl = getDataSourceUrl("noticesCsvUrl");
  if (!noticesCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.noticesCsvUrl is missing in config.js");
  }

  const response = await fetch(noticesCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch notices data (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);
  return mapRowsBySchema(rows, NOTICE_REQUIRED_COLUMNS, "notice_name");
}

async function fetchBanners() {
  const bannersCsvUrl = getDataSourceUrl("bannersCsvUrl");
  if (!bannersCsvUrl) {
    throw new Error("APP_CONFIG.dataSources.bannersCsvUrl is missing in config.js");
  }

  const response = await fetch(bannersCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch banner data (${response.status})`);
  }

  const csv = await response.text();
  const rows = parseCSV(csv);
  return mapRowsBySchema(rows, BANNER_REQUIRED_COLUMNS, "banner_title");
}

async function loadBanners() {
  try {
    const banners = await fetchBanners();
    state.banners = banners;
    renderBanners(state.banners);
  } catch (error) {
    state.banners = [];
    renderBanners([]);
    console.error(error);
  }
}

async function loadData() {
  setStatus("Loading data...");
  try {
    const [
      facilities,
      managementCommitteeMembers,
      emergencyContacts,
      operationsContacts,
      notices
    ] = await Promise.all([
      fetchFacilities(),
      fetchManagementCommitteeMembers(),
      fetchEmergencyContacts(),
      fetchOperationsContacts(),
      fetchNotices()
    ]);

    // facilities.sort((a, b) => a.facility.localeCompare(b.facility));
    // Preserve management committee member order exactly as provided in management_committee.csv.
    emergencyContacts.sort((a, b) => {
      const importantDiff = Number(isTruthyFlag(b.imp)) - Number(isTruthyFlag(a.imp));
      if (importantDiff) {
        return importantDiff;
      }
      return a.service.localeCompare(b.service);
    });

    state.facilities = facilities;
    state.filtered = facilities;
    state.managementCommitteeMembers = managementCommitteeMembers;
    state.emergencyContacts = emergencyContacts;
    state.operationsContacts = operationsContacts;
    state.notices = notices;

    renderFacilities(state.filtered);
    renderManagementCommittee(state.managementCommitteeMembers);
    renderEmergencyContacts(state.emergencyContacts);
    renderOperationsContacts(state.operationsContacts);
    renderNotices(state.notices);

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
    managementCommitteeListEl.innerHTML = "";
    emergencyContactsListEl.innerHTML = "";
    operationsContactsListEl.innerHTML = "";
    noticesListEl.innerHTML = "";
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
  loadBanners();
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

noticesListEl.addEventListener("click", (event) => {
  const toggleBtn = event.target.closest(".notice-toggle");
  if (!toggleBtn) {
    return;
  }

  const currentCard = toggleBtn.closest(".notice-card");
  const isAlreadyOpen = currentCard.classList.contains("open");

  noticesListEl.querySelectorAll(".notice-card.open").forEach((card) => {
    closeNoticeCard(card);
  });

  if (!isAlreadyOpen) {
    openNoticeCard(currentCard);
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


renderBanners([]);
loadBanners();
loadData();
