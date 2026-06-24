import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SPREADSHEET_ID = '1AT_Sil0sN5xUADNkuOz2ns01gXlawWlqyidkL4BNG7c';

function numberToLetters(num: number): string {
    let letters = '';
    while (num >= 0) {
        letters = String.fromCharCode(num % 26 + 65) + letters;
        num = Math.floor(num / 26) - 1;
    }
    return letters;
}

async function discover() {
  const logFile = path.resolve(__dirname, 'debug.log');
  fs.writeFileSync(logFile, 'Starting discovery...\n');

  try {
    const credentialsPath = path.resolve(__dirname, '../credentials.json.json');
    fs.appendFileSync(logFile, 'Credentials path: ' + credentialsPath + '\n');

    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    fs.appendFileSync(logFile, 'Auth successful. Fetching Config...\n');

    const configData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Config!A1:AX100',
    });

    fs.appendFileSync(logFile, 'Config fetched.\n');

    const values = configData.data.values || [];
    let configMd = '# Config Sheet Layout\n\n| Row | Col | Cell | Value | Interpretation |\n|---|---|---|---|---|\n';

    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        const val = values[r][c];
        if (val && val.trim() !== '') {
          const colLetter = numberToLetters(c);
          const cell = `${colLetter}${r + 1}`;
          configMd += `| ${r + 1} | ${colLetter} | ${cell} | ${val} | Data |\n`;
        }
      }
    }

    const configDocPath = path.resolve(__dirname, '../docs/config_sheet_layout.md');
    fs.writeFileSync(configDocPath, configMd);
    fs.appendFileSync(logFile, 'config_sheet_layout.md written.\n');

    fs.appendFileSync(logFile, 'Fetching spreadsheet inventory...\n');
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    });

    let inventoryMd = '# Full Sheet Inventory\n\n| Sheet Name | Rows | Columns |\n|---|---|---|\n';

    for (const sheet of response.data.sheets || []) {
      const title = sheet.properties?.title || 'Unknown';
      const rowCount = sheet.properties?.gridProperties?.rowCount || 0;
      const colCount = sheet.properties?.gridProperties?.columnCount || 0;
      inventoryMd += `| ${title} | ${rowCount} | ${colCount} |\n`;
    }

    const inventoryDocPath = path.resolve(__dirname, '../docs/full_sheet_inventory.md');
    fs.writeFileSync(inventoryDocPath, inventoryMd);
    fs.appendFileSync(logFile, 'full_sheet_inventory.md written.\n');

  } catch (error: any) {
    fs.appendFileSync(logFile, 'ERROR: ' + error.message + '\n');
  }
}

discover();
