# C.H.S Gami Asters - Facility Information Page

Self-hosted single-page site for society facility information.

Current default setup is **Google Sheet CSV mode**. Local CSV mode is still supported by switching the commented `dataSources` block in `config.js`.

## Quick Start

`config.js` is already configured to use published Google Sheet CSV URLs for:

- `facilitiesCsvUrl`
- `managementCommitteeCsvUrl`
- `emergencyContactsCsvUrl`
- `operationsContactsCsvUrl`
- `noticesCsvUrl`
- `bannersCsvUrl`

Run a local static server:

```bash
python3 -m http.server 8080
```

Open:

`http://localhost:8080`

To use local CSV files instead, uncomment the local `dataSources` block in `config.js` and provide the matching files under `./data/`.

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
- `badge`, `badge_type`, `icon` (optional)

`data/management_committee.csv` must include:

- `name`
- `role`
- `contact` (optional)
- `imp` (optional, highlight row when set to `true`/`yes`/`1`/`y`)
- `badge`, `badge_type`, `icon` (optional)

`data/emergency_contacts.csv` must include:

- `service`
- `contact`
- `notes` (optional)
- `imp` (optional, highlight row when set to `true`/`yes`/`1`/`y`)
- `badge`, `badge_type`, `icon` (optional)

`data/society_operations_contacts.csv` includes:

- `scope_of_work`
- `name`
- `contact`
- `office_hours`
- `escalation_contact`
- `badge`, `badge_type`, `icon` (optional)

`data/notices.csv` includes:

- `notice_name`
- `pdf_url`
- `issued_date` (optional)
- `effective_date` (optional)
- `imp` (optional, highlight row when set to `true`/`yes`/`1`/`y`)
- `badge`, `badge_type`, `icon` (optional)

`data/banners.csv` includes:

- `banner_title`
- `icon` (optional)

Each banner row is rendered as one marquee item in the top notice banner. If the file contains only a valid header such as `banner_title,icon` and no data rows, the banner area is hidden. Banner data loads independently from the main page sections, so banner fetch errors do not block facilities, contacts, operations, or notices.

Optional badge columns can be used in any CSV-backed section that supports them:

- `badge`: visible badge text, for example `New`, `Important`, or `Emergency`
- `badge_type`: one of `info`, `important`, `danger`, `new`, or `success`
- `icon`: optional emoji/icon shown before the badge text

When `imp` is true and no custom badge is provided, the UI shows a default `Important` badge.

## Update Google Sheet Backend

1. Create one Google Sheet tab per CSV-backed section, or one sheet with separate tabs, using the columns listed above.
2. In Google Sheets, go to **File -> Share -> Publish to web**.
3. Publish each tab as **Comma-separated values (.csv)**.
4. Copy the generated URL, usually:
`https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=csv&gid=<TAB_GID>`
    e.g. https://docs.google.com/spreadsheets/d/e/2PACX-1vTjeTE3zAWr4XQZmqH0ZsKj0jug2gUqGhD1puOtvNKE033piPOfRfxCl8UNhNLESx7lKiD3kBObDTQ9/pub?output=csv

5. Update the matching key in `config.js`: `facilitiesCsvUrl`, `managementCommitteeCsvUrl`, `emergencyContactsCsvUrl`, `operationsContactsCsvUrl`, `noticesCsvUrl`, or `bannersCsvUrl`.
6. Repeat for every section you want to load from Google Sheets.

## Deploy / Self-Host

Upload these files to your web server or static hosting:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `data/*.csv` only if using local CSV mode

## Features

- Marquee notice banner loaded from `bannersCsvUrl`.
- Facility cards with timings, rules, booking process, instructor, coordinator, contact, and notes.
- Management committee section loaded from CSV.
- Emergency contacts section loaded from CSV.
- Society operations contacts section loaded from CSV.
- Past notices section loaded from CSV with in-page PDF preview, newest row shown first.
- Reusable header icons and CSV-driven badges for important, danger, new, info, and success labels.
- Search filter across all key fields.
- Manual refresh button to reload latest data.

## Notes

- Column names are case-insensitive, spaces are normalized.
- Required columns must be present.
- Some CSV exports that wrap an entire row in one quoted field are normalized automatically.
- Marquee speed is controlled in `styles.css` by the duration in `animation: marquee 30s linear infinite;`.
- For private sheet access (not public CSV), use Google Apps Script or authenticated API flow.
