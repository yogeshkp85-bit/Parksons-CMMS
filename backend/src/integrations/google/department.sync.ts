import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class DepartmentSyncService {
  async syncDepartments() {
    const syncLog = await prisma.syncLog.create({
      data: { entityName: 'Department', status: 'RUNNING' }
    });

    logger.info('[Sync] Department sync requested, but endpoint does not exist in Apps Script.');
    
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'COMPLETED',
        errorMessage: 'Gap: No getDepartments API in Apps Script',
        recordsProcessed: 0,
        completedAt: new Date()
      }
    });

    return { status: 'success', records: 0, inserted: 0, updated: 0, sampleData: [] };
  }
}
