import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const pmController = {
  // --- Frequencies ---
  async getFrequencies(req: Request, res: Response) {
    try {
      const freqs = await prisma.pmFrequencyMaster.findMany({ where: { deletedAt: null } });
      return res.json({ data: freqs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async createFrequency(req: Request, res: Response) {
    try {
      const { name, code, intervalDays } = req.body;
      const freq = await prisma.pmFrequencyMaster.create({
        data: { name, code, intervalDays: Number(intervalDays) }
      });
      return res.json({ data: freq });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async updateFrequency(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, intervalDays, isActive } = req.body;
      const freq = await prisma.pmFrequencyMaster.update({
        where: { id },
        data: { name, code, intervalDays: Number(intervalDays), isActive }
      });
      return res.json({ data: freq });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async deleteFrequency(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.pmFrequencyMaster.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false }
      });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // --- Tasks ---
  async getTasks(req: Request, res: Response) {
    try {
      const tasks = await prisma.pmTask.findMany({ 
        where: { deletedAt: null },
        include: { frequency: true, category: true } 
      });
      return res.json(tasks);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async createTask(req: Request, res: Response) {
    try {
      const { name, description, machineCategoryId, frequencyId, checkpoints } = req.body;
      const task = await prisma.pmTask.create({
        data: { name, description, machineCategoryId: machineCategoryId || null, frequencyId, checkpoints }
      });
      return res.json(task);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, machineCategoryId, frequencyId, checkpoints, isActive } = req.body;
      const task = await prisma.pmTask.update({
        where: { id },
        data: { name, description, machineCategoryId: machineCategoryId || null, frequencyId, checkpoints, isActive }
      });
      return res.json(task);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.pmTask.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // --- Schedules ---
  async getSchedules(req: Request, res: Response) {
    try {
      const schedules = await prisma.pmSchedule.findMany({
        include: {
          machine: { include: { unit: { include: { section: { include: { department: true } } } } } },
          pmTask: { include: { frequency: true } },
          completedBy: true
        },
        orderBy: { dueDate: 'asc' }
      });
      return res.json(schedules);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async completeSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { completionRemarks, checkpointsResult, imageUrl } = req.body;
      
      const schedule = await prisma.pmSchedule.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedByUserId: (req as any).user?.id || null, 
          completionRemarks,
          checkpointsResult,
          imageUrl
        }
      });
      return res.json(schedule);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async generateSchedules(req: Request, res: Response) {
    try {
      const { pmTaskId, startDate } = req.body;
      if (!pmTaskId || !startDate) {
        return res.status(400).json({ error: 'pmTaskId and startDate are required' });
      }

      const task = await prisma.pmTask.findUnique({ 
        where: { id: pmTaskId },
        include: { frequency: true }
      });

      if (!task) {
        return res.status(404).json({ error: 'PM Task not found' });
      }

      // Find all applicable machines
      const machines = await prisma.machine.findMany({
        where: task.machineCategoryId ? { machineCategoryId: task.machineCategoryId } : {}
      });

      const start = new Date(startDate);
      const dueDate = new Date(start.getTime() + task.frequency.intervalDays * 24 * 60 * 60 * 1000);

      const schedules = await Promise.all(
        machines.map(m => 
          prisma.pmSchedule.create({
            data: {
              machineId: m.id,
              pmTaskId: task.id,
              dueDate: dueDate,
              status: 'PENDING'
            }
          })
        )
      );

      return res.json({ success: true, count: schedules.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async getCompliance(req: Request, res: Response) {
    try {
      const schedules = await prisma.pmSchedule.findMany({
        where: { deletedAt: null }
      });

      const total = schedules.length;
      const completed = schedules.filter(s => s.status === 'COMPLETED').length;
      const pending = total - completed;
      
      // Overdue means pending and dueDate < now
      const now = new Date();
      const overdue = schedules.filter(s => s.status === 'PENDING' && new Date(s.dueDate) < now).length;

      const complianceRate = total > 0 ? (completed / total) * 100 : 0;

      return res.json({
        data: {
          totalScheduled: total,
          completed,
          pending,
          overdue,
          complianceRate: Math.round(complianceRate * 10) / 10,
          schedules // for chart breakdowns
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async createSchedule(req: Request, res: Response) {
    try {
      const { machineId, pmTaskId, dueDate, status, completedByUserId, completionRemarks, checkpointsResult } = req.body;
      const schedule = await prisma.pmSchedule.create({
        data: {
          machineId,
          pmTaskId,
          dueDate: new Date(dueDate),
          status: status || 'PENDING',
          completedByUserId: completedByUserId || null,
          completionRemarks: completionRemarks || null,
          checkpointsResult: checkpointsResult || null
        }
      });
      return res.json(schedule);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async updateSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { machineId, pmTaskId, dueDate, status, completedByUserId, completionRemarks, checkpointsResult } = req.body;
      const schedule = await prisma.pmSchedule.update({
        where: { id },
        data: {
          machineId,
          pmTaskId,
          dueDate: new Date(dueDate),
          status,
          completedByUserId: completedByUserId || null,
          completionRemarks: completionRemarks || null,
          checkpointsResult: checkpointsResult || null
        }
      });
      return res.json(schedule);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async deleteSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.pmSchedule.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
};
