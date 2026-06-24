import { Request, Response } from 'express';
import { ApprovalService } from '../services/ApprovalService';
import { notifyBreakdownApproved, notifyBreakdownRejected, NotificationType } from '../services/socket.service';
import prisma from '../utils/db';
import logger from '../utils/logger';

const approvalService = new ApprovalService();

export class ApprovalController {
  async getPending(req: Request, res: Response) {
    try {
      const data = await approvalService.getPendingApprovals();
      res.json({ success: true, data, message: '' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const data = await approvalService.approveEntry(req.body);
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }

      // Trigger Socket.IO notification broadcast to technician
      try {
        const entry = await prisma.rawData.findUnique({ where: { Ref_ID: req.body.refId } });
        if (entry && entry.Submitted_By) {
          await notifyBreakdownApproved({
            type: NotificationType.BREAKDOWN_APPROVED,
            title: 'Breakdown Approved',
            message: `Breakdown ${req.body.refId} on ${entry.Machine_Name || 'Unknown Machine'} has been approved`,
            refId: req.body.refId,
            machine: entry.Machine_Name || 'Unknown',
            timestamp: new Date().toISOString(),
            technicianEmail: entry.Submitted_By
          });
        }
      } catch (socketErr: any) {
        logger.warn(`[Socket] Failed to emit BREAKDOWN_APPROVED for ${req.body.refId}: ${socketErr.message}`);
      }

      res.json({ success: true, data, message: 'Approved successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const data = await approvalService.rejectEntry(req.body);
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }

      // Trigger Socket.IO notification broadcast to technician
      try {
        const entry = await prisma.rawData.findUnique({ where: { Ref_ID: req.body.refId } });
        if (entry && entry.Submitted_By) {
          await notifyBreakdownRejected({
            type: NotificationType.BREAKDOWN_REJECTED,
            title: 'Breakdown Rejected',
            message: `Breakdown ${req.body.refId} on ${entry.Machine_Name || 'Unknown Machine'} has been rejected`,
            refId: req.body.refId,
            machine: entry.Machine_Name || 'Unknown',
            timestamp: new Date().toISOString(),
            technicianEmail: entry.Submitted_By,
            remarks: req.body.remarks || 'No remarks provided'
          });
        }
      } catch (socketErr: any) {
        logger.warn(`[Socket] Failed to emit BREAKDOWN_REJECTED for ${req.body.refId}: ${socketErr.message}`);
      }

      res.json({ success: true, data, message: 'Rejected successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const statusValue = req.body.statusValue || req.body.status;
      const data = await approvalService.updateApprovalStatus(req.body, statusValue);
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }
      res.json({ success: true, data, message: 'Status updated' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }
}
