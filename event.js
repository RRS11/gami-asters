const EVENT_REQUIRED_COLUMNS = ["event_name", "doc_url"];
const eventContentEl = document.getElementById("eventContent");
const eventSlug = document.body.dataset.eventSlug || "";

function normalizeEventKey(key) {
  return key.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");
}

function getEventSlug(eventName) {
  return String(eventName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseEventCSV(csvText) {
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

  if (value.length || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }
  return rows;
}

function mapEventRows(rows) {
  if (!rows.length) {
    throw new Error("No festival data found.");
  }

  const headers = rows[0].map(normalizeEventKey);
  const missing = EVENT_REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error(`Festival data is missing required columns: ${missing.join(", ")}`);
  }

  return rows.slice(1).map((cells) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (cells[index] || "").trim();
    });
    return item;
  });
}

function renderEvent(event) {
  document.title = `${event.event_name} | Gami Asters, C.H.S`;
  eventContentEl.innerHTML = "";

  const card = document.createElement("article");
  card.className = "event-detail-card";
  const title = document.createElement("h1");
  title.textContent = event.event_name;
  const documentFrame = document.createElement("iframe");
  documentFrame.className = "event-document";
  documentFrame.src = `${event.doc_url}${event.doc_url.includes("?") ? "&" : "?"}embedded=true`;
  documentFrame.title = `${event.event_name} event information`;

  const documentLink = document.createElement("a");
  documentLink.className = "event-document-link";
  documentLink.href = event.doc_url;
  documentLink.target = "_blank";
  documentLink.rel = "noopener";
  documentLink.textContent = "Open event information in a new tab";

  card.append(title, documentFrame, documentLink);
  eventContentEl.appendChild(card);
}

function renderEventMessage(titleText, message) {
  document.title = `${titleText} | Gami Asters, C.H.S`;
  eventContentEl.innerHTML = "";
  const card = document.createElement("article");
  card.className = "event-detail-card";
  const title = document.createElement("h1");
  title.textContent = titleText;
  const text = document.createElement("p");
  text.textContent = message;
  card.append(title, text);
  eventContentEl.appendChild(card);
}

async function loadEvent() {
  const festivalsCsvUrl = window.APP_CONFIG?.dataSources?.festivalsCsvUrl;
  if (!eventSlug || !festivalsCsvUrl) {
    renderEventMessage("Event information unavailable", "Festival information has not been configured yet.");
    return;
  }

  try {
    const response = await fetch(festivalsCsvUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to fetch festival data (${response.status})`);
    }
    const event = mapEventRows(parseEventCSV(await response.text()))
      .find((item) => getEventSlug(item.event_name) === eventSlug.toLowerCase());

    if (!event || !event.doc_url) {
      renderEventMessage("Event not found", "This event is not currently available. Please return to the home page for current events.");
      return;
    }
    renderEvent(event);
  } catch (error) {
    console.error(error);
    renderEventMessage("Event information unavailable", error.message);
  }
}

loadEvent();
