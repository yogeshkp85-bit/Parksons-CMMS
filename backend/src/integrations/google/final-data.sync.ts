import { PrismaClient } from '@prisma/client';
import { GoogleSheetsService } from './googleSheets.service';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class FinalDataSyncService {
  async syncFinalData() {
    const syncLog = await prisma.syncLog.create({
      data: {
        entityName: 'FinalData_Transaction',
        status: 'RUNNING'
      }
    });

    try {
      logger.info('[Sync] Starting Final Data synchronization directly from Google Sheets...');
      
      const sheetsService = await GoogleSheetsService.getInstance();
      const rawData = await sheetsService.getSheetData('Final_Data', 'A1:T50000'); 
      const records = sheetsService.parseToJSON(rawData);
      
      let inserted = 0;
      let updated = 0;
      let processed = 0;

      for (const record of records) {
        const refIdStr = record['Ref_ID'];
        const machineName = record['Machine_Name'];
        
        if (!refIdStr || !machineName) continue;

        processed++;
        
        const existing = await prisma.finalData.findFirst({ where: { Ref_ID: refIdStr } });
        
        const payload = {
            Ref_ID: refIdStr,
            Month_Year: record['Month_Year'] || '',
            Date: record['Date'] || '',
            Shift: record['Shift'] || '',
            Machine_Type: record['Machine_Type'] || '',
            Machine_Name: machineName || '',
            Unit: record['Unit'] || '',
            Problem_Type: record['Problem_Type'] || '',
            Category: record['Category'] || '',
            Description: record['Description'] || '',
            Action_Taken: record['Action_Taken'] || '',
            Time_Start: record['Time_Start'] || '',
            Time_End: record['Time_End'] || '',
            Minutes: record['Minutes'] ? parseFloat(String(record['Minutes'])) : null,
            BD_Flag: record['BD_Flag'] ? parseInt(String(record['BD_Flag']), 10) : null,
            Available_Time_Min: record['Available_Time_Min'] ? parseFloat(String(record['Available_Time_Min'])) : null,
            Attended_By: record['Attended_By'] || ''
        };

        if (existing) {
          await prisma.finalData.update({
            where: { id: existing.id },
            data: payload
          });
          updated++;
        } else {
          await prisma.finalData.create({
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
      logger.error(`[Sync] FinalData sync failed: ${error.message}`);
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
