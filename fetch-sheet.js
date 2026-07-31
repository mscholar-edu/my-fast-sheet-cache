const fs = require('fs');
const { google } = require('googleapis');

async function getSheetData(sheets, sheetId, sheetName) {
  try {
    const range = `'${sheetName}'!A1:Z1000`;
    console.log("Trying: " + range);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });
    const rows = res.data.values || [];
    if (rows.length === 0) return [];
    const [headers, ...data] = rows;
    return data.map(row => {
      let obj = {};
      headers.forEach((h, i) => { if (h) obj[h.trim()] = row[i] || ''; });
      return obj;
    });
  } catch (e) {
    console.log(`FAILED to fetch ${sheetName}: ${e.message}`);
    return null; // signal fail
  }
}

async function run() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const sheetId = process.env.SHEET_ID;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const loginData = await getSheetData(sheets, sheetId, 'Sheet1');
  if (loginData) {
    fs.writeFileSync('data.json', JSON.stringify(loginData, null, 2));
    console.log(`data.json OK: ${loginData.length} rows`);
  }

  // Try PROFILES, if fails try Sheet name with different cases
  let profileData = await getSheetData(sheets, sheetId, 'PROFILES');
  if (!profileData) profileData = await getSheetData(sheets, sheetId, 'Profiles');
  if (!profileData) profileData = await getSheetData(sheets, sheetId, 'STUDENTS PROFILE');
  
  if (profileData) {
    fs.writeFileSync('profiles.json', JSON.stringify(profileData, null, 2));
    console.log(`profiles.json OK: ${profileData.length} rows`);
  } else {
    fs.writeFileSync('profiles.json', JSON.stringify([], null, 2));
    console.log("profiles.json created as empty [] to prevent crash");
  }

  console.log("SUCCESS");
}
run();
