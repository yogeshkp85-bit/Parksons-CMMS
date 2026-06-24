import prisma from '../../src/utils/db';
import { readCsv, getValue, chunk, writeImportReport } from './import_helper';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide path to Historical KPI CSV file.');
    console.error('Usage: npm run import:kpi <path_to_csv>');
    process.exit(1);
  }

  const csvPath = args[0];
  console.log(`Starting Historical KPI import from: ${csvPath}`);

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
    // Fetch existing records to build in-memory duplicate set (since there is no unique constraint)
    const existing = await prisma.historicalKPI.findMany({
      select: { FY: true, Month: true, Machine: true }
    });
    const existingKeys = new Set(
      existing.map(k => `${String(k.FY || '').trim().toLowerCase()}_${String(k.Month || '').trim().toLowerCase()}_${String(k.Machine || '').trim().toLowerCase()}`)
    );

    const newRecords: any[] = [];
    const csvSeenKeys = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fy = getValue(row, ['FY', 'Financial_Year', 'Financial Year', 'financialYear']);
      const month = getValue(row, ['Month', 'month']);
      const machine = getValue(row, ['Machine', 'machine', 'Machine_Name', 'Machine Name']);
      const availTimeStr = getValue(row, ['Available_Time', 'Available Time', 'availTime', 'Available_Time_Min', 'Available Time Min']);
      const bdTimeStr = getValue(row, ['Breakdown_Time', 'Breakdown Time', 'bdTime', 'Breakdown_Time_Min', 'Breakdown Time Min']);
      const bdCountStr = getValue(row, ['Breakdown_Count', 'Breakdown Count', 'bdCount', 'Breakdown_Count_Total', 'Breakdown Count Total']);
      const uptimeStr = getValue(row, ['Uptime', 'uptime']);
      const mttrStr = getValue(row, ['MTTR', 'mttr']);
      const mtbfStr = getValue(row, ['MTBF', 'mtbf']);
      const availabilityStr = getValue(row, ['Availability', 'availability', 'Availability_Percent', 'Availability Percent']);

      if (!fy || !month || !machine) {
        errors++;
        errorLogs.push(`Row ${i + 2}: Missing required composite fields (FY, Month, Machine).`);
        continue;
      }

      const normalizedFy = String(fy).trim();
      const normalizedMonth = String(month).trim();
      const normalizedMachine = String(machine).trim();

      const lookupKey = `${normalizedFy.toLowerCase()}_${normalizedMonth.toLowerCase()}_${normalizedMachine.toLowerCase()}`;

      // Check duplicate
      if (existingKeys.has(lookupKey) || csvSeenKeys.has(lookupKey)) {
        duplicates++;
        continue;
      }

      csvSeenKeys.add(lookupKey);

      // Conversions
      let availableTime: number | null = null;
      if (availTimeStr !== undefined && availTimeStr !== null && availTimeStr !== '') {
        const parsedVal = parseFloat(availTimeStr);
        if (!isNaN(parsedVal)) availableTime = parsedVal;
      }

      let breakdownTime: number | null = null;
      if (bdTimeStr !== undefined && bdTimeStr !== null && bdTimeStr !== '') {
        const parsedVal = parseFloat(bdTimeStr);
        if (!isNaN(parsedVal)) breakdownTime = parsedVal;
      }

      let breakdownCount: number | null = null;
      if (bdCountStr !== undefined && bdCountStr !== null && bdCountStr !== '') {
        const parsedVal = parseInt(bdCountStr, 10);
        if (!isNaN(parsedVal)) breakdownCount = parsedVal;
      }

      let uptime: number | null = null;
      if (uptimeStr !== undefined && uptimeStr !== null && uptimeStr !== '') {
        const parsedVal = parseFloat(uptimeStr);
        if (!isNaN(parsedVal)) uptime = parsedVal;
      }

      let mttr: number | null = null;
      if (mttrStr !== undefined && mttrStr !== null && mttrStr !== '') {
        const parsedVal = parseFloat(mttrStr);
        if (!isNaN(parsedVal)) mttr = parsedVal;
      }

      let mtbf: number | null = null;
      if (mtbfStr !== undefined && mtbfStr !== null && mtbfStr !== '') {
        const parsedVal = parseFloat(mtbfStr);
        if (!isNaN(parsedVal)) mtbf = parsedVal;
      }

      let availability: number | null = null;
      if (availabilityStr !== undefined && availabilityStr !== null && availabilityStr !== '') {
        const parsedVal = parseFloat(availabilityStr);
        if (!isNaN(parsedVal)) availability = parsedVal;
      }

      newRecords.push({
        FY: normalizedFy,
        Month: normalizedMonth,
        Machine: normalizedMachine,
        Available_Time: availableTime,
        Breakdown_Time: breakdownTime,
        Breakdown_Count: breakdownCount,
        Uptime: uptime,
        MTTR: mttr,
        MTBF: mtbf,
        Availability: availability
      });
    }

    if (newRecords.length > 0) {
      const batched = chunk(newRecords, 500);
      for (const batch of batched) {
        const result = await prisma.historicalKPI.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += result.count;
      }
    }

    console.log(`Historical KPI import completed. Processed: ${processed}, Inserted: ${inserted}, Duplicates: ${duplicates}, Errors: ${errors}`);
    writeImportReport('HistoricalKPI', processed, inserted, duplicates, errors, errorLogs);
  } catch (err: any) {
    console.error(`Import execution error: ${err.message}`);
    writeImportReport('HistoricalKPI', processed, 0, 0, processed, [err.message]);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
