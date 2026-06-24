import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class SettingsSyncService {
  async syncSettings() {
    const syncLog = await prisma.syncLog.create({
      data: { entityName: 'Settings', status: 'RUNNING' }
    });

    logger.info('[Sync] Settings sync requested, but endpoint does not exist in Apps Script.');
    
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'COMPLETED',
        errorMessage: 'Gap: No getSettings API in Apps Script',
        recordsProcessed: 0,
        completedAt: new Date()
      }
    });

    return { status: 'success', records: 0, inserted: 0, updated: 0, sampleData: [] };
  }
}
