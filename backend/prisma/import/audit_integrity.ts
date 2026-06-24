import prisma from '../../src/utils/db';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Starting Data Integrity Audit...');

  try {
    // 1. Record Counts
    const rawCount = await prisma.rawData.count();
    const finalCount = await prisma.finalData.count();
    const machineCount = await prisma.machineData.count();
    const userCount = await prisma.adminUsers.count();
    const kpiCount = await prisma.historicalKPI.count();

    // 2. Status Distribution in RawData
    const statusGroup = await prisma.rawData.groupBy({
      by: ['Status'],
      _count: {
        id: true
      }
    });

    const statusCounts: Record<string, number> = {};
    for (const g of statusGroup) {
      statusCounts[g.Status || 'NULL'] = g._count.id;
    }

    // 3. Month-wise Distribution in RawData/FinalData
    const monthGroup = await prisma.finalData.groupBy({
      by: ['Month_Year'],
      _count: {
        id: true
      }
    });

    // 4. Duplicate Ref_ID Check
    const rawRefIds = await prisma.rawData.findMany({ select: { Ref_ID: true } });
    const rawDuplicates = findDuplicates(rawRefIds.map(r => r.Ref_ID));

    const finalRefIds = await prisma.finalData.findMany({ select: { Ref_ID: true } });
    const finalDuplicates = findDuplicates(finalRefIds.map(f => f.Ref_ID));

    // 5. Empty Fields Audit (RawData)
    const emptyDesc = await prisma.rawData.count({ where: { Description: { equals: '' } } });
    const emptyMachine = await prisma.rawData.count({ where: { Machine_Name: { equals: '' } } });
    const emptyDate = await prisma.rawData.count({ where: { Date: { equals: '' } } });

    // 6. Invalid Dates Audit (RawData)
    const invalidTimestamps = await prisma.rawData.count({ where: { Timestamp: null } });

    // 7. Missing Machine References Check
    // Get all valid machine names
    const machines = await prisma.machineData.findMany({ select: { machine_name: true } });
    const machineSet = new Set(machines.map(m => m.machine_name.trim().toLowerCase()));

    // Get all unique machine names referenced in RawData
    const rawMachines = await prisma.rawData.findMany({ select: { Machine_Name: true }, distinct: ['Machine_Name'] });
    const missingMachineRefs: string[] = [];
    for (const rm of rawMachines) {
      if (rm.Machine_Name && !machineSet.has(rm.Machine_Name.trim().toLowerCase())) {
        missingMachineRefs.push(rm.Machine_Name);
      }
    }

    // 8. OEE Performance Metrics (MTTR, MTBF, Availability %) from FinalData
    // MTTR (Mean Time To Repair) = Total repair time / Breakdown count
    const finalBreakdowns = await prisma.finalData.findMany({
      where: { BD_Flag: 1 }
    });

    const bdCount = finalBreakdowns.length;
    let totalBdMinutes = 0;
    let totalAvailMinutes = 0;
    
    // Track unique machines represented
    const finalMachines = new Set<string>();

    for (const row of finalBreakdowns) {
      if (row.Minutes) totalBdMinutes += row.Minutes;
      if (row.Available_Time_Min) totalAvailMinutes += row.Available_Time_Min;
      if (row.Machine_Name) finalMachines.add(row.Machine_Name);
    }

    const mttr = bdCount > 0 ? (totalBdMinutes / bdCount) : 0;

    // MTBF = (Available Time - Breakdown Time) / Breakdown Count
    const uptime = totalAvailMinutes - totalBdMinutes;
    const mtbf = bdCount > 0 ? (uptime / bdCount) : 0;
    const availabilityPercent = totalAvailMinutes > 0 ? ((uptime / totalAvailMinutes) * 100) : 0;

    // 9. Top breakdown machines (RawData)
    const rawLogs = await prisma.rawData.findMany({
      select: { Machine_Name: true, Category: true }
    });

    const machineCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const log of rawLogs) {
      if (log.Machine_Name) {
        machineCounts[log.Machine_Name] = (machineCounts[log.Machine_Name] || 0) + 1;
      }
      if (log.Category) {
        categoryCounts[log.Category] = (categoryCounts[log.Category] || 0) + 1;
      }
    }

    const topMachines = Object.entries(machineCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const commonCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 10. Generate DATA_AUDIT_REPORT.md
    const reportPath = path.resolve(__dirname, '../../../DATA_AUDIT_REPORT.md');
    let md = '';

    md += `# CMMS Data Integrity Audit Report\n\n`;
    md += `Generated on: ${new Date().toISOString()}\n\n`;

    md += `## 1. Database Record Counts\n\n`;
    md += `| Table / Entity | Record Count |\n`;
    md += `| :--- | :---: |\n`;
    md += `| **Raw Breakdown Logs (RawData)** | ${rawCount} |\n`;
    md += `| **Finalized OEE Logs (FinalData)** | ${finalCount} |\n`;
    md += `| **Machine Master (MachineData)** | ${machineCount} |\n`;
    md += `| **Admin Users (AdminUsers)** | ${userCount} |\n`;
    md += `| **Historical KPI (HistoricalKPI)** | ${kpiCount} |\n\n`;

    md += `## 2. Breakdown Status Distribution\n\n`;
    md += `| Status Flag | Counts |\n`;
    md += `| :--- | :---: |\n`;
    for (const [st, cnt] of Object.entries(statusCounts)) {
      md += `| ${st} | ${cnt} |\n`;
    }
    md += `\n`;

    md += `## 3. Month-wise Activity (FinalData)\n\n`;
    md += `| Month-Year | Count |\n`;
    md += `| :--- | :---: |\n`;
    for (const m of monthGroup) {
      md += `| ${m.Month_Year || 'Unknown'} | ${m._count.id} |\n`;
    }
    md += `\n`;

    md += `## 4. Validation & Sanitization Anomalies\n\n`;
    md += `- **Duplicate Ref_IDs in RawData**: ${rawDuplicates.length} ${rawDuplicates.length > 0 ? `(${rawDuplicates.join(', ')})` : ''}\n`;
    md += `- **Duplicate Ref_IDs in FinalData**: ${finalDuplicates.length} ${finalDuplicates.length > 0 ? `(${finalDuplicates.join(', ')})` : ''}\n`;
    md += `- **Logs with Empty Description**: ${emptyDesc}\n`;
    md += `- **Logs with Empty Machine Name**: ${emptyMachine}\n`;
    md += `- **Logs with Empty Date string**: ${emptyDate}\n`;
    md += `- **Logs with Invalid Slashed Dates (Null Timestamp)**: ${invalidTimestamps}\n`;
    md += `- **Breakdown Entries referencing missing Machine Master**: ${missingMachineRefs.length}\n`;
    if (missingMachineRefs.length > 0) {
      md += `  - Missing Machines: ${missingMachineRefs.slice(0, 10).join(', ')}${missingMachineRefs.length > 10 ? '...' : ''}\n`;
    }
    md += `\n`;

    md += `## 5. Computed KPI OEE Metrics (FinalData)\n\n`;
    md += `| Metric Metric | Value |\n`;
    md += `| :--- | :---: |\n`;
    md += `| **Mean Time to Repair (MTTR)** | ${mttr.toFixed(2)} mins |\n`;
    md += `| **Mean Time Between Failures (MTBF)** | ${mtbf.toFixed(2)} mins |\n`;
    md += `| **Availability Percentage** | ${availabilityPercent.toFixed(2)}% |\n`;
    md += `| **Total Breakdown Time** | ${totalBdMinutes.toFixed(2)} mins |\n`;
    md += `| **Total Available Time** | ${totalAvailMinutes.toFixed(2)} mins |\n`;
    md += `| **Unique Machines Audited** | ${finalMachines.size} |\n\n`;

    md += `## 6. Failure Frequency Summary\n\n`;
    md += `### Top 5 Breakdown-Prone Machinery:\n`;
    for (const [m, count] of topMachines) {
      md += `- **${m}**: ${count} breakdown events\n`;
    }
    md += `\n### Most Common Breakdown Categories:\n`;
    for (const [c, count] of commonCategories) {
      md += `- **${c}**: ${count} occurrences\n`;
    }
    md += `\n`;

    md += `## 7. Recommendations\n\n`;
    if (missingMachineRefs.length > 0) {
      md += `> [!WARNING]\n`;
      md += `> **Missing Machine Master Entries**: There are breakdown logs referencing machinery not registered in the \`MachineData\` master table. Ensure machine configuration spreadsheets are updated to prevent data foreign key mismatch.\n\n`;
    }
    if (invalidTimestamps > 0) {
      md += `> [!CAUTION]\n`;
      md += `> **Unparsable Date Fields**: There are \`RawData\` records with unparsable timestamps. Clean up date representations in the Google Sheet columns prior to imports.\n\n`;
    }
    if (rawDuplicates.length > 0 || finalDuplicates.length > 0) {
      md += `> [!WARNING]\n`;
      md += `> **Duplicate Ref_IDs Found**: Duplicate Ref_IDs indicate split entry submits or duplicate GAS rows. Verify duplicate entries manually in database.\n\n`;
    }
    md += `> [!NOTE]\n`;
    md += `> **Availability and MTTR Targets**: Ensure Availability stays above OEE baseline target (e.g. 95%) and that MTTR tracks downward with proper preventative PM schedules.\n`;

    fs.writeFileSync(reportPath, md, 'utf8');
    console.log(`Successfully generated integrity audit report at: ${reportPath}`);
  } catch (err: any) {
    console.error(`Audit Execution failed: ${err.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function findDuplicates(arr: string[]): string[] {
  const uniq = new Set<string>();
  const dupes = new Set<string>();
  for (const item of arr) {
    if (!item) continue;
    const clean = item.trim().toLowerCase();
    if (uniq.has(clean)) {
      dupes.add(item);
    } else {
      uniq.add(clean);
    }
  }
  return Array.from(dupes);
}

main();
