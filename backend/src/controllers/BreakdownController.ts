/**
 * @deprecated LEGACY CONTROLLER — scheduled for removal in Phase 7.
 * The new implementation is in breakdown.controller.ts (kebab-case).
 * breakdown.controller.ts has richer logic: SubAssembly resolution,
 * Socket.IO notifications, Zod validation, and dynamic technician list.
 * Migration task: update routes/index.ts to import from breakdown.controller.ts
 * and delete this file.
 */
import { Request, Response } from 'express';
import { BreakdownService } from '../services/BreakdownService';
import { notifyBreakdownCreated, NotificationType } from '../services/socket.service';

import logger from '../utils/logger';

const breakdownService = new BreakdownService();

export class BreakdownController {
  async getPending(req: Request, res: Response) {
    try {
      const data = await breakdownService.getPendingLogs();
      res.json({ success: true, data, message: '' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await breakdownService.createLog(req.body);

      // Trigger Socket.IO notification broadcast to supervisors
      try {
        await notifyBreakdownCreated({
          type: NotificationType.BREAKDOWN_CREATED,
          title: 'New Breakdown Reported',
          message: `${req.body.machineName || 'Unknown Machine'} — ${req.body.description || 'No description'}`,
          refId: data.refId,
          machine: req.body.machineName || 'Unknown',
          timestamp: new Date().toISOString()
        });
      } catch (socketErr: any) {
        logger.warn(`[Socket] Failed to emit BREAKDOWN_CREATED for ${data.refId}: ${socketErr.message}`);
      }

      res.json({ success: true, data, message: 'Created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await breakdownService.updateLog(req.body);
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }
      res.json({ success: true, data, message: 'Updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      // Passes full body to the service to map to any required fields
      const data = await breakdownService.updateLog(req.body);
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }
      res.json({ success: true, data, message: 'Status updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async deleteBreakdown(req: Request, res: Response) {
    try {
      const refId = req.params.id;
      if (!refId) return res.status(400).json({ success: false, message: 'Missing Breakdown ID' });

      // Find in RawData (Legacy)
      const raw = await require('../utils/db').default.rawData.findUnique({ where: { Ref_ID: refId } });
      if (raw) {
        await require('../utils/db').default.rawData.delete({ where: { Ref_ID: refId } });
      }

      // Also try to find and delete in BreakdownLog (Phase 15)
      const newLog = await require('../utils/db').default.breakdownLog.findUnique({ where: { breakdownNumber: refId } });
      if (newLog) {
        await require('../utils/db').default.breakdownLog.delete({ where: { breakdownNumber: refId } });
      }

      // We should also delete from FinalData to ensure Reports module is clean
      const finalData = await require('../utils/db').default.finalData.findUnique({ where: { Ref_ID: refId } });
      if (finalData) {
        await require('../utils/db').default.finalData.delete({ where: { Ref_ID: refId } });
      }

      // Trigger Scheduler to recalculate KPIs based on missing data
      try {
        const schedulerCtrl = new (require('./SchedulerController').SchedulerController)();
        await schedulerCtrl.run({} as any, { json: () => {} } as any);
      } catch (e) {
        // Ignore scheduler error
      }

      res.json({ success: true, message: 'Breakdown deleted successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async editApprovedBreakdown(req: Request, res: Response) {
    try {
      const refId = req.params.id;
      if (!refId) return res.status(400).json({ success: false, message: 'Missing Breakdown ID' });

      const data = req.body;
      const updatePayload: any = {};
      if (data.timeStart) updatePayload.Time_Start = data.timeStart;
      if (data.timeEnd) updatePayload.Time_End = data.timeEnd;
      if (data.durationMin !== undefined) updatePayload.Duration_Min = parseFloat(data.durationMin);
      if (data.actionTaken) updatePayload.Action_Taken = data.actionTaken;
      if (data.rootCause) updatePayload.Root_Cause = data.rootCause;

      const raw = await require('../utils/db').default.rawData.findUnique({ where: { Ref_ID: refId } });
      if (raw) {
        await require('../utils/db').default.rawData.update({
          where: { Ref_ID: refId },
          data: updatePayload
        });
      }

      // Update FinalData so Reports table updates instantly
      const finalPayload: any = {};
      if (data.timeStart) finalPayload.Time_Start = data.timeStart;
      if (data.timeEnd) finalPayload.Time_End = data.timeEnd;
      if (data.durationMin !== undefined) finalPayload.Minutes = parseFloat(data.durationMin);
      if (data.actionTaken) finalPayload.Action_Taken = data.actionTaken;

      const finalData = await require('../utils/db').default.finalData.findUnique({ where: { Ref_ID: refId } });
      if (finalData) {
        await require('../utils/db').default.finalData.update({
          where: { Ref_ID: refId },
          data: finalPayload
        });
      }

      // Trigger Scheduler to recalculate KPIs
      try {
        const schedulerCtrl = new (require('./SchedulerController').SchedulerController)();
        await schedulerCtrl.run({} as any, { json: () => {} } as any);
      } catch (e) {
        // Ignore scheduler error
      }

      res.json({ success: true, message: 'Breakdown updated successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}