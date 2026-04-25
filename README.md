# C.H.S Gami Asters - Facility Information Page

Self-hosted single-page site for society facility information.

Current default setup is **local CSV mode** for easy testing, and it can be switched to **Google Sheet CSV** anytime.

## Quick Start (Local Testing)

`config.js` is already configured to use:

- `./data/facilities.csv`
- `./data/society.csv`
- `./data/contacts.csv`
- `./data/society_operations_contacts.csv` (operations contacts register)

Run a local static server:

```bash
python3 -m http.server 8080
```

Open:

`http://localhost:8080`

## Data File Format

`data/facilities.csv` must include these columns:

- `facility`
- `rules_and_regulations`
- `timings`
- `booking_process`
- `instructor_details`
- `coordinator_name`
- `contact` (optional)
- `notes` (optional)

`data/society.csv` must include:

- `name`
- `role`
- `contact` (optional)
- `imp` (optional, highlight row when set to `true`/`yes`/`1`/`y`)

`data/contacts.csv` must include:

- `service`
- `contact`
- `notes` (optional)

`data/society_operations_contacts.csv` includes:

- `scope_of_work`
- `name`
- `contact`
- `office_hours`
- `escalation_contact`

## Switch to Google Sheet Backend

1. Create one Google Sheet tab (example: `Facilities`) with the same columns listed above.
2. In Google Sheets, go to **File -> Share -> Publish to web**.
3. Publish the `Facilities` tab as **Comma-separated values (.csv)**.
4. Copy the generated URL, usually:
`https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=<TAB_GID>`
    e.g. https://docs.google.com/spreadsheets/d/e/2PACX-1vTjeTE3zAWr4XQZmqH0ZsKj0jug2gUqGhD1puOtvNKE033piPOfRfxCl8UNhNLESx7lKiD3kBObDTQ9/pub?output=csv

5. Update `dataSources.facilitiesCsvUrl` in `config.js` with that URL.
6. Keep `societyCsvUrl`, `contactsCsvUrl`, and `operationsContactsCsvUrl` pointing to local files, or replace them with your hosted CSV URLs.

## Deploy / Self-Host

Upload these files to your web server or static hosting:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `data/facilities.csv` (local mode)
- `data/society.csv` (local mode)
- `data/contacts.csv` (local mode)
- `data/society_operations_contacts.csv` (local mode)

## Features

- Facility cards with timings, rules, booking process, instructor, coordinator, contact, and notes.
- Society committee section loaded from CSV.
- Important contacts section loaded from CSV.
- Society operations contacts section loaded from CSV.
- Search filter across all key fields.
- Manual refresh button to reload latest data.

## Notes

- Column names are case-insensitive, spaces are normalized.
- Required columns must be present.
- For private sheet access (not public CSV), use Google Apps Script or authenticated API flow.
