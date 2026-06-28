import { PrismaClient } from '@prisma/client';
import { GoogleSheetsService } from './googleSheets.service';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class RawDataSyncService {
  async syncRawData() {
    const syncLog = await prisma.syncLog.create({
      data: {
        entityName: 'RawData_Transaction',
        status: 'RUNNING'
      }
    });

    try {
      logger.info('[Sync] Starting Raw Data synchronization directly from Google Sheets...');
      
      const sheetsService = await GoogleSheetsService.getInstance();
      const rawData = await sheetsService.getSheetData('Raw_Data', 'A1:Y50000'); // Assuming up to 25 columns
      const records = sheetsService.parseToJSON(rawData);
      
      let inserted = 0;
      let updated = 0;
      let processed = 0;

      for (const record of records) {
        const timestampStr = record['Timestamp'];
        const refIdStr = record['Ref_ID'];
        const machineName = record['Machine_Name'];
        
        // Skip if basic identifier is missing
        if (!refIdStr || !machineName) continue;

        processed++;
        
        // Use Ref_ID as the unique identifier. Since Ref_ID might be duplicate in some rare cases,
        // we can combine it with Timestamp or just use Ref_ID. Let's assume Ref_ID is purely unique for breakdowns.
        
        // Upsert BreakdownLog based on refId (assuming we map Ref_ID to some column, say `jobCardNumber` or `id`?
        // Wait, BreakdownLog has `id` (uuid), so we should store `refId` somewhere or just use upsert on a unique identifier if one exists.
        // Let's store Ref_ID in `description` or `createdAt`? Actually, let's just insert into `RawData` model for now, 
        // as per the user's previous schema which includes a RawData table: `model RawData { ... }`
        
        // Check if RawData already exists
        const existing = await prisma.rawData.findFirst({ where: { Ref_ID: refIdStr } });
        
        let parsedTimestamp = null;
        if (timestampStr) {
          const d = new Date(timestampStr);
          if (!isNaN(d.getTime())) {
            parsedTimestamp = d;
          }
        }
        
        const payload = {
            Timestamp: parsedTimestamp,
            Ref_ID: refIdStr,
            Date: record['Date'] || '',
            Shift: record['Shift'] || '',
            Machine_Type: record['Machine_Type'] || '',
            Machine_Name: machineName || '',
            Unit: record['Unit'] || '',
            Problem_Type: record['Problem_Type'] || '',
            Category: record['Category'] || '',
            Description: record['Description'] || '',
            Action_Taken: record['Action_Taken'] || '',
            Root_Cause: record['Root_Cause'] || '',
            Time_Start: record['Time_Start'] || '',
            Time_End: record['Time_End'] || '',
            Duration_Min: record['Duration_Min'] ? parseFloat(String(record['Duration_Min'])) : null,
            Attended_By: record['Attended_By'] || '',
            Submitted_By: record['Submitted_By'] || '',
            Remarks: record['Remarks'] || '',
            Problem_Reported: record['Problem_Reported'] || '',
            Spare_Consumed: record['Spare_Consumed'] || '',
            Additional_Team: record['Additional_Team'] || '',
            Status: record['Status'] || ''
        };

        if (existing) {
          await prisma.rawData.update({
            where: { id: existing.id },
            data: payload
          });
          updated++;
        } else {
          await prisma.rawData.create({
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
      logger.error(`[Sync] RawData sync failed: ${error.message}`);
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
