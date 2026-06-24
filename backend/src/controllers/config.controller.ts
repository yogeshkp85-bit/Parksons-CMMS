import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const configController = {
  async getMasters(req: Request, res: Response) {
    try {
      const [categories, units, sections, machines] = await Promise.all([
        prisma.machineCategory.findMany({ where: { isActive: true } }),
        prisma.unit.findMany({ where: { isActive: true }, include: { section: true } }),
        prisma.section.findMany({ where: { isActive: true } }),
        prisma.machine.findMany({ where: { isActive: true, deletedAt: null } })
      ]);
      
      return res.json({ categories, units, sections, machines });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
};
