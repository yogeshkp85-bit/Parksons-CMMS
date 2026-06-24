import prisma from '../utils/db';

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

export class MachineRepository {
  /**
   * Replaces `seedMachineDataIfEmpty()`.
   * GAS Mapping: Populates 'Machine_Data' with default values if it is empty.
   */
  async seedIfEmpty() {
    const count = await prisma.machineData.count();
    if (count > 0) return;

    const dataToInsert = [];
    for (const type of Object.keys(MACHINES_DEFAULT)) {
      for (const name of Object.keys(MACHINES_DEFAULT[type])) {
        dataToInsert.push({
          machine_type: type,
          machine_name: name,
          units: MACHINES_DEFAULT[type][name].join(',')
        });
      }
    }

    if (dataToInsert.length > 0) {
      await prisma.machineData.createMany({ data: dataToInsert });
    }
  }

  /**
   * Replaces reading the `Machine_Data` sheet in `getMachineData()`.
   * GAS Mapping: Returns the nested JSON object mapping of types -> machines -> units.
   */
  async getAll(): Promise<Record<string, Record<string, string[]>>> {
    const data = await prisma.machineData.findMany();
    const machines: Record<string, Record<string, string[]>> = {};

    data.forEach(row => {
      const type = row.machine_type.trim();
      const name = row.machine_name.trim();
      const units = row.units.trim();

      if (!type || !name) return;
      if (!machines[type]) machines[type] = {};
      
      machines[type][name] = units ? units.split(',').map(u => u.trim()) : [];
    });

    return machines;
  }

  /**
   * Replaces loop updates and `sheet.appendRow()` in `saveMachineData()`.
   * GAS Mapping: Updates existing machine row or creates a new one.
   */
  async upsert(data: { machineType: string; machineName: string; units: string }) {
    return await prisma.machineData.upsert({
      where: { machine_name: data.machineName.trim() },
      update: {
        machine_type: data.machineType.trim(),
        units: data.units.trim()
      },
      create: {
        machine_type: data.machineType.trim(),
        machine_name: data.machineName.trim(),
        units: data.units.trim()
      }
    });
  }

  /**
   * Replaces loop deletion `sheet.deleteRow(i + 2)` in `deleteMachineData()`.
   * GAS Mapping: Deletes a machine row matching the exact name.
   */
  async deleteByName(machineName: string) {
    try {
      await prisma.machineData.delete({
        where: { machine_name: machineName.trim() }
      });
      return true;
    } catch (e) {
      // Record to delete does not exist
      return false;
    }
  }
}
