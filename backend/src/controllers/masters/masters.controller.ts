/**
 * masters.controller.ts
 * Generic Master Setup controller.
 * Handles CRUD for all Tier 1+2 master tables through a single reusable pattern.
 * Each master route passes its prisma model name and allowed fields.
 */

import { Request, Response } from 'express';
import prisma from '../../utils/db';
import logger from '../../utils/logger';

// Models exposed through Master Setup API
export type MasterModel =
  | 'plant' | 'department' | 'section' | 'shiftMaster' | 'financialYear'
  | 'breakdownCategory' | 'problemCategory' | 'rootCauseCategory' | 'actionTakenCategory'
  | 'technician' | 'pmFrequencyMaster' | 'machineCategory' | 'vendor';

const MODEL_LABELS: Record<MasterModel, string> = {
  plant:                'Plant',
  department:           'Department',
  section:              'Section',
  shiftMaster:          'Shift',
  financialYear:        'Financial Year',
  breakdownCategory:    'Breakdown Category',
  problemCategory:      'Problem Type',
  rootCauseCategory:    'Root Cause',
  actionTakenCategory:  'Action Taken',
  technician:           'Technician',
  pmFrequencyMaster:    'PM Frequency',
  machineCategory:      'Machine Category',
  vendor:               'Vendor',
};

function getModel(modelName: MasterModel) {
  return (prisma as any)[modelName];
}

/** GET /masters/:model — list all active records */
export async function listMaster(req: Request, res: Response) {
  const model = req.params.model as MasterModel;
  if (!MODEL_LABELS[model]) {
    return res.status(400).json({ status: 'error', message: `Unknown master: ${model}` });
  }
  try {
    // Try with displayOrder first, fall back to name-only sort
    let records: any[];
    try {
      records = await getModel(model).findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
    } catch {
      records = await getModel(model).findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }
    return res.json({ status: 'success', data: records, count: records.length });
  } catch (err: any) {
    logger.error(`[Masters] listMaster error for ${model}:`, err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** GET /masters/:model/:id — get single record */
export async function getMaster(req: Request, res: Response) {
  const model = req.params.model as MasterModel;
  const { id } = req.params;
  if (!MODEL_LABELS[model]) {
    return res.status(400).json({ status: 'error', message: `Unknown master: ${model}` });
  }
  try {
    const record = await getModel(model).findUnique({ where: { id } });
    if (!record) {
      return res.status(404).json({ status: 'error', message: `${MODEL_LABELS[model]} not found` });
    }
    return res.json({ status: 'success', data: record });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** POST /masters/:model — create new record (upsert by code when code provided) */
export async function createMaster(req: Request, res: Response) {
  const model = req.params.model as MasterModel;
  if (!MODEL_LABELS[model]) {
    return res.status(400).json({ status: 'error', message: `Unknown master: ${model}` });
  }
  try {
    const body = req.body;
    // If a unique 'code' field is provided, use upsert to avoid duplicate errors
    // This handles re-seeding and re-adding records gracefully
    let record: any;
    if (body.code) {
      try {
        record = await getModel(model).upsert({
          where: { code: body.code },
          update: { ...body, updatedAt: new Date() },
          create: body,
        });
      } catch {
        // Model may not have 'code' as unique — fall through to create
        record = await getModel(model).create({ data: body });
      }
    } else {
      record = await getModel(model).create({ data: body });
    }
    logger.info(`[Masters] Created/updated ${model}: ${record.name || record.code || record.id}`);
    return res.status(201).json({ status: 'success', data: record });
  } catch (err: any) {
    if (err.code === 'P2002') {
      const fields = err.meta?.target?.join(', ') || 'code/name';
      return res.status(409).json({
        status: 'error',
        message: `A ${MODEL_LABELS[model]} with this ${fields} already exists in the database. Use a different code or name, or edit the existing record instead.`
      });
    }
    logger.error(`[Masters] createMaster error for ${model}:`, err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** PUT /masters/:model/:id — update record */
export async function updateMaster(req: Request, res: Response) {
  const model = req.params.model as MasterModel;
  const { id } = req.params;
  if (!MODEL_LABELS[model]) {
    return res.status(400).json({ status: 'error', message: `Unknown master: ${model}` });
  }
  try {
    const record = await getModel(model).update({
      where: { id },
      data: { ...req.body, updatedAt: new Date() },
    });
    logger.info(`[Masters] Updated ${model} ${id}`);
    return res.json({ status: 'success', data: record });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: `${MODEL_LABELS[model]} not found` });
    }
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** DELETE /masters/:model/:id — soft delete */
export async function deleteMaster(req: Request, res: Response) {
  const model = req.params.model as MasterModel;
  const { id } = req.params;
  if (!MODEL_LABELS[model]) {
    return res.status(400).json({ status: 'error', message: `Unknown master: ${model}` });
  }
  try {
    await getModel(model).update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    logger.info(`[Masters] Soft-deleted ${model} ${id}`);
    return res.json({ status: 'success', message: `${MODEL_LABELS[model]} deactivated successfully` });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: `${MODEL_LABELS[model]} not found` });
    }
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** PUT /masters/:model/:id/restore — restore soft-deleted record */
export async function restoreMaster(req: Request, res: Response) {
  const model = req.params.model as MasterModel;
  const { id } = req.params;
  try {
    await getModel(model).update({
      where: { id },
      data: { isActive: true, deletedAt: null },
    });
    return res.json({ status: 'success', message: `${MODEL_LABELS[model]} restored` });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** GET /masters/machines/hierarchy — full Dept→Machine→Unit tree for form dropdowns */
export async function getMachineHierarchy(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        sections: {
          where: { isActive: true },
          include: {
            machines: {
              where: { isActive: true, isSubAssembly: false },
              orderBy: { name: 'asc' },
              include: {
                subAssemblies: {
                  where: { isActive: true },
                  orderBy: { name: 'asc' },
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    // Flatten into the format the Breakdown form expects:
    // { PRINTING: { PrintKBA1: ["Feeder", "PU1", ...], ... }, ... }
    const hierarchy: Record<string, Record<string, { id: string; units: { id: string; name: string }[] }>> = {};
    for (const dept of departments) {
      hierarchy[dept.name] = {};
      for (const section of dept.sections) {
        for (const machine of section.machines) {
          hierarchy[dept.name][machine.name] = {
            id: machine.id,
            units: machine.subAssemblies,
          };
        }
      }
    }

    return res.json({ status: 'success', data: hierarchy });
  } catch (err: any) {
    logger.error('[Masters] getMachineHierarchy error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** GET /masters/technicians/list — simple flat list of active technician names */
export async function getTechnicianList(req: Request, res: Response) {
  try {
    const technicians = await (prisma as any).technician.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, code: true, name: true, designation: true, department: true },
    });
    return res.json({ status: 'success', data: technicians });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

/** GET /masters/financial-years/list — list FYs for dashboard filter */
export async function getFinancialYearList(req: Request, res: Response) {
  try {
    const years = await (prisma as any).financialYear.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, code: true, label: true, startDate: true, endDate: true, isCurrent: true },
    });
    return res.json({ status: 'success', data: years });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

export const MASTER_MODEL_LABELS = MODEL_LABELS;
