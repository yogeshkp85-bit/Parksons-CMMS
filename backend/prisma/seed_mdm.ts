import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { code: 'PRINTING', name: 'Printing Department' },
  { code: 'CORRUGATION', name: 'Corrugation Department' },
  { code: 'NFDIECUTTING', name: 'NF Die Cutting Department' },
  { code: 'NFPASTING', name: 'NF Pasting Department' },
  { code: 'LAMINATION', name: 'Lamination Department' },
  { code: 'HANDPUNCHING', name: 'Hand Punching Department' },
  { code: 'LIQUIDLINE', name: 'Liquid Line Department' },
  { code: 'OTHERS', name: 'Others Department' },
  { code: 'CONVERTING', name: 'Converting Plant' },
  { code: 'PRINTING_UTIL', name: 'Printing Plant Utilities' },
  { code: 'SCRAP', name: 'Scrap Department' },
];

const MACHINE_TYPES = [
  { code: 'PRESS', name: 'Printing Press', deptCode: 'PRINTING' },
  { code: 'CORR', name: 'Corrugation Machine', deptCode: 'CORRUGATION' },
  { code: 'DIECUT', name: 'Die Cutting Machine', deptCode: 'NFDIECUTTING' },
  { code: 'PASTE', name: 'Folder Gluer', deptCode: 'NFPASTING' },
  { code: 'LAM', name: 'Lamination Machine', deptCode: 'LAMINATION' },
  { code: 'PUNCH', name: 'Punching Machine', deptCode: 'HANDPUNCHING' },
  { code: 'LIQ', name: 'Liquid Line Machine', deptCode: 'LIQUIDLINE' },
  { code: 'OTHER_MAC', name: 'Other Machine', deptCode: 'OTHERS' },
  { code: 'CONV_UTIL', name: 'Converting Utility', deptCode: 'CONVERTING' },
  { code: 'PRNT_UTIL', name: 'Printing Utility', deptCode: 'PRINTING_UTIL' },
  { code: 'SCRAP_MAC', name: 'Scrap Machine', deptCode: 'SCRAP' },
];

const PRINTING_MACHINES = [
  { code: 'PRINTKBA1', name: 'PrintKBA1', typeCode: 'PRESS', criticality: 'A-Critical', units: ['FEEDER', 'PU1', 'PU2', 'PU3', 'PU4', 'PU5', 'PU6', 'COATING', 'UV_IR', 'DELIVERY', 'TECHNOTRANS', 'COMPRESSOR'] },
  { code: 'PRINTKBA2', name: 'PrintKBA2', typeCode: 'PRESS', criticality: 'A-Critical', units: ['FEEDER', 'PU1', 'PU2', 'PU3', 'PU4', 'PU5', 'PU6', 'COATING', 'UV_IR', 'DELIVERY', 'TECHNOTRANS', 'COMPRESSOR'] },
  { code: 'PRINTKBA3', name: 'PrintKBA3', typeCode: 'PRESS', criticality: 'A-Critical', units: ['FEEDER', 'PU1', 'PU2', 'PU3', 'PU4', 'PU5', 'PU6', 'PU7', 'COATING', 'UV_IR', 'DELIVERY', 'TECHNOTRANS', 'COMPRESSOR'] },
  { code: 'HEIDELBERGCX1', name: 'Heidelberg CX1', typeCode: 'PRESS', criticality: 'A-Critical', units: ['FEEDER', 'PU1', 'PU2', 'PU3', 'PU4', 'PU5', 'PU6', 'PU7', 'COATING', 'UV_IR', 'DELIVERY', 'TECHNOTRANS', 'COMPRESSOR'] },
  { code: 'HEIDELBERGCX2', name: 'Heidelberg CX2', typeCode: 'PRESS', criticality: 'A-Critical', units: ['FEEDER', 'PU1', 'PU2', 'PU3', 'PU4', 'PU5', 'PU6', 'PU7', 'COATING', 'UV_IR', 'DELIVERY', 'TECHNOTRANS', 'COMPRESSOR'] },
  { code: 'ROLAND', name: 'Roland', typeCode: 'PRESS', criticality: 'B-Important', units: ['FEEDER', 'PU1', 'PU2', 'COATING', 'UV_IR', 'DELIVERY', 'TECHNOTRANS', 'COMPRESSOR'] },
  { code: 'GRAVIER', name: 'Gravier', typeCode: 'PRESS', criticality: 'B-Important', units: ['FEEDER', 'PU1', 'COATING', 'UV_IR', 'DELIVERY', 'COMPRESSOR'] },
  { code: 'ALBO', name: 'Albo', typeCode: 'PRESS', criticality: 'C-General', units: ['COMPACTOR', 'TURNER', 'BLOWER'] },
  { code: 'UVCOATER', name: 'UV Coater', typeCode: 'PRESS', criticality: 'B-Important', units: ['FEEDER', 'INFEED', 'CONVEYOR', 'UV_LIGHTS', 'DELIVERY', 'COATING_UNIT'] },
  { code: 'SHEETER', name: 'Sheeter', typeCode: 'PRESS', criticality: 'B-Important', units: ['REELSTAND', 'HELICAL_CUT', 'CONVEYOR', 'DELIVERY', 'SUCTION', 'DUCT_COLLECT'] },
  { code: 'CTP', name: 'CTP', typeCode: 'PRESS', criticality: 'A-Critical', units: ['PLATE_EXPOSER', 'PLATE_PROC'] },
  { code: 'PRINTINGPLANT', name: 'Printing Plant', typeCode: 'PRESS', criticality: 'B-Important', units: ['ELEC_DOWN', 'COMPRESSOR', 'CHILLER', 'TECHNOTRANS_W', 'DG_SET'] },
  { code: 'SAMPLEMAKING', name: 'Sample Making', typeCode: 'PRESS', criticality: 'C-General', units: ['CUT_HEAD', 'TRAVEL_MOTOR', 'BED', 'COMPRESSOR'] },
];

