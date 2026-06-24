import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '1AT_Sil0sN5xUADNkuOz2ns01gXlawWlqyidkL4BNG7c';

async function discoverConfig() {
  const credentialsPath = path.resolve(__dirname, '../credentials.json.json');
  
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client as any });

  try {
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Config!A1:Z50',
    });
    console.log(JSON.stringify(data.data.values, null, 2));
  } catch (error: any) {
    console.error('Error fetching Config:', error.message);
  }
}

discoverConfig();
