const fs = require('fs');
const { google } = require('googleapis');

async function getSheetData(sheets, sheetId, sheetName) {
  const range = `'${sheetName}'!A1:Z1000`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const [headers,...data] = rows;
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => { if(h) obj[h.trim()] = row[i] || ''; });
    return obj;
  });
}

async function run() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const sheetId = process.env.SHEET_ID;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Sheet1 = login
  const loginData = await getSheetData(sheets, sheetId, 'Sheet1');
  fs.writeFileSync('data.json', JSON.stringify(loginData, null, 2));

  // PROFILES = your screenshot tab
  const profileData = await getSheetData(sheets, sheetId, 'PROFILES');
  fs.writeFileSync('profiles.json', JSON.stringify(profileData, null, 2));

  console.log("DONE");
}
run();
