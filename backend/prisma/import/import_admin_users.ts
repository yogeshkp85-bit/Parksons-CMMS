import prisma from '../../src/utils/db';
import { readCsv, getValue, chunk, writeImportReport } from './import_helper';
import bcrypt from 'bcrypt';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide path to Admin Users CSV file.');
    console.error('Usage: npm run import:users <path_to_csv>');
    process.exit(1);
  }

  const csvPath = args[0];
  console.log(`Starting Admin Users import from: ${csvPath}`);

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
    // Fetch all existing emails to deduplicate
    const existing = await prisma.adminUsers.findMany({
      select: { email: true }
    });
    const existingEmails = new Set(existing.map(u => u.email.trim().toLowerCase()));

    const newUsers: any[] = [];
    const csvSeenEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = getValue(row, ['name', 'Name', 'username']);
      const email = getValue(row, ['email', 'Email']);
      const password = getValue(row, ['password', 'Password', 'pass']);
      const level = getValue(row, ['level', 'Level', 'role', 'Role']);

      if (!name || !email || !password || !level) {
        errors++;
        errorLogs.push(`Row ${i + 2}: Missing required fields (name, email, password, level).`);
        continue;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if duplicate in CSV or database
      if (existingEmails.has(normalizedEmail) || csvSeenEmails.has(normalizedEmail)) {
        duplicates++;
        continue;
      }

      csvSeenEmails.add(normalizedEmail);

      // Verify and hash password if plaintext
      let pwd = String(password).trim();
      if (!pwd.startsWith('$2b$') && !pwd.startsWith('$2a$')) {
        pwd = await bcrypt.hash(pwd, 10);
      }

      newUsers.push({
        name: name.trim(),
        email: normalizedEmail,
        password: pwd,
        level: level.trim().toLowerCase()
      });
    }

    if (newUsers.length > 0) {
      const batched = chunk(newUsers, 500);
      for (const batch of batched) {
        const result = await prisma.adminUsers.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += result.count;
      }
    }

    console.log(`Admin Users import completed. Processed: ${processed}, Inserted: ${inserted}, Duplicates: ${duplicates}, Errors: ${errors}`);
    writeImportReport('AdminUsers', processed, inserted, duplicates, errors, errorLogs);
  } catch (err: any) {
    console.error(`Import execution error: ${err.message}`);
    writeImportReport('AdminUsers', processed, 0, 0, processed, [err.message]);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
