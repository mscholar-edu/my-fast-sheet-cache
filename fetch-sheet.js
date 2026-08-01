const fs = require('fs');
const { google } = require('googleapis');

async function getSheetData(sheets, sheetId, sheetName) {
  const range = `'${sheetName}'!A1:Z1000`;
  console.log("Trying: " + range);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });
  const rows = res.data.values || [];
  if (rows.length === 0) return [];
  const [headers,...data] = rows;
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (!h) return;
      let key = h.trim();
      if (key.toUpperCase() === 'HOME ADRESS') key = 'HOME ADDRESS';
      obj[key] = row[i] || '';
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

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const allTabs = meta.data.sheets.map(s => s.properties.title);
  console.log("All tabs found:", allTabs);

  const findTab = (names) => {
    for (let n of names) {
      const found = allTabs.find(t => t.toLowerCase() === n.toLowerCase());
      if (found) return found;
    }
    return null;
  };

  const loginTab = findTab(['Sheet1', 'LOGIN', 'logins']) || allTabs[0];
  const profileTab = findTab(['PROFILES', 'Profiles', 'STUDENT PROFILE', 'STUDENTS PROFILE', 'STUDENT PROFILES', 'Profile', 'STUDENTS']) || 'PROFILES';

  console.log(`Using login tab: ${loginTab}, profile tab: ${profileTab}`);

  const loginData = await getSheetData(sheets, sheetId, loginTab);
  fs.writeFileSync('data.json', JSON.stringify(loginData, null, 2));
  console.log(`data.json OK: ${loginData.length} rows`);

  const profileData = await getSheetData(sheets, sheetId, profileTab);
  fs.writeFileSync('profiles.json', JSON.stringify(profileData, null, 2));
  console.log(`profiles.json OK: ${profileData.length} rows`);
  console.log(`Sample:`, profileData[0]);
}
run().catch(e=>{ console.error(e); process.exit(1); });
