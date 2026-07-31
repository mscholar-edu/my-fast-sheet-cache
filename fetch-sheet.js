const fs = require('fs');
const { google } = require('googleapis');

async function getSheetData(sheets, sheetId, sheetName) {
  // FIX: Wrap sheet name with ' ' if it has space
  const range = `'${sheetName}'!A1:Z1000`;
  console.log("Fetching:", range);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const [headers, ...data] = rows;
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if(h) obj[h.trim()] = row[i] || '';
    });
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

  // 1. Sheet1 -> data.json
  const loginData = await getSheetData(sheets, sheetId, 'Sheet1');
  fs.writeFileSync('data.json', JSON.stringify(loginData, null, 2));
  console.log(`Saved data.json: ${loginData.length} rows`);

  // 2. STUDENTS PROFILE -> profiles.json
  try {
    const profileData = await getSheetData(sheets, sheetId, 'STUDENTS PROFILE');
    fs.writeFileSync('profiles.json', JSON.stringify(profileData, null, 2));
    console.log(`Saved profiles.json: ${profileData.length} rows`);
  } catch(e) {
    console.log("STUDENTS PROFILE failed:", e.message);
    // try without space as fallback
    try {
      const profileData = await getSheetData(sheets, sheetId, 'STUDENT PROFILE');
      fs.writeFileSync('profiles.json', JSON.stringify(profileData, null, 2));
    } catch(e2){
      fs.writeFileSync('profiles.json', JSON.stringify([], null, 2));
    }
  }
}
run();
