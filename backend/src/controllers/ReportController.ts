import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

const reportService = new ReportService();

export class ReportController {
  async getDashboard(req: Request, res: Response) {
    try {
      const data = await reportService.getDashboardData();
      res.json({ success: true, data, message: '' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async getKPI(req: Request, res: Response) {
    try {
      const data = await reportService.getKPIReport();
      res.json({ success: true, data, message: '' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async getHistorical(req: Request, res: Response) {
    try {
      const data = await reportService.getHistoricalReport();
      res.json({ success: true, data, message: '' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }
}
