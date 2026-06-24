import { google } from 'googleapis';
import path from 'path';

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private sheets: any;
  private readonly SPREADSHEET_ID = '1AT_Sil0sN5xUADNkuOz2ns01gXlawWlqyidkL4BNG7c';

  private constructor() {}

  public static async getInstance(): Promise<GoogleSheetsService> {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
      await GoogleSheetsService.instance.initialize();
    }
    return GoogleSheetsService.instance;
  }

  private async initialize() {
    try {
      const credentialsPath = path.resolve(__dirname, '../../../../credentials.json.json');
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const client = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: client as any });
      console.log('[GoogleSheetsService] Successfully initialized Google Sheets SDK');
    } catch (error) {
      console.error('[GoogleSheetsService] Failed to initialize Google Sheets SDK:', error);
      throw error;
    }
  }

  /**
   * Fetch all raw rows from a specific sheet tab.
   * Returns a 2D array of strings.
   */
  public async getSheetData(sheetName: string, range: string = 'A1:Z50000'): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: `${sheetName}!${range}`,
      });
      return response.data.values || [];
    } catch (error: any) {
      console.error(`[GoogleSheetsService] Error fetching sheet ${sheetName}:`, error.message);
      throw new Error(`Failed to fetch Google Sheet data for ${sheetName}`);
    }
  }

  /**
   * Helper to parse 2D array into an array of objects based on header row.
   * Assumes row 0 contains the headers.
   */
  public parseToJSON(values: any[][]): Record<string, any>[] {
    if (!values || values.length <= 1) return [];

    const headers = values[0];
    const dataRows = values.slice(1);

    return dataRows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        // Safe check for undefined columns in rows shorter than header
        obj[header.trim()] = row[index] !== undefined ? row[index] : null;
      });
      return obj;
    });
  }
}
