/**
 * masterConfig.ts
 * ─────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all dropdown master data in Parksons CMMS.
 * Every page (Breakdown, PM, Corrective, Mobile, Reports) reads from here.
 * Mirrors the MASTER_CONFIG object in the original Form.html exactly.
 *
 * To add a new machine:   Add to MACHINES under the correct department key.
 * To add a technician:    Add to TECHNICIANS array.
 * To add a category:      Add to CATEGORIES array.
 * ─────────────────────────────────────────────────────────────────
 */

// ── MACHINE HIERARCHY ──────────────────────────────────────────────────────
export const MACHINES: Record<string, Record<string, string[]>> = {
  PRINTING: {
    PrintKBA1:      ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    PrintKBA2:      ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    PrintKBA3:      ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    HeidelbergCX1:  ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    HeidelbergCX2:  ["Feeder","PU1","PU2","PU3","PU4","PU5","PU6","PU7","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    Roland:         ["Feeder","PU1","PU2","Coating","Uvlights / IR light","Delivery","Technotrans","Compressor"],
    GRAVIER:        ["Feeder","PU1","Coating","Uvlights / IR light","Delivery","Compressor"],
    Albo:           ["Comapctor","Turner","Blower"],
    UVcoater:       ["Feeder","Infeedunit","Conveyor","Uvlights","Delivery","Coating unit"],
    Sheeter:        ["Reelstand","Helicalcutter","Conveyor","Delivery","Suctionblower","Ductcollector"],
    CTP:            ["Plateexposer","Plateprocessor"],
    Printingplant:  ["Electricity Down","Compressor","Chiller water supply","Technotrans water","DG set"],
    Samplemaking:   ["cuuting head","Travel motor","Bed","Compressor"],
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

// Derived: all department names
export const DEPARTMENTS = Object.keys(MACHINES);

// Get machine names for a department
export function getMachineNames(department: string): string[] {
  return Object.keys(MACHINES[department] || {});
}

// Get units for a machine
export function getUnits(department: string, machineName: string): string[] {
  return MACHINES[department]?.[machineName] || [];
}

// ── TECHNICIANS ─────────────────────────────────────────────────────────────
export const TECHNICIANS: string[] = [
  "Ashish","Shivaji","Sandip","Sharad","Vikas","Ravi",
  "Sachine","Krishna","Dattaram","Akshay","PM team",
  "Baba","Sangram","Ramdas","Chandan","YogeshK",
  "GaneshS","KedarP","YogeshP","Supervisor",
];

// ── SHIFTS ───────────────────────────────────────────────────────────────────
export interface ShiftConfig {
  id: string;
  name: string;
  code: string;
  startTimeMin: string;
  startTimeMax: string;
  // for Third Shift we have two valid ranges so we use a validator fn
}

export const SHIFTS: ShiftConfig[] = [
  { id: "SHIFT_1", name: "First Shift",  code: "S1", startTimeMin: "07:00", startTimeMax: "14:59" },
  { id: "SHIFT_2", name: "Second Shift", code: "S2", startTimeMin: "15:00", startTimeMax: "22:59" },
  { id: "SHIFT_3", name: "Third Shift",  code: "S3", startTimeMin: "23:00", startTimeMax: "23:59" },
  // Third Shift also allows 00:00–06:59 — handled separately in form logic
];

/**
 * Returns true if timeStr (HH:MM) is valid for the given shift.
 * Third Shift is valid for 23:00–23:59 OR 00:00–06:59.
 */
export function isTimeValidForShift(shiftId: string, timeStr: string): boolean {
  if (!timeStr) return true; // empty = not yet entered, don't block
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const totalMins = h * 60 + m;

  if (shiftId === "SHIFT_1") return totalMins >= 7 * 60 && totalMins <= 14 * 60 + 59;
  if (shiftId === "SHIFT_2") return totalMins >= 15 * 60 && totalMins <= 22 * 60 + 59;
  if (shiftId === "SHIFT_3") {
    return totalMins >= 23 * 60 || totalMins <= 6 * 60 + 59;
  }
  return true;
}

/**
 * Detect current shift and shift date from current system time.
 */
export function detectCurrentShift(): { shiftId: string; shiftDateStr: string } {
  const now = new Date();
  const h = now.getHours();
  const shiftDate = new Date(now);

  let shiftId = "SHIFT_3";
  if (h >= 7 && h < 15)       shiftId = "SHIFT_1";
  else if (h >= 15 && h < 23) shiftId = "SHIFT_2";
  else {
    // Third shift: if 00:00–06:59, roll back date to yesterday
    if (h < 7) shiftDate.setDate(shiftDate.getDate() - 1);
  }

  const y = shiftDate.getFullYear();
  const mo = String(shiftDate.getMonth() + 1).padStart(2, "0");
  const d = String(shiftDate.getDate()).padStart(2, "0");
  return { shiftId, shiftDateStr: `${y}-${mo}-${d}` };
}

// ── PROBLEM TYPES ────────────────────────────────────────────────────────────
export const PROBLEM_TYPES: string[] = [
  "Electrical",
  "Mechanical",
  "Mech/Elect",
  "Pneumatic air",
  "Utility",
];

// ── CATEGORIES ───────────────────────────────────────────────────────────────
export const CATEGORIES: string[] = [
  "Breakdown",
  "Predictive",
  "Planning",
  "Preventive",
  "Corrective",
  "Operational",
  "Shift Start up",
];
