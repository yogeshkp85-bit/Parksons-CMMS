import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default machine configurations from Code.gs
const MACHINES_DEFAULT: Record<string, Record<string, string[]>> = {
  "PRINTING": {
    "PrintKBA1": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    "PrintKBA2": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    "PrintKBA3": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    "HeidelbergCX1": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    "HeidelbergCX2": ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    "Roland": ["Feeder","PU1","PU2","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    "GRAVIER": ["Feeder","PU1","Coating","Uvlights / IR light","Delivery","Compressor"],
    "Albo": ["Comapctor","Turner","Blower"],
    "UVcoater": ["Feeder","Infeedunit","Conveyor","Uvlights","Delivery","Coating unit"],
    "Sheeter": ["Reelstand","Helicalcutter","Conveyor","Delivery","Suctionblower","Ductcollector"],
    "CTP": ["Plateexposer","Plateprocessor"],
    "Printingplant": ["Electricity Down","Compressor","Chiller water supply","Technotrans water","DG set"],
    "Samplemaking": ["cuuting head","Travel motor","Bed","Compressor"]
  },
  "CORRUGATION": {
    "Champion": ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter","Stacker"],
    "BHSCORRU": ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter","Stacker"],
    "Lamify1Old": ["Sheetfeeder","Flutefeeder","Laminationunit","Belttransfer","Stacker"],
    "Lamify2New": ["Sheetfeeder","Flutefeeder","Laminationunit","Belttransfer","Stacker"],
    "Gluekitchen": ["Mixing tank","Cuastic tank","supply pump"],
    "Nflute": ["MillRollstand","Splicer","Singlefacer","Steamsupply","Feeder","Helicalcutter"]
  },
  "NFDIECUTTING": {
    "Blanker1": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "Blanker2": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "BMFOIL": ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
    "BMAFOIL": ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
    "YOKO": ["Feeder","Die platten","Delivery","Gripperbar","Foilstamping","Blanking"],
    "DIECUTTING8": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "NOVA1": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "NOVA2": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "NOVA5": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "NOVA6": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "Spanthera1": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"],
    "Spanthera2": ["Feeder","Die platten","Delivery","Gripperbar","Stripping","Blanking"]
  },
  "NFPASTING": {
    "Alpina": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    "Expertfold": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    "Media68": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    "VisionFold": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    "Fuego": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    "Mistral": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer","Delivery"],
    "Blankwiser": ["Feeder","Alingmentunit","Glueunit","Folder","Delivery"],
    "Other": ["Airalunit"]
  },
  "LAMINATION": {
    "YILI": ["Feeder","Heating roller","Pressing","Knifecutter","Delivery"],
    "SLITTER": ["Unwinder","Rewinder","Cutter","Crane motor"],
    "PERFECTA": ["Feedingtable","CuttingKnife","Pressing","BackGauge","HydrualicPump","MainDriveClutch"],
    "FAIDA": ["Feedingtable","CuttingKnife","Pressing","BackGauge","HydrualicPump","MainDriveClutch"]
  },
  "FLDIECUTTING": {
    "NOVACUT3": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
    "NOVACUT4": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
    "SP102Diecut": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"],
    "SP102": ["Feeder","Dieplatten","Delivery","Gripperbar","Stripping"]
  },
  "FLPASTING": {
    "LILA1": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    "LILA2": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    "PAKTEK1": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    "PAKTEK2": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"],
    "LaminaGlueline": ["Feeder","Alingmentunit","Prebreaker","Glueunit","HSSsystem","Folder","Transfer"]
  },
  "HANDPUNCING": {
    "ACME": ["Maindriveclutch","DiePlatten"],
    "BHARAT": ["Maindriveclutch","DiePlatten"],
    "HEIDO": ["Maindriveclutch","DiePlatten"],
    "Robus": ["Sensor"],
    "Autostrapping": ["Strapping head","Heater"]
  },
  "LIQUIDLINE": {
    "Fortuna": ["Feeder","Blower","Scaving","Chiller","Burner","Folder","Transfer","Metaldetector","Tapping","Register unit"],
    "Sheeter": ["Reelstand","Helicalcutter","Conveyor","Delivery","Suctionblower","Ductcollector"],
    "Slitter": ["Unwinder","Rewinder","Cutter"],
    "Blanker1": ["Feeder","Die platten","Delivery","Gripperbar","Stripping"]
  },
  "OTHERS": {
    "WindowPatching1": ["Machine"],"WindowPatching2": ["Machine"],
    "OfflineBlanker": ["Machine"],"BatchCounter": ["Machine"],
    "AutoPrintSorting1": ["Machine"],"AutoPrintSorting2": ["Machine"],
    "PokerCard": ["Machine"],"LablePasting1": ["Machine"],
    "LablePasting2": ["Machine"],"LablePasting3": ["Machine"],
    "InkmatchingMixt1": ["Machine"],"InkmatchingMixt2": ["Machine"]
  },
  "Convertingplant": {
    "Compressor": ["Main compressor","Backup compressor"],
    "Electricitydown": ["Main supply","DG Set","Transformer"]
  },
  "Printingplant": {
    "Utility": ["Electricity Down","Compressor","Chiller water supply","Technotrans water","DG set"],
    "Electricitydown": ["Main supply","DG Set"],
    "Compressor": ["Main compressor","Backup compressor"]
  },
  "SCRAP": {
    "ScrapCutting1": ["Machine"],"ScrapCutting2": ["Machine"],"ScrapCutting3": ["Machine"]
  }
};

async function main() {
  console.log("Starting database seeding...");

  // 1. ROLES
  const roles = [
    { name: "Super Admin", code: "SUPER_ADMIN", description: "Full system control and administration" },
    { name: "Plant Admin", code: "PLANT_ADMIN", description: "Admin access localized to a single plant" },
    { name: "Manager", code: "MANAGER", description: "Workflow approval and analytics viewing" },
    { name: "Supervisor", code: "SUPERVISOR", description: "Log approvals, PM scheduling, and dashboard views" },
    { name: "Engineer", code: "ENGINEER", description: "Update breakdown logs, assign tasks, view status" },
    { name: "Technician", code: "TECHNICIAN", description: "Create breakdown entries, complete PM tasks" },
    { name: "Viewer", code: "VIEWER", description: "Read-only access to dashboards and KPIs" }
  ];

  const seededRoles: Record<string, any> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r
    });
    seededRoles[r.code] = role;
  }
  console.log("Seeded Roles.");

  // 2. PERMISSIONS
  const permissions = [
    // Users Module
    { name: "View Users", code: "USER_VIEW", module: "User Management", action: "READ" },
    { name: "Manage Users", code: "USER_MANAGE", module: "User Management", action: "CREATE" },
    // Masters Module
    { name: "View Masters", code: "MASTER_VIEW", module: "Master Tables", action: "READ" },
    { name: "Manage Masters", code: "MASTER_MANAGE", module: "Master Tables", action: "CREATE" },
    // Machine Master
    { name: "View Machines", code: "MACHINE_VIEW", module: "Machine Master", action: "READ" },
    { name: "Manage Machines", code: "MACHINE_MANAGE", module: "Machine Master", action: "CREATE" },
    // Breakdown Module
    { name: "View Breakdowns", code: "BREAKDOWN_VIEW", module: "Breakdown Management", action: "READ" },
    { name: "Create Breakdown", code: "BREAKDOWN_CREATE", module: "Breakdown Management", action: "CREATE" },
    { name: "Review Breakdown", code: "BREAKDOWN_REVIEW", module: "Breakdown Management", action: "UPDATE" },
    { name: "Approve Breakdown", code: "BREAKDOWN_APPROVE", module: "Breakdown Management", action: "UPDATE" },
    // PM Module
    { name: "View PM Schedule", code: "PM_VIEW", module: "PM Management", action: "READ" },
    { name: "Manage PM Tasks", code: "PM_MANAGE", module: "PM Management", action: "CREATE" },
    { name: "Execute PM Tasks", code: "PM_EXECUTE", module: "PM Management", action: "UPDATE" },
    // Dashboard & Reports
    { name: "View Dashboard", code: "DASHBOARD_VIEW", module: "Dashboard & KPI Engine", action: "READ" },
    { name: "Export Reports", code: "REPORTS_EXPORT", module: "Reports", action: "READ" },
    // Audit Logs
    { name: "View Audit Logs", code: "AUDIT_VIEW", module: "Audit Logs", action: "READ" }
  ];

  const seededPermissions: Record<string, any> = {};
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module, action: p.action },
      create: p
    });
    seededPermissions[p.code] = perm;
  }
  console.log("Seeded Permissions.");

  // Map permissions to SUPER_ADMIN & SUPERVISOR
  const superAdminRole = seededRoles["SUPER_ADMIN"];
  for (const perm of Object.values(seededPermissions)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id }
    });
  }

  const supervisorRole = seededRoles["SUPERVISOR"];
  const supervisorPerms = ["MACHINE_VIEW", "BREAKDOWN_VIEW", "BREAKDOWN_CREATE", "BREAKDOWN_REVIEW", "PM_VIEW", "PM_EXECUTE", "DASHBOARD_VIEW", "REPORTS_EXPORT"];
  for (const code of supervisorPerms) {
    const perm = seededPermissions[code];
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: supervisorRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: supervisorRole.id, permissionId: perm.id }
      });
    }
  }
  console.log("Mapped Role Permissions.");

  // 3. PLANT
  const plant = await prisma.plant.upsert({
    where: { code: "DAMAN" },
    update: { name: "Parksons Daman Plant", address: "Daman, India" },
    create: { name: "Parksons Daman Plant", code: "DAMAN", address: "Daman, India" }
  });
  console.log(`Seeded Plant: ${plant.name}`);

  // 4. USERS (Super Admin: YogeshK, Supervisor: default)
  const saltRounds = 10;
  const hashPassword = await bcrypt.hash("PKS@2026", saltRounds);

  const superUser = await prisma.user.upsert({
    where: { email: "yogeshkp85@gmail.com" },
    update: { passwordHash: hashPassword, name: "YogeshK", roleId: superAdminRole.id, plantId: plant.id },
    create: {
      name: "YogeshK",
      email: "yogeshkp85@gmail.com",
      passwordHash: hashPassword,
      roleId: superAdminRole.id,
      plantId: plant.id
    }
  });
  console.log(`Seeded User: ${superUser.name} (${superUser.email})`);

  // 5. SHIFT MASTER
  const shifts = [
    { name: "First Shift", code: "SHIFT_1", startTime: "07:00:00", endTime: "15:00:00" },
    { name: "Second Shift", code: "SHIFT_2", startTime: "15:00:00", endTime: "23:00:00" },
    { name: "Third Shift", code: "SHIFT_3", startTime: "23:00:00", endTime: "07:00:00" }
  ];
  for (const s of shifts) {
    await prisma.shiftMaster.upsert({
      where: { code: s.code },
      update: { name: s.name, startTime: s.startTime, endTime: s.endTime },
      create: s
    });
  }
  console.log("Seeded Shift Masters.");

  // 6. PM FREQUENCY MASTER
  const pmFreqs = [
    { name: "Daily", code: "DAILY", intervalDays: 1 },
    { name: "Weekly", code: "WEEKLY", intervalDays: 7 },
    { name: "Monthly", code: "MONTHLY", intervalDays: 30 },
    { name: "Quarterly", code: "QUARTERLY", intervalDays: 91 },
    { name: "Half Yearly", code: "HALF_YEARLY", intervalDays: 182 },
    { name: "Yearly", code: "YEARLY", intervalDays: 365 }
  ];
  for (const pf of pmFreqs) {
    await prisma.pmFrequencyMaster.upsert({
      where: { code: pf.code },
      update: { name: pf.name, intervalDays: pf.intervalDays },
      create: pf
    });
  }
  console.log("Seeded PM Frequency Masters.");

  // 7. PROBLEM & CATEGORY MASTERS
  const problemCats = ["Electrical", "Mechanical", "Pneumatic", "Hydraulic", "Utility", "Process", "Others"];
  for (const pc of problemCats) {
    await prisma.problemCategory.upsert({
      where: { name: pc },
      update: {},
      create: { name: pc }
    });
  }

  const breakdownCats = ["Breakdown", "Planned Maintenance (PM)", "Tooling Change", "Utility Downtime", "Others"];
  for (const bc of breakdownCats) {
    await prisma.breakdownCategory.upsert({
      where: { name: bc },
      update: {},
      create: { name: bc }
    });
  }

  const rootCauses = ["Normal Wear & Tear", "Lack of Lubrication", "Operator Negligence", "Design Defect", "Material Fatigue", "External Factor", "Utility Trip"];
  for (const rc of rootCauses) {
    await prisma.rootCauseCategory.upsert({
      where: { name: rc },
      update: {},
      create: { name: rc }
    });
  }

  const actionsTaken = ["Part Replaced", "Component Calibrated", "Temporary Repair", "Overhauled", "Lubricated & Cleaned", "Wiring Fixed", "Reset System"];
  for (const at of actionsTaken) {
    await prisma.actionTakenCategory.upsert({
      where: { name: at },
      update: {},
      create: { name: at }
    });
  }
  console.log("Seeded Breakdown and Problem Categories.");

  // 8. MACHINE CATEGORIES, DEPARTMENTS, SECTIONS, MACHINES, & UNITS
  for (const categoryCode of Object.keys(MACHINES_DEFAULT)) {
    // A. Machine Category
    const mc = await prisma.machineCategory.upsert({
      where: { code: categoryCode },
      update: { name: categoryCode },
      create: { name: categoryCode, code: categoryCode }
    });

    // B. Department (matches Machine Type in the old system)
    const dept = await prisma.department.upsert({
      where: { plantId_code: { plantId: plant.id, code: categoryCode } },
      update: { name: `${categoryCode.replace("NF", "NF ").replace("FL", "FL ")} Department` },
      create: {
        name: `${categoryCode.replace("NF", "NF ").replace("FL", "FL ")} Department`,
        code: categoryCode,
        plantId: plant.id
      }
    });

    // C. Section (Default section under department)
    const section = await prisma.section.upsert({
      where: { departmentId_code: { departmentId: dept.id, code: `${categoryCode}_SEC` } },
      update: { name: `${dept.name} Section` },
      create: {
        name: `${dept.name} Section`,
        code: `${categoryCode}_SEC`,
        departmentId: dept.id
      }
    });

    // D. Machines & Subassemblies
    const machinesMap = MACHINES_DEFAULT[categoryCode];
    for (const machineId of Object.keys(machinesMap)) {
      // Create Machine
      const machine = await prisma.machine.upsert({
        where: { machineId: machineId },
        update: { name: machineId, machineCategoryId: mc.id, sectionId: section.id },
        create: {
          machineId: machineId,
          name: machineId,
          machineCategoryId: mc.id,
          sectionId: section.id,
          status: "ACTIVE",
          criticality: "MEDIUM"
        }
      });

      // Create Units as Machine Subassemblies
      const subParts = machinesMap[machineId];
      for (const partName of subParts) {
        // Create SubAssembly for the machine
        const subAssembly = await prisma.subAssembly.create({
          data: {
            machineId: machine.id,
            name: partName,
            description: `Sub assembly unit: ${partName}`
          }
        });

        // Also seed unit under the section (for breakdown mapping compatibility)
        const unitCode = partName.toUpperCase().replace(/\s+/g, '_').substring(0, 45);
        await prisma.unit.upsert({
          where: { sectionId_code: { sectionId: section.id, code: `${machineId}_${unitCode}` } },
          update: { name: partName },
          create: {
            name: partName,
            code: `${machineId}_${unitCode}`,
            sectionId: section.id
          }
        });
      }
    }
  }

  console.log("Seeded Machine Categories, Departments, Sections, Machines, SubAssemblies and Units.");
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
