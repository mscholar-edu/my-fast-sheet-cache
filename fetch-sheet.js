const fs = require('fs');
const { google } = require('googleapis');

async function run() {
  // Load credentials from GitHub Secret
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const sheetId = process.env.SHEET_ID;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Sheet1!A1:Z1000', // Change to your sheet name/range
  });

  const rows = res.data.values;

  // Convert to nice JSON (first row as keys)
  const [headers,...data] = rows;
  const jsonData = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });

  fs.writeFileSync('data.json', JSON.stringify(jsonData, null, 2));
  console.log(`Saved ${jsonData.length} rows to data.json`);
}

run();
