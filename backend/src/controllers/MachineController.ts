import { Request, Response } from 'express';
import { MachineService } from '../services/MachineService';

const machineService = new MachineService();

export class MachineController {
  async getAll(req: Request, res: Response) {
    try {
      const data = await machineService.getMachineHierarchy();
      res.json({ success: true, data, message: '' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async save(req: Request, res: Response) {
    try {
      const data = await machineService.saveMachineData(req.body);
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }
      res.json({ success: true, data, message: 'Saved successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const data = await machineService.deleteMachine(req.params.name);
      res.json({ success: true, data, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async init(req: Request, res: Response) {
    try {
      await machineService.initializeMachines();
      res.json({ success: true, data: null, message: 'Machines initialized' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }
}
