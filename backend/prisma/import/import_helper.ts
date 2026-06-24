import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

/**
 * Promisified CSV reader using csv-parser.
 */
export function readCsv(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(absolutePath)) {
      return reject(new Error(`CSV File not found at path: ${absolutePath}`));
    }
    
    fs.createReadStream(absolutePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('error', (err) => reject(err))
      .on('end', () => resolve(results));
  });
}

/**
 * Safe parsing of standard and Indian date formats (e.g. dd/MM/yyyy HH:mm:ss or yyyy-MM-dd HH:mm:ss).
 */
export function parseDate(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  val = val.trim();

  // Try standard ISO / JS parsing
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Parse Indian format: dd/MM/yyyy HH:mm:ss or similar
  const parts = val.split(/[/\s:]/); // Split on slash, space, and colon
  if (parts.length >= 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    let hour = 0, minute = 0, second = 0;
    if (parts.length >= 6) {
      hour = parseInt(parts[3], 10);
      minute = parseInt(parts[4], 10);
      second = parseInt(parts[5], 10);
    }

    // Default to Indian dd/MM/yyyy behavior
    let day = p1;
    let month = p2 - 1; // 0-indexed in JS

    // Check if it is MM/dd/yyyy instead:
    if (p1 <= 12 && p2 > 12) {
      day = p2;
      month = p1 - 1;
    } else if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2 - 1;
    }

    const d = new Date(year, month, day, hour, minute, second);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return null;
}

/**
 * Normalizes headers from Google Sheets to match Prisma properties.
 * Checks for key matching after trimming whitespace, converting to lowercase, 
 * and removing underscores/dashes/spaces.
 */
export function getValue(row: any, keys: string[]): any {
  const normalize = (s: string) => s.replace(/[\s-_]/g, '').toLowerCase();
  
  for (const k of keys) {
    const normK = normalize(k);
    if (row[k] !== undefined) return row[k];
    
    // Scan all keys in the row
    for (const rowKey of Object.keys(row)) {
      if (normalize(rowKey) === normK) {
        return row[rowKey];
      }
    }
  }
  return undefined;
}

/**
 * Standard utility to split arrays into chunks for database batch inserts.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Logs or appends historical import stats to IMPORT_REPORT.md in the workspace root.
 */
export function writeImportReport(
  moduleName: string,
  processed: number,
  inserted: number,
  duplicates: number,
  errors: number,
  errorLogs: string[]
): void {
  // Report is located at the root of the workspace d:\Parksons-CMMS-Dev
  const reportPath = path.resolve(__dirname, '../../../IMPORT_REPORT.md');
  const nowStr = new Date().toISOString();
  
  let content = '';
  if (!fs.existsSync(reportPath)) {
    content += `# Google Sheets Historical Import Report\n\n`;
    content += `This report tracks the status of data imports from historical Google Sheets files.\n\n`;
    content += `| Timestamp | Module Name | Rows Processed | Rows Inserted | Duplicates Skipped | Errors | Status |\n`;
    content += `| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n`;
  }
  
  const status = errors > 0 ? '⚠️ WARNING/ERRORS' : '✅ SUCCESS';
  content += `| ${nowStr} | ${moduleName} | ${processed} | ${inserted} | ${duplicates} | ${errors} | ${status} |\n`;
  
  if (errorLogs && errorLogs.length > 0) {
    content += `\n### Error Logs for ${moduleName} (${nowStr}):\n`;
    for (const log of errorLogs.slice(0, 100)) { // Limit to top 100 errors to prevent huge files
      content += `- ${log}\n`;
    }
    if (errorLogs.length > 100) {
      content += `- ... and ${errorLogs.length - 100} more errors.\n`;
    }
    content += `\n---\n`;
  }
  
  fs.appendFileSync(reportPath, content, 'utf8');
  console.log(`[Import Helper] Wrote import status for ${moduleName} to IMPORT_REPORT.md`);
}
