import { Request, Response } from 'express';
import prisma from '../utils/db';
import logger from '../utils/logger';

const TABLE_TO_MODEL: Record<string, string> = {
  mst_plant: 'mstPlant',
  mst_department: 'mstDepartment',
  mst_machine_type: 'mstMachineType',
  mst_machine: 'mstMachine',
  mst_machine_unit: 'mstMachineUnit',
  mst_employee: 'mstEmployee',
  mst_shift: 'mstShift',
  mst_problem_type: 'mstProblemType',
  mst_wo_category: 'mstWoCategory',
  mst_status: 'mstStatus',
  mst_priority: 'mstPriority',
};

const PRIMARY_KEYS: Record<string, string> = {
  mst_plant: 'plantId',
  mst_department: 'deptId',
  mst_machine_type: 'machineTypeId',
  mst_machine: 'machineId',
  mst_machine_unit: 'unitId',
  mst_employee: 'employeeId',
  mst_shift: 'shiftId',
  mst_problem_type: 'problemTypeId',
  mst_wo_category: 'categoryId',
  mst_status: 'statusId',
  mst_priority: 'priorityId',
};

// Simple in-memory cache for equipment tree
let equipmentTreeCache: any = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

function getPrismaModel(tableName: string) {
  const modelName = TABLE_TO_MODEL[tableName];
  if (!modelName) return null;
  return (prisma as any)[modelName];
}

