import { PrismaClient } from '@prisma/client';
import { GoogleSheetsService } from './googleSheets.service';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class UserSyncService {
  async syncUsers() {
    const syncLog = await prisma.syncLog.create({
      data: {
        entityName: 'User',
        status: 'RUNNING'
      }
    });

    try {
      logger.info('[Sync] Starting User synchronization directly from Google Sheets...');
      
      const sheetsService = await GoogleSheetsService.getInstance();
      const rawData = await sheetsService.getSheetData('Admin_Users');
      const records = sheetsService.parseToJSON(rawData);
      
      let inserted = 0;
      let updated = 0;
      let processed = 0;

      for (const record of records) {
        const name = record['name'];
        const email = record['email'];
        // Default mapping if password is empty
        const passwordHash = record['password'] || '$2b$10$xyz...'; // Will use proper hashing in real auth
        const level = record['level'];
        
        if (!email || email.trim() === '') continue;

        processed++;
        
        // Find Role based on level (Admin, Technician, User)
        // If level not found, default to 'User'
        const roleName = level ? level.trim() : 'User';
        const role = await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName, code: roleName.substring(0, 5).toUpperCase(), description: `Role for ${roleName}` }
        });

        // Upsert User
        const existing = await prisma.user.findUnique({ where: { email } });
        
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { 
              name: name || existing.name,
              roleId: role.id
            }
          });
          updated++;
        } else {
          await prisma.user.create({
            data: {
              name: name || 'Unknown',
              email,
              passwordHash,
              roleId: role.id
            }
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
        updated,
        sampleData: records.slice(0, 3)
      };
    } catch (error: any) {
      logger.error(`[Sync] User sync failed: ${error.message}`);
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
