import { Request, Response } from 'express';
import { SchedulerService } from '../services/SchedulerService';

const schedulerService = new SchedulerService();

export class SchedulerController {
  async run(req: Request, res: Response) {
    try {
      const data = await schedulerService.runScheduledJobs();
      res.json({ success: true, data, message: 'Scheduled jobs triggered successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async generateDailyReports(req: Request, res: Response) {
    try {
      const data = await schedulerService.generateDailyReports();
      res.json({ success: true, data, message: 'Daily reports payload generated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async executeTriggers(req: Request, res: Response) {
    try {
      const data = await schedulerService.executeTriggerJobs();
      res.json({ success: true, data, message: 'Triggers executed successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }
}