export const mdmController = {
  // Clear the in-memory cache
  clearCache() {
    equipmentTreeCache = null;
    cacheTime = 0;
  },

  // GET /api/v1/masters/generic/:tableName
  async listRecords(req: Request, res: Response) {
    const { tableName } = req.params;
    const model = getPrismaModel(tableName);
    if (!model) {
      return res.status(400).json({ error: `Invalid MDM table: ${tableName}` });
    }

    try {
      const records = await model.findMany({
        where: { isActive: true },
      });
      return res.json({ data: records });
    } catch (err: any) {
      logger.error(`[MDM listRecords] Error for ${tableName}:`, err);
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /api/v1/masters/generic/:tableName/:id
  async getRecord(req: Request, res: Response) {
    const { tableName, id } = req.params;
    const model = getPrismaModel(tableName);
    const pk = PRIMARY_KEYS[tableName];
    if (!model || !pk) {
      return res.status(400).json({ error: `Invalid MDM table: ${tableName}` });
    }

    try {
      const record = await model.findUnique({
        where: { [pk]: id },
      });
      if (!record || !record.isActive) {
        return res.status(404).json({ error: 'Record not found' });
      }
      return res.json({ data: record });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // POST /api/v1/masters/generic/:tableName
  async createRecord(req: Request, res: Response) {
    const { tableName } = req.params;
    const model = getPrismaModel(tableName);
    const pk = PRIMARY_KEYS[tableName];
    if (!model || !pk) {
      return res.status(400).json({ error: `Invalid MDM table: ${tableName}` });
    }

    try {
      const data = req.body;
      const record = await prisma.$transaction(async (tx) => {
        const created = await (tx as any)[TABLE_TO_MODEL[tableName]].create({ data });
        await tx.sysAuditLog.create({
          data: {
            tableName,
            recordId: created[pk],
            action: 'CREATE',
            newValue: created,
            userId: (req as any).user?.id || null,
          },
        });
        return created;
      });

      mdmController.clearCache();
      return res.status(201).json({ status: 'success', data: record });
    } catch (err: any) {
      logger.error(`[MDM createRecord] Error:`, err);
      return res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/v1/masters/generic/:tableName/:id
  async updateRecord(req: Request, res: Response) {
    const { tableName, id } = req.params;
    const model = getPrismaModel(tableName);
    const pk = PRIMARY_KEYS[tableName];
    if (!model || !pk) {
      return res.status(400).json({ error: `Invalid MDM table: ${tableName}` });
    }

    try {
      const data = req.body;
      const record = await prisma.$transaction(async (tx) => {
        const existing = await (tx as any)[TABLE_TO_MODEL[tableName]].findUnique({
          where: { [pk]: id },
        });
        if (!existing) {
          throw new Error('Record not found');
        }

        const updated = await (tx as any)[TABLE_TO_MODEL[tableName]].update({
          where: { [pk]: id },
          data,
        });

        await tx.sysAuditLog.create({
          data: {
            tableName,
            recordId: id,
            action: 'UPDATE',
            oldValue: existing,
            newValue: updated,
            userId: (req as any).user?.id || null,
          },
        });
        return updated;
      });

      mdmController.clearCache();
      return res.json({ status: 'success', data: record });
    } catch (err: any) {
      logger.error(`[MDM updateRecord] Error:`, err);
      return res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/v1/masters/generic/:tableName/:id
  async deleteRecord(req: Request, res: Response) {
    const { tableName, id } = req.params;
    const model = getPrismaModel(tableName);
    const pk = PRIMARY_KEYS[tableName];
    if (!model || !pk) {
      return res.status(400).json({ error: `Invalid MDM table: ${tableName}` });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await (tx as any)[TABLE_TO_MODEL[tableName]].findUnique({
          where: { [pk]: id },
        });
        if (!existing) {
          throw new Error('Record not found');
        }

        const updated = await (tx as any)[TABLE_TO_MODEL[tableName]].update({
          where: { [pk]: id },
          data: { isActive: false },
        });

        await tx.sysAuditLog.create({
          data: {
            tableName,
            recordId: id,
            action: 'DELETE',
            oldValue: existing,
            newValue: updated,
            userId: (req as any).user?.id || null,
          },
        });
      });

      mdmController.clearCache();
      return res.json({ status: 'success', message: 'Record soft deleted successfully' });
    } catch (err: any) {
      logger.error(`[MDM deleteRecord] Error:`, err);
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /api/v1/masters/dropdowns/:tableName
  async getDropdown(req: Request, res: Response) {
    const { tableName } = req.params;
    const model = getPrismaModel(tableName);
    const pk = PRIMARY_KEYS[tableName];
    if (!model || !pk) {
      return res.status(400).json({ error: `Invalid MDM table: ${tableName}` });
    }

    try {
      const records = await model.findMany({
        where: { isActive: true },
      });

      // Map dynamic names based on table properties
      const data = records.map((r: any) => {
        let name = '';
        if (tableName === 'mst_plant') name = r.plantName || r.plantCode;
        else if (tableName === 'mst_department') name = r.deptName || r.deptCode;
        else if (tableName === 'mst_machine_type') name = r.typeName || r.typeCode;
        else if (tableName === 'mst_machine') name = r.machineName || r.machineCode;
        else if (tableName === 'mst_machine_unit') name = r.unitName || r.unitCode;
        else if (tableName === 'mst_employee') name = r.empName;
        else if (tableName === 'mst_shift') name = r.shiftName;
        else if (tableName === 'mst_problem_type') name = r.typeName;
        else if (tableName === 'mst_wo_category') name = r.categoryName;
        else if (tableName === 'mst_status') name = r.statusName;
        else if (tableName === 'mst_priority') name = r.priorityName;
        else name = r.name || r.code || r[pk];

        return { id: r[pk], name };
      });

      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /api/v1/mdm/equipment-tree
  async getEquipmentTree(req: Request, res: Response) {
    const now = Date.now();
    if (equipmentTreeCache && now - cacheTime < CACHE_TTL) {
      return res.json({ data: equipmentTreeCache });
    }

    try {
      const plants = await prisma.mstPlant.findMany({
        where: { isActive: true },
        include: {
          departments: {
            where: { isActive: true },
            include: {
              machineTypes: {
                where: { isActive: true },
                include: {
                  machines: {
                    where: { isActive: true },
                    include: {
                      units: {
                        where: { isActive: true },
                        orderBy: { position: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      equipmentTreeCache = plants;
      cacheTime = now;

      return res.json({ data: plants });
    } catch (err: any) {
      logger.error(`[MDM getEquipmentTree] Error:`, err);
      return res.status(500).json({ error: err.message });
    }
  },
};
