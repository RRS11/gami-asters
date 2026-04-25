window.APP_CONFIG = {
  // Prefer per-section CSV files (one CSV per home card).
  dataSources: {
    facilitiesCsvUrl: "./data/facilities.csv",
    societyCsvUrl: "./data/society.csv",
    contactsCsvUrl: "./data/contacts.csv",
    operationsContactsCsvUrl: "./data/society_operations_contacts.csv"
  }

  // Optional legacy fallback (facilities only):
  // sheetCsvUrl: "PASTE_YOUR_PUBLISHED_GOOGLE_SHEET_CSV_URL_HERE"
};
