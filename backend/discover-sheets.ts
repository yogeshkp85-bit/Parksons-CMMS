import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '1AT_Sil0sN5xUADNkuOz2ns01gXlawWlqyidkL4BNG7c';

async function discover() {
  const credentialsPath = path.resolve(__dirname, '../credentials.json.json');
  console.log('Using credentials:', credentialsPath);

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client as any });

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    });

    console.log(`\nSpreadsheet Title: ${response.data.properties?.title}`);
    console.log('--- Sheets ---');

    for (const sheet of response.data.sheets || []) {
      const title = sheet.properties?.title || 'Unknown';
      const rowCount = sheet.properties?.gridProperties?.rowCount || 0;
      const colCount = sheet.properties?.gridProperties?.columnCount || 0;

      // Fetch the first row to get headers
      let headers: string[] = [];
      try {
        const headerData = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${title}!1:1`,
        });
        headers = headerData.data.values ? headerData.data.values[0] : [];
      } catch (err) {
        console.error(`Could not fetch headers for ${title}`);
      }

      console.log(`\nSheet: ${title}`);
      console.log(`Grid: ${rowCount} rows x ${colCount} cols`);
      console.log(`Headers: ${headers.join(' | ')}`);
    }

  } catch (error: any) {
    console.error('Error fetching spreadsheet:', error.message);
  }
}

discover();
