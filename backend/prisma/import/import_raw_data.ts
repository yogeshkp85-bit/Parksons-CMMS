import prisma from '../../src/utils/db';
import { readCsv, getValue, parseDate, chunk, writeImportReport } from './import_helper';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide path to Raw Data CSV file.');
    console.error('Usage: npm run import:raw <path_to_csv>');
    process.exit(1);
  }

  const csvPath = args[0];
  console.log(`Starting Raw Data import from: ${csvPath}`);

  let rows: any[] = [];
  try {
    rows = await readCsv(csvPath);
  } catch (error: any) {
    console.error(`Failed to read CSV: ${error.message}`);
    process.exit(1);
  }

  const processed = rows.length;
  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  const errorLogs: string[] = [];

  try {
    // Fetch all existing Ref_IDs in DB to deduplicate
    const existing = await prisma.rawData.findMany({
      select: { Ref_ID: true }
    });
    const existingRefIds = new Set(existing.map(r => r.Ref_ID.trim().toLowerCase()));

    const newRecords: any[] = [];
    const csvSeenRefIds = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const refId = getValue(row, ['Ref_ID', 'Ref ID', 'refId', 'Ref-ID', 'RefID']);
      const timestampStr = getValue(row, ['Timestamp', 'timestamp']);
      const date = getValue(row, ['Date', 'date']);
      const shift = getValue(row, ['Shift', 'shift']);
      const machineType = getValue(row, ['Machine_Type', 'Machine Type', 'Machine_Type', 'machineType']);
      const machineName = getValue(row, ['Machine_Name', 'Machine Name', 'Machine_Name', 'machineName']);
      const unit = getValue(row, ['Unit', 'unit']);
      const problemType = getValue(row, ['Problem_Type', 'Problem Type', 'Problem_Type', 'problemType']);
      const category = getValue(row, ['Category', 'category']);
      const description = getValue(row, ['Description', 'description']);
      const actionTaken = getValue(row, ['Action_Taken', 'Action Taken', 'Action_Taken', 'actionTaken']);
      const rootCause = getValue(row, ['Root_Cause', 'Root Cause', 'Root_Cause', 'rootCause']);
      const timeStart = getValue(row, ['Time_Start', 'Time Start', 'Time_Start', 'timeStart']);
      const timeEnd = getValue(row, ['Time_End', 'Time End', 'Time_End', 'timeEnd']);
      const durationMinStr = getValue(row, ['Duration_Min', 'Duration Min', 'duration', 'Minutes', 'minutes']);
      const attendedBy = getValue(row, ['Attended_By', 'Attended By', 'Attended_By', 'attendedBy']);
      const submittedBy = getValue(row, ['Submitted_By', 'Submitted By', 'Submitted_By', 'submittedBy']);
      const remarks = getValue(row, ['Remarks', 'remarks']);
      const status = getValue(row, ['Status', 'status']);

      if (!refId) {
        errors++;
        errorLogs.push(`Row ${i + 2}: Missing Ref_ID.`);
        continue;
      }

      const normalizedRefId = String(refId).trim();
      const lookupRefId = normalizedRefId.toLowerCase();

      // Check if duplicate
      if (existingRefIds.has(lookupRefId) || csvSeenRefIds.has(lookupRefId)) {
        duplicates++;
        continue;
      }

      csvSeenRefIds.add(lookupRefId);

      // Safe conversions
      const timestamp = timestampStr ? parseDate(timestampStr) : null;
      
      let durationMin: number | null = null;
      if (durationMinStr !== undefined && durationMinStr !== null && durationMinStr !== '') {
        const parsedVal = parseFloat(durationMinStr);
        if (!isNaN(parsedVal)) {
          durationMin = parsedVal;
        }
      }

      newRecords.push({
        Ref_ID: normalizedRefId,
        Timestamp: timestamp,
        Date: date ? String(date).trim() : null,
        Shift: shift ? String(shift).trim() : null,
        Machine_Type: machineType ? String(machineType).trim() : null,
        Machine_Name: machineName ? String(machineName).trim() : null,
        Unit: unit ? String(unit).trim() : null,
        Problem_Type: problemType ? String(problemType).trim() : null,
        Category: category ? String(category).trim() : null,
        Description: description ? String(description).trim() : null,
        Action_Taken: actionTaken ? String(actionTaken).trim() : null,
        Root_Cause: rootCause ? String(rootCause).trim() : null,
        Time_Start: timeStart ? String(timeStart).trim() : null,
        Time_End: timeEnd ? String(timeEnd).trim() : null,
        Duration_Min: durationMin,
        Attended_By: attendedBy ? String(attendedBy).trim() : null,
        Submitted_By: submittedBy ? String(submittedBy).trim() : null,
        Remarks: remarks ? String(remarks).trim() : null,
        Status: status ? String(status).trim() : 'PENDING_REVIEW'
      });
    }

    if (newRecords.length > 0) {
      const batched = chunk(newRecords, 500);
      for (const batch of batched) {
        const result = await prisma.rawData.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += result.count;
      }
    }

    console.log(`Raw Data import completed. Processed: ${processed}, Inserted: ${inserted}, Duplicates: ${duplicates}, Errors: ${errors}`);
    writeImportReport('RawData', processed, inserted, duplicates, errors, errorLogs);
  } catch (err: any) {
    console.error(`Import execution error: ${err.message}`);
    writeImportReport('RawData', processed, 0, 0, processed, [err.message]);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
