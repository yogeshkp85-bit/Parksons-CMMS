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
}