const CORRUGATION_MACHINES = [
  { code: 'CHAMPION', name: 'Champion Corrugator', typeCode: 'CORR', criticality: 'A-Critical', units: ['MILL_ROLL', 'SPLICER', 'SINGLE_FACER', 'STEAM', 'FEEDER', 'HELICAL_CUT', 'STACKER'] },
  { code: 'BHSCORRUGATOR', name: 'BHS Corrugator', typeCode: 'CORR', criticality: 'A-Critical', units: ['MILL_ROLL', 'SPLICER', 'SINGLE_FACER', 'STEAM', 'FEEDER', 'HELICAL_CUT', 'STACKER'] },
  { code: 'LAMIFY1', name: 'Lamify1 Old', typeCode: 'CORR', criticality: 'B-Important', units: ['SHEET_FEED', 'FLUTE_FEED', 'LAM_UNIT', 'BELT_TRANS', 'STACKER'] },
  { code: 'LAMIFY2', name: 'Lamify2 New', typeCode: 'CORR', criticality: 'B-Important', units: ['SHEET_FEED', 'FLUTE_FEED', 'LAM_UNIT', 'BELT_TRANS', 'STACKER'] },
  { code: 'GLUEKITCHEN', name: 'Glue Kitchen', typeCode: 'CORR', criticality: 'B-Important', units: ['MIX_TANK', 'CAUSTIC_TANK', 'SUPPLY_PUMP'] },
  { code: 'NFLUTE', name: 'NFlute', typeCode: 'CORR', criticality: 'B-Important', units: ['MILL_ROLL', 'SPLICER', 'SINGLE_FACER', 'STEAM', 'FEEDER', 'HELICAL_CUT'] },
];

