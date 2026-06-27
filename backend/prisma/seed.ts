/**
 * seed.ts — Parksons CMMS Master Data Seed
 * 
 * Populates all master tables from Form.html / Code.gs reference data.
 * Safe to run multiple times — uses upsert throughout.
 * 
 * Run: npm run seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── MACHINE HIERARCHY (mirrors Form.html MACHINES object exactly) ──────────
const MACHINES_DATA: Record<string, Record<string, string[]>> = {
  PRINTING: {
    PrintKBA1:     ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    PrintKBA2:     ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    PrintKBA3:     ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    HeidelbergCX1: ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    HeidelbergCX2: ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    Roland:        ["Feeder","PU1","PU2","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    GRAVIER:       ["Feeder","PU1","Coating","Uvlights / IR light","Delivery","Compressor"],
    Albo:          ["Comapctor","Turner","Blower"],
    UVcoater:      ["Feeder","Infeedunit","Conveyor","Uvlights","Delivery","Coating unit"],
    Sheeter:       ["Reelstand","Helicalcutter","Conveyor","Delivery","Suctionblower","Ductcollector"],
    CTP:           ["Plateexposer","Plateprocessor"],
    Printingplant: ["Electricity Down","Compressor","Chiller water supply","Technotrans water","DG set"],
    Samplemaking:  ["cuuting head","Travel motor","Bed","Compressor"],
  },
  CORRUGATION: {
    Champion:    ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter","Stacker"],
    BHSCORRU:    ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter","Stacker"],
    Lamify1Old:  ["Sheetfeeder","Flutefeeder","Laminationunit","Belttransfer","Stacker"],
    Lamify2New:  ["Sheetfeeder","Flutefeeder","Laminationunit","Belttransfer","Stacker"],
    Gluekitchen: ["Mixing tank","Cuastic tank","supply pump"],
    Nflute:      ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter"],
  },
  NFDIECUTTING: {
    Blanker1:    ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    Blanker2:    ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    BMFOIL:      ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
    BMAFOIL:     ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
    YOKO:        ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
    DIECUTTING8: ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    NOVA1:       ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    NOVA2:       ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    NOVA5:       ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    NOVA6:       ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    Spanthera1:  ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    Spanthera2:  ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
  },
  NFPASTING: {
    Alpina:     ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    Expertfold: ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    Media68:    ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    VisionFold: ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    Fuego:      ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    Mistral:    ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    Blankwiser: ["Feeder","Alingmentunit","Glueunit","Folder","Delivery"],
    Other:      ["Airalunit"],
  },
  LAMINATION: {
    YILI:     ["Feeder","Heating roller","Pressing","Knifecutter","Delivery"],
    SLITTER:  ["Unwinder","Rewinder","Cutter","Crane motor"],
    PERFECTA: ["Feedingtable","CuttingKnife","Pressing","BackGauge","HydrualicPump","MainDriveClutch"],
    FAIDA:    ["Feedingtable","CuttingKnife","Pressing","BackGauge","HydrualicPump","MainDriveClutch"],
  },
  FLDIECUTTING: {
    NOVACUT3:    ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
    NOVACUT4:    ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
    SP102Diecut: ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
    SP102:       ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
  },
  FLPASTING: {
    LILA1:          ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    LILA2:          ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    PAKTEK1:        ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    PAKTEK2:        ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    LaminaGlueline: ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
  },
  HANDPUNCING: {
    ACME:          ["Maindriveclutch","DiePlatten"],
    BHARAT:        ["Maindriveclutch","DiePlatten"],
    HEIDO:         ["Maindriveclutch","DiePlatten"],
    Robus:         ["Sensor"],
    Autostrapping: ["Strapping head","Heater"],
  },
  LIQUIDLINE: {
    Fortuna:  ["Feeder","Blower","Scaving","Chiller","Burner","Folder","Transfer","Metaldetector","Tapping","Register unit"],
    Sheeter:  ["Reelstand","Helicalcutter","Conveyor","Delivery","Suctionblower","Ductcollector"],
    Slitter:  ["Unwinder","Rewinder","Cutter"],
    Blanker1: ["Feeder","Die platten","Delivery","Gripperbar","Stripping"],
  },
  OTHERS: {
    WindowPatching1:   ["Machine"],
    WindowPatching2:   ["Machine"],
    OfflineBlanker:    ["Machine"],
    BatchCounter:      ["Machine"],
    AutoPrintSorting1: ["Machine"],
    AutoPrintSorting2: ["Machine"],
    PokerCard:         ["Machine"],
    LablePasting1:     ["Machine"],
    LablePasting2:     ["Machine"],
    Boilers:           ["Machine"],
    CompressorUtil:    ["Machine"],
    WaterChiller:      ["Machine"],
  },
};

// ── TECHNICIANS (from Form.html) ──────────────────────────────────────────
const TECHNICIANS_DATA = [
  "Ashish","Shivaji","Sandip","Sharad","Vikas","Ravi",
  "Sachine","Krishna","Dattaram","Akshay","PM team",
  "Baba","Sangram","Ramdas","Chandan","YogeshK",
  "GaneshS","KedarP","YogeshP","Supervisor",
];

// ── CATEGORIES (from Form.html) ───────────────────────────────────────────
const CATEGORIES_DATA = [
  "Breakdown","Predictive","Planning","Preventive",
  "Corrective","Operational","Shift Start up",
];

// ── PROBLEM TYPES (from Form.html) ────────────────────────────────────────
const PROBLEM_TYPES_DATA = [
  "Electrical","Mechanical","Mech/Elect","Pneumatic air","Utility",
];

// ── ROOT CAUSES ───────────────────────────────────────────────────────────
const ROOT_CAUSES_DATA = [
  "Wear and Tear","Lack of Lubrication","Operator Error",
  "Material Defect","Design Issue","Electrical Fault",
  "Mechanical Failure","Pneumatic Failure","Utility Failure","Unknown",
];

// ── ACTION TAKEN ──────────────────────────────────────────────────────────
const ACTION_TAKEN_DATA = [
  "Replaced","Repaired","Adjusted","Cleaned","Lubricated",
  "Reset","Tightened","Calibrated","Overhauled","Monitoring",
];

async function main() {
  console.log('🌱 Starting Parksons CMMS master data seed...\n');

  // ── 1. PLANT ────────────────────────────────────────────────────────────
  console.log('📍 Seeding Plants...');
  const plants = [
    { name: 'Daman Plant',  code: 'DAMAN',  address: 'Daman, India' },
    { name: 'Pune Plant',   code: 'PUNE',   address: 'Pune, India' },
    { name: 'Chakan Plant', code: 'CHAKAN', address: 'Chakan, Pune, India' },
  ];
  const plantMap: Record<string, string> = {};
  for (const p of plants) {
    const plant = await prisma.plant.upsert({
      where: { code: p.code },
      update: { name: p.name, address: p.address },
      create: p,
    });
    plantMap[p.code] = plant.id;
    console.log(`  ✓ Plant: ${p.name}`);
  }
  const damanPlantId = plantMap['DAMAN'];

  // ── 2. ROLES ─────────────────────────────────────────────────────────────
  console.log('\n👤 Seeding Roles...');
  const roles = [
    { name: 'Super Admin', code: 'superadmin', description: 'Full system access' },
    { name: 'Admin',       code: 'admin',       description: 'Administrative access' },
    { name: 'Manager',     code: 'manager',     description: 'Management access' },
    { name: 'Supervisor',  code: 'supervisor',  description: 'Supervisory access' },
    { name: 'Technician',  code: 'technician',  description: 'Field technician access' },
    { name: 'Viewer',      code: 'viewer',      description: 'Read-only access' },
  ];
  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r,
    });
    roleMap[r.code] = role.id;
    console.log(`  ✓ Role: ${r.name}`);
  }

  // ── 3. DEFAULT SUPERADMIN USER ───────────────────────────────────────────
  console.log('\n🔐 Seeding default admin user...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@parksons.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@parksons.com',
      passwordHash,
      roleId: roleMap['superadmin'],
      plantId: damanPlantId,
      isActive: true,
    },
  });
  console.log('  ✓ admin@parksons.com / Admin@123');

  // ── 4. SHIFTS ────────────────────────────────────────────────────────────
  console.log('\n🕐 Seeding Shifts...');
  const shifts = [
    { name: 'First Shift',  code: 'S1', startTime: '07:00', endTime: '14:59' },
    { name: 'Second Shift', code: 'S2', startTime: '15:00', endTime: '22:59' },
    { name: 'Third Shift',  code: 'S3', startTime: '23:00', endTime: '06:59' },
  ];
  for (const s of shifts) {
    await prisma.shiftMaster.upsert({
      where: { code: s.code },
      update: { name: s.name, startTime: s.startTime, endTime: s.endTime },
      create: s,
    });
    console.log(`  ✓ ${s.name} (${s.startTime}–${s.endTime})`);
  }

  // ── 5. FINANCIAL YEARS ───────────────────────────────────────────────────
  console.log('\n📅 Seeding Financial Years...');
  const fyears = [
    { code: '2022-23', label: 'FY 2022-23', start: '2022-04-01', end: '2023-03-31', current: false, order: 1 },
    { code: '2023-24', label: 'FY 2023-24', start: '2023-04-01', end: '2024-03-31', current: false, order: 2 },
    { code: '2024-25', label: 'FY 2024-25', start: '2024-04-01', end: '2025-03-31', current: false, order: 3 },
    { code: '2025-26', label: 'FY 2025-26', start: '2025-04-01', end: '2026-03-31', current: true,  order: 4 },
    { code: '2026-27', label: 'FY 2026-27', start: '2026-04-01', end: '2027-03-31', current: false, order: 5 },
  ];
  for (const fy of fyears) {
    await (prisma as any).financialYear.upsert({
      where: { code: fy.code },
      update: { label: fy.label, isCurrent: fy.current, displayOrder: fy.order },
      create: {
        code: fy.code, label: fy.label,
        startDate: new Date(fy.start), endDate: new Date(fy.end),
        isCurrent: fy.current, displayOrder: fy.order,
      },
    });
    console.log(`  ✓ ${fy.label}${fy.current ? ' (current)' : ''}`);
  }

  // ── 6. BREAKDOWN CATEGORIES ──────────────────────────────────────────────
  console.log('\n🏷️  Seeding Breakdown Categories...');
  for (const name of CATEGORIES_DATA) {
    await prisma.breakdownCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ ${name}`);
  }

  // ── 7. PROBLEM CATEGORIES (TYPES) ────────────────────────────────────────
  console.log('\n⚡ Seeding Problem Types...');
  for (const name of PROBLEM_TYPES_DATA) {
    await prisma.problemCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ ${name}`);
  }

  // ── 8. ROOT CAUSE CATEGORIES ─────────────────────────────────────────────
  console.log('\n🔍 Seeding Root Cause Categories...');
  for (const name of ROOT_CAUSES_DATA) {
    await prisma.rootCauseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ ${name}`);
  }

  // ── 9. ACTION TAKEN CATEGORIES ───────────────────────────────────────────
  console.log('\n🔧 Seeding Action Taken Categories...');
  for (const name of ACTION_TAKEN_DATA) {
    await prisma.actionTakenCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ ${name}`);
  }

  // ── 10. TECHNICIANS ──────────────────────────────────────────────────────
  console.log('\n👷 Seeding Technicians...');
  for (let i = 0; i < TECHNICIANS_DATA.length; i++) {
    const name = TECHNICIANS_DATA[i];
    const code = `TECH-${String(i + 1).padStart(3, '0')}`;
    await (prisma as any).technician.upsert({
      where: { code },
      update: { name, displayOrder: i + 1 },
      create: { code, name, displayOrder: i + 1 },
    });
    console.log(`  ✓ ${code}: ${name}`);
  }

  // ── 11. PM FREQUENCIES ───────────────────────────────────────────────────
  console.log('\n🔄 Seeding PM Frequencies...');
  const pmFrequencies = [
    { code: 'DAILY',      name: 'Daily',        intervalDays: 1   },
    { code: 'WEEKLY',     name: 'Weekly',        intervalDays: 7   },
    { code: 'FORTNIGHTLY',name: 'Fortnightly',   intervalDays: 14  },
    { code: 'MONTHLY',    name: 'Monthly',       intervalDays: 30  },
    { code: 'QUARTERLY',  name: 'Quarterly',     intervalDays: 90  },
    { code: 'HALFYEARLY', name: 'Half Yearly',   intervalDays: 180 },
    { code: 'YEARLY',     name: 'Yearly',        intervalDays: 365 },
  ];
  for (const f of pmFrequencies) {
    await prisma.pmFrequencyMaster.upsert({
      where: { code: f.code },
      update: { name: f.name, intervalDays: f.intervalDays },
      create: f,
    });
    console.log(`  ✓ ${f.name} (every ${f.intervalDays} days)`);
  }

  // ── 12. MACHINE HIERARCHY ────────────────────────────────────────────────
  console.log('\n🏭 Seeding Machine Hierarchy (Dept → Machine → Units)...');
  let deptOrder = 0;
  for (const [deptName, machines] of Object.entries(MACHINES_DATA)) {
    deptOrder++;

    // Department
    const dept = await prisma.department.upsert({
      where: { plantId_code: { plantId: damanPlantId, code: deptName } },
      update: { name: deptName },
      create: { name: deptName, code: deptName, plantId: damanPlantId },
    });

    // Section (1 section per department matching GAS structure)
    const section = await prisma.section.upsert({
      where: { departmentId_code: { departmentId: dept.id, code: `${deptName}-SEC` } },
      update: { name: `${deptName} Section` },
      create: { name: `${deptName} Section`, code: `${deptName}-SEC`, departmentId: dept.id },
    });

    // Machine Category (maps to MachineCategory in schema)
    const category = await prisma.machineCategory.upsert({
      where: { code: deptName },
      update: { name: deptName },
      create: { name: deptName, code: deptName },
    });

    let machineOrder = 0;
    for (const [machineName, units] of Object.entries(machines)) {
      machineOrder++;
      const machineCode = `${deptName.substring(0, 4)}-${machineName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`;

      // Machine
      const machine = await prisma.machine.upsert({
        where: { machineId: machineCode },
        update: { name: machineName },
        create: {
          machineId: machineCode,
          name: machineName,
          machineCategoryId: category.id,
          sectionId: section.id,
          status: 'ACTIVE',
          criticality: 'MEDIUM',
          isSubAssembly: false,
        },
      });

      // Sub-assemblies (units)
      for (const unitName of units) {
        const existingUnit = await prisma.subAssembly.findFirst({
          where: { machineId: machine.id, name: unitName },
        });
        if (!existingUnit) {
          await prisma.subAssembly.create({
            data: { machineId: machine.id, name: unitName },
          });
        }
      }
    }
    console.log(`  ✓ ${deptName}: ${Object.keys(machines).length} machines`);
  }

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log(`  Plants:              ${plants.length}`);
  console.log(`  Roles:               ${roles.length}`);
  console.log(`  Shifts:              ${shifts.length}`);
  console.log(`  Financial Years:     ${fyears.length}`);
  console.log(`  Categories:          ${CATEGORIES_DATA.length}`);
  console.log(`  Problem Types:       ${PROBLEM_TYPES_DATA.length}`);
  console.log(`  Root Causes:         ${ROOT_CAUSES_DATA.length}`);
  console.log(`  Action Taken:        ${ACTION_TAKEN_DATA.length}`);
  console.log(`  Technicians:         ${TECHNICIANS_DATA.length}`);
  console.log(`  PM Frequencies:      ${pmFrequencies.length}`);
  console.log(`  Departments:         ${Object.keys(MACHINES_DATA).length}`);
  const totalMachines = Object.values(MACHINES_DATA).reduce((s, m) => s + Object.keys(m).length, 0);
  console.log(`  Machines:            ${totalMachines}`);
  const totalUnits = Object.values(MACHINES_DATA).reduce((s, m) => s + Object.values(m).reduce((ss, u) => ss + u.length, 0), 0);
  console.log(`  Machine Units:       ${totalUnits}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
