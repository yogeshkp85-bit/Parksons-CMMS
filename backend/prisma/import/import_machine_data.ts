import prisma from '../../src/utils/db';
import { readCsv, getValue, chunk, writeImportReport } from './import_helper';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide path to Machine Data CSV file.');
    console.error('Usage: npm run import:machine <path_to_csv>');
    process.exit(1);
  }

  const csvPath = args[0];
  console.log(`Starting Machine Data import from: ${csvPath}`);

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
    // Fetch all existing machines to deduplicate in memory
    const existing = await prisma.machineData.findMany({
      select: { machine_name: true }
    });
    const existingNames = new Set(existing.map(m => m.machine_name.trim().toLowerCase()));

    const newMachines: any[] = [];
    const csvSeenNames = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const type = getValue(row, ['machine_type', 'Machine Type', 'type']);
      const name = getValue(row, ['machine_name', 'Machine Name', 'name']);
      const units = getValue(row, ['units', 'Units', 'sub_assemblies']);

      if (!type || !name) {
        errors++;
        errorLogs.push(`Row ${i + 2}: Missing machine_type or machine_name.`);
        continue;
      }

      const normalizedName = name.trim();
      const lookupName = normalizedName.toLowerCase();

      // Check if duplicate in CSV or database
      if (existingNames.has(lookupName) || csvSeenNames.has(lookupName)) {
        duplicates++;
        continue;
      }

      csvSeenNames.add(lookupName);
      newMachines.push({
        machine_type: type.trim(),
        machine_name: normalizedName,
        units: units ? String(units).trim() : ''
      });
    }

    if (newMachines.length > 0) {
      const batched = chunk(newMachines, 500);
      for (const batch of batched) {
        const result = await prisma.machineData.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += result.count;
      }
    }

    console.log(`Machine Data import completed. Processed: ${processed}, Inserted: ${inserted}, Duplicates: ${duplicates}, Errors: ${errors}`);
    writeImportReport('MachineData', processed, inserted, duplicates, errors, errorLogs);
  } catch (err: any) {
    console.error(`Import execution error: ${err.message}`);
    writeImportReport('MachineData', processed, 0, 0, processed, [err.message]);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
