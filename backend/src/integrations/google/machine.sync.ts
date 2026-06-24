import { PrismaClient } from '@prisma/client';
import { GoogleSheetsService } from './googleSheets.service';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export class MachineSyncService {
  async syncMachines() {
    const syncLog = await prisma.syncLog.create({
      data: {
        entityName: 'Machine',
        status: 'RUNNING'
      }
    });

    try {
      logger.info('[Sync] Starting Machine synchronization directly from Google Sheets...');
      
      const sheetsService = await GoogleSheetsService.getInstance();
      const rawData = await sheetsService.getSheetData('Machine_Data');
      const records = sheetsService.parseToJSON(rawData);
      
      let inserted = 0;
      let updated = 0;
      let processed = 0;

      // Create default Plant, Dept, Section
      const plant = await prisma.plant.upsert({
        where: { code: 'DEF_PLANT' },
        update: {},
        create: { name: 'Default Plant', code: 'DEF_PLANT' }
      });
      
      const departmentObj = await prisma.department.findFirst({ where: { plantId: plant.id, code: 'DEF_DEPT' }});
      let deptId = departmentObj?.id;
      if (!deptId) {
        const d = await prisma.department.create({ data: { name: 'Default Department', code: 'DEF_DEPT', plantId: plant.id }});
        deptId = d.id;
      }
      
      const sectionObj = await prisma.section.findFirst({ where: { departmentId: deptId, code: 'DEF_SEC' }});
      let secId = sectionObj?.id;
      if (!secId) {
        const s = await prisma.section.create({ data: { name: 'Default Section', code: 'DEF_SEC', departmentId: deptId }});
        secId = s.id;
      }

      for (const record of records) {
        const type = record['machine_type'];
        const name = record['machine_name'];
        const units = record['units'];
        
        if (!name || name.trim() === '') continue;

        processed++;
        
        // Ensure MachineCategory exists
        const categoryName = type && type.trim() !== '' ? type.trim() : 'Uncategorized';
        const category = await prisma.machineCategory.upsert({
            where: { name: categoryName },
            update: {},
            create: { name: categoryName, code: categoryName.substring(0, 3).toUpperCase() }
        });

        // Upsert Machine
        const machineCode = name.toUpperCase().substring(0, 10).replace(/[^A-Z0-9]/g, '');
        const existing = await prisma.machine.findFirst({ where: { name } });
        
        if (existing) {
          await prisma.machine.update({
            where: { id: existing.id },
            data: { 
              machineCategoryId: category.id,
              model: type
            }
          });
          updated++;
        } else {
          await prisma.machine.create({
            data: {
              name,
              machineId: `M-${Date.now()}-${processed}`,
              machineCategoryId: category.id,
              sectionId: secId,
              model: type
            }
          });
          inserted++;
        }

        // Handle Units mapping
        if (units && units.trim() !== '') {
          const unitList = units.split(',').map((u: string) => u.trim()).filter((u: string) => u !== '');
          for (const u of unitList) {
             const existingUnit = await prisma.unit.findFirst({ where: { sectionId: secId, name: u }});
             if (!existingUnit) {
               const unitCode = `U-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
               await prisma.unit.create({
                 data: { name: u, code: unitCode, sectionId: secId }
               });
             }
          }
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
      logger.error(`[Sync] Machine sync failed: ${error.message}`);
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