const NFDIECUTTING_MACHINES = [
  { code: 'BLANKER1', name: 'Blanker 1', typeCode: 'DIECUT', criticality: 'A-Critical', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'BLANKER2', name: 'Blanker 2', typeCode: 'DIECUT', criticality: 'A-Critical', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'BMFOIL', name: 'BMFoil', typeCode: 'DIECUT', criticality: 'A-Critical', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'FOIL_STAMP', 'BLANKING'] },
  { code: 'BMAFOIL', name: 'BMAFoil', typeCode: 'DIECUT', criticality: 'A-Critical', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'FOIL_STAMP', 'BLANKING'] },
  { code: 'YOKO', name: 'Yoko', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'FOIL_STAMP', 'BLANKING'] },
  { code: 'DIECUTTING8', name: 'Die Cutting 8', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'NOVA1', name: 'Nova 1', typeCode: 'DIECUT', criticality: 'A-Critical', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'NOVA2', name: 'Nova 2', typeCode: 'DIECUT', criticality: 'A-Critical', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'NOVA5', name: 'Nova 5', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'NOVA6', name: 'Nova 6', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'SPANTHERA1', name: 'Spanthera 1', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
  { code: 'SPANTHERA2', name: 'Spanthera 2', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER', 'DIE_PLATTEN', 'DELIVERY', 'GRIPPER_BAR', 'STRIPPING', 'BLANKING'] },
];

const NFPASTING_MACHINES = [
  { code: 'ALPINA', name: 'Alpina Gluer', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER', 'ALIGNMENT', 'PREBREAKER', 'GLUE', 'HSS', 'FOLDER', 'TRANSFER', 'DELIVERY'] },
  { code: 'EXPERT', name: 'Expert Gluer', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER', 'ALIGNMENT', 'PREBREAKER', 'GLUE', 'HSS', 'FOLDER', 'TRANSFER', 'DELIVERY'] },
  { code: 'MEDIA', name: 'Media Gluer', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER', 'ALIGNMENT', 'PREBREAKER', 'GLUE', 'HSS', 'FOLDER', 'TRANSFER', 'DELIVERY'] },
  { code: 'VISION', name: 'Vision Gluer', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER', 'ALIGNMENT', 'PREBREAKER', 'GLUE', 'HSS', 'FOLDER', 'TRANSFER', 'DELIVERY'] },
  { code: 'FUEGO', name: 'Fuego Gluer', typeCode: 'PASTE', criticality: 'C-General', units: ['FEEDER', 'ALIGNMENT', 'PREBREAKER', 'GLUE', 'HSS', 'FOLDER', 'TRANSFER', 'DELIVERY'] },
  { code: 'MISTRAL', name: 'Mistral Gluer', typeCode: 'PASTE', criticality: 'C-General', units: ['FEEDER', 'ALIGNMENT', 'PREBREAKER', 'GLUE', 'HSS', 'FOLDER', 'TRANSFER', 'DELIVERY'] },
  { code: 'BLANKWISER', name: 'Blankwiser', typeCode: 'PASTE', criticality: 'C-General', units: ['FEEDER', 'ALIGNMENT', 'GLUE', 'FOLDER', 'DELIVERY'] },
  { code: 'OTHER_PASTE', name: 'Other', typeCode: 'PASTE', criticality: 'C-General', units: ['AIRAL'] },
];

const LAMINATION_MACHINES = [
  { code: 'YILI', name: 'Yili', typeCode: 'LAM', criticality: 'B-Important', units: ['FEEDER','HEAT_ROLLER','PRESSING','KNIFE_CUT','DELIVERY'] },
  { code: 'SLITTER', name: 'Slitter', typeCode: 'LAM', criticality: 'B-Important', units: ['UNWINDER','REWINDER','CUTTER','CRANE_MOTOR'] },
  { code: 'PERFECTA', name: 'Perfecta', typeCode: 'LAM', criticality: 'B-Important', units: ['FEED_TABLE','CUT_KNIFE','PRESSING','BACK_GAUGE','HYDRAULIC','MAIN_CLUTCH'] },
  { code: 'FAIDA', name: 'Faida', typeCode: 'LAM', criticality: 'B-Important', units: ['FEED_TABLE','CUT_KNIFE','PRESSING','BACK_GAUGE','HYDRAULIC','MAIN_CLUTCH'] }
];

const FLDIECUTTING_MACHINES = [
  { code: 'NOVACUT3', name: 'Novacut 3', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER','DIE_PLATTEN','DELIVERY','GRIPPER_BAR','STRIPPING'] },
  { code: 'NOVACUT4', name: 'Novacut 4', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER','DIE_PLATTEN','DELIVERY','GRIPPER_BAR','STRIPPING'] },
  { code: 'SP102DIECUT', name: 'SP102 Diecut', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER','DIE_PLATTEN','DELIVERY','GRIPPER_BAR','STRIPPING'] },
  { code: 'SP102', name: 'SP102', typeCode: 'DIECUT', criticality: 'B-Important', units: ['FEEDER','DIE_PLATTEN','DELIVERY','GRIPPER_BAR','STRIPPING'] }
];

const FLPASTING_MACHINES = [
  { code: 'LILA1', name: 'Lila 1', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER','ALIGNMENT','PREBREAKER','GLUE','HSS','FOLDER','TRANSFER'] },
  { code: 'LILA2', name: 'Lila 2', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER','ALIGNMENT','PREBREAKER','GLUE','HSS','FOLDER','TRANSFER'] },
  { code: 'PAKTEK1', name: 'Paktek 1', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER','ALIGNMENT','PREBREAKER','GLUE','HSS','FOLDER','TRANSFER'] },
  { code: 'PAKTEK2', name: 'Paktek 2', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER','ALIGNMENT','PREBREAKER','GLUE','HSS','FOLDER','TRANSFER'] },
  { code: 'LAMINAGLUELINE', name: 'Lamina Glueline', typeCode: 'PASTE', criticality: 'B-Important', units: ['FEEDER','ALIGNMENT','PREBREAKER','GLUE','HSS','FOLDER','TRANSFER'] }
];

const HANDPUNCHING_MACHINES = [
  { code: 'ACME', name: 'Acme', typeCode: 'PUNCH', criticality: 'C-General', units: ['MAIN_CLUTCH','DIE_PLATTEN'] },
  { code: 'BHARAT', name: 'Bharat', typeCode: 'PUNCH', criticality: 'C-General', units: ['MAIN_CLUTCH','DIE_PLATTEN'] },
  { code: 'HEIDO', name: 'Heido', typeCode: 'PUNCH', criticality: 'C-General', units: ['MAIN_CLUTCH','DIE_PLATTEN'] },
  { code: 'ROBUS', name: 'Robus', typeCode: 'PUNCH', criticality: 'C-General', units: ['SENSOR'] },
  { code: 'AUTOSTRAPPING', name: 'Auto Strapping', typeCode: 'PUNCH', criticality: 'C-General', units: ['STRAP_HEAD','HEATER'] }
];

const LIQUIDLINE_MACHINES = [
  { code: 'FORTUNA', name: 'Fortuna', typeCode: 'LIQ', criticality: 'B-Important', units: ['FEEDER','BLOWER','SCAVENGING','CHILLER','BURNER','FOLDER','TRANSFER','METAL_DET','TAPPING','REGISTER'] },
  { code: 'LIQUIDSHEETER', name: 'Liquid Sheeter', typeCode: 'LIQ', criticality: 'B-Important', units: ['REELSTAND','HELICAL_CUT','CONVEYOR','DELIVERY','SUCTION','DUCT_COLLECT'] },
  { code: 'LIQUIDSLITTER', name: 'Liquid Slitter', typeCode: 'LIQ', criticality: 'B-Important', units: ['UNWINDER','REWINDER','CUTTER'] },
  { code: 'LIQUIDBLANKER1', name: 'Liquid Blanker 1', typeCode: 'LIQ', criticality: 'B-Important', units: ['FEEDER','DIE_PLATTEN','DELIVERY','GRIPPERBAR','STRIPPING'] }
];

const OTHERS_MACHINES = [
  { code: 'WINDOWPATCHING1', name: 'Window Patching 1', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'WINDOWPATCHING2', name: 'Window Patching 2', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'OFFLINEBLANKER', name: 'Offline Blanker', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'BATCHCOUNTER', name: 'Batch Counter', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'AUTOPRINTSORTING1', name: 'Auto Print Sorting 1', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'AUTOPRINTSORTING2', name: 'Auto Print Sorting 2', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'POKERCARD', name: 'Poker Card', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'LABLEPASTING1', name: 'Label Pasting 1', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'LABLEPASTING2', name: 'Label Pasting 2', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'LABLEPASTING3', name: 'Label Pasting 3', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'INKMATCHINGMIXT1', name: 'Ink Matching Mixer 1', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'INKMATCHINGMIXT2', name: 'Ink Matching Mixer 2', typeCode: 'OTHER_MAC', criticality: 'C-General', units: ['MACHINE'] }
];

const CONVERTING_MACHINES = [
  { code: 'CONV_COMPRESSOR', name: 'Converting Compressor', typeCode: 'CONV_UTIL', criticality: 'C-General', units: ['MAIN_COMP','BACKUP_COMP'] },
  { code: 'CONV_ELECTRICITY', name: 'Converting Electricity', typeCode: 'CONV_UTIL', criticality: 'C-General', units: ['MAIN_SUPPLY','DG_SET','TRANSFORMER'] }
];

const PRINTING_UTIL_MACHINES = [
  { code: 'PRINT_UTILITY', name: 'Printing Utility', typeCode: 'PRNT_UTIL', criticality: 'C-General', units: ['ELEC_DOWN','COMPRESSOR','CHILLER','TECHNOTRANS_W','DG_SET'] },
  { code: 'PRINT_ELECTRICITY', name: 'Printing Electricity', typeCode: 'PRNT_UTIL', criticality: 'C-General', units: ['MAIN_SUPPLY','DG_SET'] },
  { code: 'PRINT_COMPRESSOR', name: 'Printing Compressor', typeCode: 'PRNT_UTIL', criticality: 'C-General', units: ['MAIN_COMP','BACKUP_COMP'] }
];

const SCRAP_MACHINES = [
  { code: 'SCRAPCUTTING1', name: 'Scrap Cutting 1', typeCode: 'SCRAP_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'SCRAPCUTTING2', name: 'Scrap Cutting 2', typeCode: 'SCRAP_MAC', criticality: 'C-General', units: ['MACHINE'] },
  { code: 'SCRAPCUTTING3', name: 'Scrap Cutting 3', typeCode: 'SCRAP_MAC', criticality: 'C-General', units: ['MACHINE'] }
];

const EMPLOYEES = [
  { empCode: 'EMP001', empName: 'Yogesh KP', email: 'yogeshkp85@gmail.com', designation: 'Superadmin' },
  { empCode: 'EMP002', empName: 'Kedar Phatak', email: 'kedar.phatak@parksonspackaging.com', designation: 'Engineer' },
  { empCode: 'EMP003', empName: 'Vikas Patil', email: 'vikas.patil@parksonspackaging.com', designation: 'Technician' },
  { empCode: 'EMP004', empName: 'Sharad Dev', email: 'sharad.dev@parksonspackaging.com', designation: 'Supervisor' },
];

const SHIFTS = [
  { shiftCode: 'SHFT-A', shiftName: 'Shift A (Pune)', startTime: '07:00', endTime: '15:00' },
  { shiftCode: 'SHFT-B', shiftName: 'Shift B (Pune)', startTime: '15:00', endTime: '23:00' },
  { shiftCode: 'SHFT-C', shiftName: 'Shift C (Pune)', startTime: '23:00', endTime: '07:00' },
];

const PROBLEM_TYPES = [
  { typeCode: 'MECH', typeName: 'Mechanical', colorCode: '#e74c3c' },
  { typeCode: 'ELEC', typeName: 'Electrical', colorCode: '#3498db' },
  { typeCode: 'PNEU', typeName: 'Pneumatic Air', colorCode: '#2ecc71' },
  { typeCode: 'UTIL', typeName: 'Utility / Power', colorCode: '#f1c40f' },
];

const WO_CATEGORIES = [
  { categoryCode: 'BD', categoryName: 'Breakdown Maintenance' },
  { categoryCode: 'PM', categoryName: 'Preventive Maintenance' },
  { categoryCode: 'CM', categoryName: 'Corrective Maintenance' },
];

const STATUSES = [
  { statusCode: 'OPEN', statusName: 'Open' },
  { statusCode: 'WIP', statusName: 'In Progress' },
  { statusCode: 'REVIEW', statusName: 'Pending Review' },
  { statusCode: 'CLOSED', statusName: 'Closed' },
];

const PRIORITIES = [
  { priorityCode: 'CRIT', priorityName: 'Critical', level: 1 },
  { priorityCode: 'HIGH', priorityName: 'High', level: 2 },
  { priorityCode: 'MED', priorityName: 'Medium', level: 3 },
  { priorityCode: 'LOW', priorityName: 'Low', level: 4 },
];

async function main() {
  console.log('🌱 Starting Parksons CMMS MDM seed data deployment (Pune plant)...');

  // 1. Plant
  const plant = await prisma.mstPlant.upsert({
    where: { plantCode: 'PUNE' },
    update: { plantName: 'Pune Plant', city: 'Pune' },
    create: { plantCode: 'PUNE', plantName: 'Pune Plant', city: 'Pune' },
  });
  console.log(`✓ Seeded Plant: ${plant.plantName}`);

  // 2. Departments
  const deptMap: Record<string, string> = {};
  for (const d of DEPARTMENTS) {
    const record = await prisma.mstDepartment.upsert({
      where: { plantId_deptCode: { plantId: plant.plantId, deptCode: d.code } },
      update: { deptName: d.name },
      create: {
        deptCode: d.code,
        deptName: d.name,
        plantId: plant.plantId,
      },
    });
    deptMap[d.code] = record.deptId;
  }
  console.log(`✓ Seeded ${DEPARTMENTS.length} Departments`);

  // 3. Machine Types
  const typeMap: Record<string, string> = {};
  for (const t of MACHINE_TYPES) {
    const record = await prisma.mstMachineType.upsert({
      where: { deptId_typeCode: { deptId: deptMap[t.deptCode], typeCode: t.code } },
      update: { typeName: t.name },
      create: {
        typeCode: t.code,
        typeName: t.name,
        deptId: deptMap[t.deptCode],
      },
    });
    typeMap[t.code] = record.machineTypeId;
  }
  console.log(`✓ Seeded ${MACHINE_TYPES.length} Machine Types`);

  // 4. Seeding Machines & Machine Units helper function
  const seedMachines = async (machinesList: any[]) => {
    for (const m of machinesList) {
      // Create Machine
      const machine = await prisma.mstMachine.upsert({
        where: { plantId_machineCode: { plantId: plant.plantId, machineCode: m.code } },
        update: {
          machineName: m.name,
          machineTypeId: typeMap[m.typeCode],
          criticality: m.criticality,
        },
        create: {
          machineCode: m.code,
          machineName: m.name,
          machineTypeId: typeMap[m.typeCode],
          plantId: plant.plantId,
          criticality: m.criticality,
        },
      });

      // Create Units for this machine
      for (let i = 0; i < m.units.length; i++) {
        await prisma.mstMachineUnit.upsert({
          where: { machineId_unitCode: { machineId: machine.machineId, unitCode: m.units[i] } },
          update: {
            unitName: m.units[i].charAt(0) + m.units[i].slice(1).toLowerCase().replace('_', ' '),
            position: i + 1,
          },
          create: {
            unitCode: m.units[i],
            unitName: m.units[i].charAt(0) + m.units[i].slice(1).toLowerCase().replace('_', ' '),
            machineId: machine.machineId,
            position: i + 1,
          },
        });
      }
    }
  };

  await seedMachines(PRINTING_MACHINES);
  await seedMachines(CORRUGATION_MACHINES);
  await seedMachines(NFDIECUTTING_MACHINES);
  await seedMachines(NFPASTING_MACHINES);
  await seedMachines(LAMINATION_MACHINES);
  await seedMachines(FLDIECUTTING_MACHINES);
  await seedMachines(FLPASTING_MACHINES);
  await seedMachines(HANDPUNCHING_MACHINES);
  await seedMachines(LIQUIDLINE_MACHINES);
  await seedMachines(OTHERS_MACHINES);
  await seedMachines(CONVERTING_MACHINES);
  await seedMachines(PRINTING_UTIL_MACHINES);
  await seedMachines(SCRAP_MACHINES);
  console.log(`✓ Seeded 38 Machines and 200+ Machine Units`);

  // 5. Employees
  for (const emp of EMPLOYEES) {
    await prisma.mstEmployee.upsert({
      where: { empCode: emp.empCode },
      update: { empName: emp.empName, email: emp.email, designation: emp.designation },
      create: emp,
    });
  }
  console.log(`✓ Seeded ${EMPLOYEES.length} Employees`);

  // 6. Shifts
  for (const s of SHIFTS) {
    await prisma.mstShift.upsert({
      where: { shiftCode: s.shiftCode },
      update: { shiftName: s.shiftName, startTime: s.startTime, endTime: s.endTime },
      create: s,
    });
  }
  console.log(`✓ Seeded ${SHIFTS.length} Shifts`);

  // 7. Problem Types
  for (const pt of PROBLEM_TYPES) {
    await prisma.mstProblemType.upsert({
      where: { typeCode: pt.typeCode },
      update: { typeName: pt.typeName, colorCode: pt.colorCode },
      create: pt,
    });
  }
  console.log(`✓ Seeded ${PROBLEM_TYPES.length} Problem Types`);

  // 8. Work Order Categories
  for (const wc of WO_CATEGORIES) {
    await prisma.mstWoCategory.upsert({
      where: { categoryCode: wc.categoryCode },
      update: { categoryName: wc.categoryName },
      create: wc,
    });
  }
  console.log(`✓ Seeded ${WO_CATEGORIES.length} WO Categories`);

  // 9. Statuses
  for (const st of STATUSES) {
    await prisma.mstStatus.upsert({
      where: { statusCode: st.statusCode },
      update: { statusName: st.statusName },
      create: st,
    });
  }
  console.log(`✓ Seeded ${STATUSES.length} Statuses`);

  // 10. Priorities
  for (const pr of PRIORITIES) {
    await prisma.mstPriority.upsert({
      where: { priorityCode: pr.priorityCode },
      update: { priorityName: pr.priorityName, level: pr.level },
      create: pr,
    });
  }
  console.log(`✓ Seeded ${PRIORITIES.length} Priorities`);

  console.log('\n🎉 MDM seed data successfully deployed.');
}

main()
  .catch((e) => {
    console.error('Error during MDM seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
