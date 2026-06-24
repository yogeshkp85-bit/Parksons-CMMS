import { Router } from 'express';
import { MachineSyncService } from '../integrations/google/machine.sync';
import { UserSyncService } from '../integrations/google/user.sync';
import { seedMasterData } from '../integrations/google/seed-master-data';

const router = Router();

const machineSync = new MachineSyncService();
const userSync = new UserSyncService();

router.get('/test/machines', async (req, res) => {
  try {
    const result = await machineSync.syncMachines();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test/users', async (req, res) => {
  try {
    const result = await userSync.syncUsers();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const result = await seedMasterData();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/run', async (req, res) => {
  try {
    const machines = await machineSync.syncMachines();
    const users = await userSync.syncUsers();
    res.json({ status: 'success', machines, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import { RawDataSyncService } from '../integrations/google/raw-data.sync';
import { FinalDataSyncService } from '../integrations/google/final-data.sync';
import { KpiSyncService } from '../integrations/google/kpi.sync';

const rawDataSync = new RawDataSyncService();
const finalDataSync = new FinalDataSyncService();
const kpiSync = new KpiSyncService();

router.get('/test/raw-data', async (req, res) => {
  try {
    const result = await rawDataSync.syncRawData();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test/final-data', async (req, res) => {
  try {
    const result = await finalDataSync.syncFinalData();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test/kpi', async (req, res) => {
  try {
    const result = await kpiSync.syncKpi();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/run-transactions', async (req, res) => {
  try {
    const rawData = await rawDataSync.syncRawData();
    const finalData = await finalDataSync.syncFinalData();
    const kpi = await kpiSync.syncKpi();
    res.json({ status: 'success', rawData, finalData, kpi });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json({ status: 'ready', phase: '15.2C' });
});

export default router;
