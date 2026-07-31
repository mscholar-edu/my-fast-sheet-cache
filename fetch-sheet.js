const fs = require('fs');
const { google } = require('googleapis');

async function getSheetData(sheets, sheetId, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const [headers,...data] = rows;
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = row[i] || '');
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

  // 1. Login accounts from Sheet1
  const loginData = await getSheetData(sheets, sheetId, 'Sheet1!A1:Z1000');
  fs.writeFileSync('data.json', JSON.stringify(loginData, null, 2));

  // 2. Profiles from STUDENTS PROFILE sheet
  try {
    const profileData = await getSheetData(sheets, sheetId, 'STUDENTS PROFILE!A1:Z1000');
    fs.writeFileSync('profiles.json', JSON.stringify(profileData, null, 2));
  } catch(e){ console.log("No STUDENTS PROFILE sheet found, skipping"); }

  console.log("Saved data.json and profiles.json");
}
run();
