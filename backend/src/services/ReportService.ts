import { ReportRepository } from '../repositories/ReportRepository';
import { BreakdownRepository } from '../repositories/BreakdownRepository';

const reportRepo = new ReportRepository();
const breakdownRepo = new BreakdownRepository();

export class ReportService {
  /**
   * Replaces `getDashboardData()` from Code.gs.
   * GAS logic: Fetches Final_Data, cross-references with Raw_Data status, and excludes pending/rejected.
   */
  async getDashboardData() {
    // 1. Fetch mapped data from repository (no DB logic here)
    const rawData = await reportRepo.getFinalData();
    
    // 2. Fetch status map from Breakdown domain to replicate `buildStatusMap()`
    const statusMap = await breakdownRepo.getStatusMap();
    const hasStatusMap = Object.keys(statusMap).length > 0;

    // 3. Exact GAS filtering logic
    const filteredRows = rawData.filter((row: any) => {
      const mn = String(row.machineName || '').trim();
      const refId = String(row.refId || '').trim();
      
      if (!mn && !refId) return false;

      if (hasStatusMap && refId) {
        const entryStatus = statusMap[refId];
        if (entryStatus === 'PENDING_REVIEW' || entryStatus === 'REJECTED') {
          return false;
        }
      }
      
      return true;
    });

    return {
      error: null,
      rows: filteredRows,
      totalRows: filteredRows.length,
      generated: new Date().toISOString()
    };
  }

  /**
   * Replaces `getHistoricalData()` from Code.gs.
   * GAS logic: Fetches Historical_KPI data and wraps it with a generated timestamp.
   */
  async getHistoricalReport() {
    // 1. Fetch data from repository (repo handles the fallback default values like availTime=34320)
    const rows = await reportRepo.getHistoricalData();

    // 2. Return identical GAS JSON structure
    return {
      rows: rows,
      generated: new Date().toISOString()
    };
  }

  /**
   * Alias/wrapper for KPI reporting to satisfy service mapping.
   * Returns the historical data used by the KPI dashboard.
   */
  async getKPIReport() {
    return await this.getHistoricalReport();
  }
}
