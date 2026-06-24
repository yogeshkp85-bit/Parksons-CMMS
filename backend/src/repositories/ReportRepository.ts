import prisma from '../utils/db';

export class ReportRepository {
  /**
   * Replaces reading the `Final_Data` sheet in `getDashboardData()`.
   * GAS Mapping: Fetches all rows and returns them in the exact JSON format the GAS service array mapper produced.
   */
  async getFinalData() {
    const data = await prisma.finalData.findMany();
    
    // Transformation Layer: Adapts Prisma Schema to the exact GAS object shape
    return data.map(row => ({
      refId: row.Ref_ID || '',
      date: row.Date || '',
      monthYear: row.Month_Year || '',
      shift: row.Shift ? row.Shift.replace('Thrid', 'Third') : '',
      machineType: row.Machine_Type || '',
      machineName: row.Machine_Name || '',
      unit: row.Unit || '',
      problemType: row.Problem_Type || '',
      category: row.Category || '',
      description: row.Description ? row.Description.replace(/\n/g, ' ').replace(/\r/g, '') : '',
      actionTaken: row.Action_Taken || '',
      timeStart: row.Time_Start || '',
      timeEnd: row.Time_End || '',
      minutes: row.Minutes || 0,
      bdFlag: row.BD_Flag || 0,
      availableMin: row.Available_Time_Min || 44640, // GAS default
      attendedBy: row.Attended_By || ''
    }));
  }

  /**
   * Replaces reading the `Historical_KPI` sheet in `getHistoricalData()`.
   * GAS Mapping: Fetches historical aggregated KPI rows and formats them identically to the GAS output.
   */
  async getHistoricalData() {
    const data = await prisma.historicalKPI.findMany();

    // Transformation Layer: Adapts Prisma Schema to the exact GAS object shape
    const mappedRows = data.map(row => ({
      fy: row.FY || '',
      month: row.Month || '',
      machine: row.Machine || '',
      availTime: row.Available_Time || 34320, // GAS default
      bdTime: row.Breakdown_Time || 0,
      bdCount: row.Breakdown_Count || 0,
      uptime: row.Uptime || 0,
      mttr: row.MTTR || 0,
      mtbf: (row.Uptime && row.Breakdown_Count) ? row.Uptime / row.Breakdown_Count : 0,
      availability: row.Availability || 0
    }));

    // Replicate the exact filter logic from GAS that ignores empty rows
    return mappedRows.filter(r => r.fy && r.month && r.machine);
  }
}
