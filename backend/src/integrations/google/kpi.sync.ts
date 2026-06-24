import { PrismaClient } from '@prisma/client';
import { GoogleSheetsService } from './googleSheets.service';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class KpiSyncService {
  async syncKpi() {
    const syncLog = await prisma.syncLog.create({
      data: {
        entityName: 'HistoricalKPI',
        status: 'RUNNING'
      }
    });

    try {
      logger.info('[Sync] Starting Historical KPI synchronization directly from Google Sheets...');
      
      const sheetsService = await GoogleSheetsService.getInstance();
      const rawData = await sheetsService.getSheetData('Historical_KPI', 'A1:K5000'); 
      const records = sheetsService.parseToJSON(rawData);
      
      let inserted = 0;
      let updated = 0;
      let processed = 0;

      for (const record of records) {
        const fy = record['FY'];
        const month = record['Month'];
        const machine = record['Machine'];
        
        if (!fy || !month || !machine) continue;

        processed++;
        
        // Let's assume unique combination is FY + Month + Machine.
        // Prisma schema doesn't have a unique constraint on these three, so we query first.
        const existing = await prisma.historicalKPI.findFirst({
            where: { FY: fy, Month: month, Machine: machine }
        });
        
        const payload = {
            FY: fy,
            Month: month,
            Machine: machine,
            Available_Time: record['Available_Time'] ? parseFloat(String(record['Available_Time'])) : null,
            Breakdown_Time: record['Breakdown_Time'] ? parseFloat(String(record['Breakdown_Time'])) : null,
            Breakdown_Count: record['Breakdown_Count'] ? parseInt(String(record['Breakdown_Count']), 10) : null,
            Uptime: record['Uptime'] ? parseFloat(String(record['Uptime'])) : null,
            MTTR: record['MTTR'] ? parseFloat(String(record['MTTR'])) : null,
            Availability: record['Availability'] ? parseFloat(String(record['Availability'])) : null,
        };

        if (existing) {
          await prisma.historicalKPI.update({
            where: { id: existing.id },
            data: payload
          });
          updated++;
        } else {
          await prisma.historicalKPI.create({
            data: payload
          });
          inserted++;
        }
      }

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          recordsProcessed: processed,
          recordsInserted: inserted,
          recordsUpdated: updated,
          completedAt: new Date()
        }
      });

      return {
        status: 'success',
        recordsFound: processed,
        inserted,
        updated
      };
    } catch (error: any) {
      logger.error(`[Sync] KPI sync failed: ${error.message}`);
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date()
        }
      });
      throw error;
    }
  }
}
