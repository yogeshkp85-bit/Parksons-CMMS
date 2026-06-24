import prisma from '../../src/utils/db';
import { readCsv, getValue, chunk, writeImportReport } from './import_helper';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide path to Final Data CSV file.');
    console.error('Usage: npm run import:final <path_to_csv>');
    process.exit(1);
  }

  const csvPath = args[0];
  console.log(`Starting Final Data import from: ${csvPath}`);

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
    // Fetch all existing Ref_IDs in FinalData to deduplicate
    const existing = await prisma.finalData.findMany({
      select: { Ref_ID: true }
    });
    const existingRefIds = new Set(existing.map(f => f.Ref_ID.trim().toLowerCase()));

    const newRecords: any[] = [];
    const csvSeenRefIds = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const refId = getValue(row, ['Ref_ID', 'Ref ID', 'refId', 'Ref-ID', 'RefID']);
      const monthYear = getValue(row, ['Month_Year', 'Month-Year', 'MonthYear', 'monthYear']);
      const date = getValue(row, ['Date', 'date']);
      const shift = getValue(row, ['Shift', 'shift']);
      const machineType = getValue(row, ['Machine_Type', 'Machine Type', 'Machine_Type', 'machineType']);
      const machineName = getValue(row, ['Machine_Name', 'Machine Name', 'Machine_Name', 'machineName']);
      const unit = getValue(row, ['Unit', 'unit']);
      const problemType = getValue(row, ['Problem_Type', 'Problem Type', 'Problem_Type', 'problemType']);
      const category = getValue(row, ['Category', 'category']);
      const description = getValue(row, ['Description', 'description']);
      const actionTaken = getValue(row, ['Action_Taken', 'Action Taken', 'Action_Taken', 'actionTaken']);
      const timeStart = getValue(row, ['Time_Start', 'Time Start', 'Time_Start', 'timeStart']);
      const timeEnd = getValue(row, ['Time_End', 'Time End', 'Time_End', 'timeEnd']);
      const minutesStr = getValue(row, ['Minutes', 'minutes', 'Minutes_Duration', 'MinutesDuration']);
      const bdFlagStr = getValue(row, ['BD_Flag', 'BD Flag', 'bdFlag']);
      const availableTimeMinStr = getValue(row, ['Available_Time_Min', 'Available Time Min', 'AvailableTimeMin', 'availableTimeMin']);
      const attendedBy = getValue(row, ['Attended_By', 'Attended By', 'Attended_By', 'attendedBy']);

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

      // Safe numeric conversions
      let minutes: number | null = null;
      if (minutesStr !== undefined && minutesStr !== null && minutesStr !== '') {
        const parsedVal = parseFloat(minutesStr);
        if (!isNaN(parsedVal)) minutes = parsedVal;
      }

      let bdFlag: number | null = null;
      if (bdFlagStr !== undefined && bdFlagStr !== null && bdFlagStr !== '') {
        const parsedVal = parseInt(bdFlagStr, 10);
        if (!isNaN(parsedVal)) bdFlag = parsedVal;
      }

      let availableTimeMin: number | null = null;
      if (availableTimeMinStr !== undefined && availableTimeMinStr !== null && availableTimeMinStr !== '') {
        const parsedVal = parseFloat(availableTimeMinStr);
        if (!isNaN(parsedVal)) availableTimeMin = parsedVal;
      }

      newRecords.push({
        Ref_ID: normalizedRefId,
        Month_Year: monthYear ? String(monthYear).trim() : null,
        Date: date ? String(date).trim() : null,
        Shift: shift ? String(shift).trim() : null,
        Machine_Type: machineType ? String(machineType).trim() : null,
        Machine_Name: machineName ? String(machineName).trim() : null,
        Unit: unit ? String(unit).trim() : null,
        Problem_Type: problemType ? String(problemType).trim() : null,
        Category: category ? String(category).trim() : null,
        Description: description ? String(description).trim() : null,
        Action_Taken: actionTaken ? String(actionTaken).trim() : null,
        Time_Start: timeStart ? String(timeStart).trim() : null,
        Time_End: timeEnd ? String(timeEnd).trim() : null,
        Minutes: minutes,
        BD_Flag: bdFlag,
        Available_Time_Min: availableTimeMin,
        Attended_By: attendedBy ? String(attendedBy).trim() : null
      });
    }

    if (newRecords.length > 0) {
      const batched = chunk(newRecords, 500);
      for (const batch of batched) {
        const result = await prisma.finalData.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += result.count;
      }
    }

    console.log(`Final Data import completed. Processed: ${processed}, Inserted: ${inserted}, Duplicates: ${duplicates}, Errors: ${errors}`);
    writeImportReport('FinalData', processed, inserted, duplicates, errors, errorLogs);
  } catch (err: any) {
    console.error(`Import execution error: ${err.message}`);
    writeImportReport('FinalData', processed, 0, 0, processed, [err.message]);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
