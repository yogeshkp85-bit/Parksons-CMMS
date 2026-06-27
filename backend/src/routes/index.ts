import { Router } from 'express';
import { BreakdownController } from '../controllers/BreakdownController';
import { MachineController } from '../controllers/MachineController';
import { UserController } from '../controllers/UserController';
import { ReportController } from '../controllers/ReportController';
import { ApprovalController } from '../controllers/ApprovalController';
import { SchedulerController } from '../controllers/SchedulerController';
import { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import syncRoutes from './sync.routes';
import { router as machinesRouter } from './machines.routes';
import { router as configRouter } from './config.routes';
import { router as pmRouter } from './pm.routes';
import mastersRouter from './masters.routes';

const router = Router();

// Initialize Controllers
const breakdownCtrl = new BreakdownController();
const machineCtrl = new MachineController();
const userCtrl = new UserController();
const reportCtrl = new ReportController();
const approvalCtrl = new ApprovalController();
const schedulerCtrl = new SchedulerController();
const notificationCtrl = new NotificationController();

// Apply auth middleware globally to secure API endpoints (with path bypasses inside middleware)
router.use(authenticate);

// ---------------------------------------------------------
// 1. Breakdowns
// ---------------------------------------------------------
router.get('/breakdowns/pending', authorize('Approve'), (req, res) => breakdownCtrl.getPending(req, res));
router.post('/breakdowns/create', authorize('Create'), (req, res) => breakdownCtrl.create(req, res));
router.put('/breakdowns/update', authorize('Edit'), (req, res) => breakdownCtrl.update(req, res));
router.put('/breakdowns/status', authorize('Edit'), (req, res) => breakdownCtrl.updateStatus(req, res));

// ---------------------------------------------------------
// 2. Machines
// ---------------------------------------------------------
router.use('/machines', authenticate, authorize('Masters'), machinesRouter);

// ---------------------------------------------------------
// 3. Users & Auth
// ---------------------------------------------------------
router.post('/auth/login', (req, res) => userCtrl.login(req, res));
router.post('/auth/register', (req, res) => userCtrl.register(req, res));
router.get('/auth/register-metadata', (req, res) => userCtrl.getRegisterMetadata(req, res));
router.get('/users', authorize('Users'), (req, res) => userCtrl.getAll(req, res));
router.post('/users/create', authorize('Users'), (req, res) => userCtrl.create(req, res));
router.delete('/users/:email', authorize('Users'), (req, res) => userCtrl.delete(req, res));
router.put('/users/:email', authorize('Users'), (req, res) => userCtrl.update(req, res));
router.post('/users/init', (req, res) => userCtrl.init(req, res));

// ---------------------------------------------------------
// 4. Reports
// ---------------------------------------------------------
router.get('/reports/dashboard', authorize('Dashboard'), (req, res) => reportCtrl.getDashboard(req, res));
router.get('/reports/kpi', authorize('Reports'), (req, res) => reportCtrl.getKPI(req, res));
router.get('/reports/historical', authorize('Reports'), (req, res) => reportCtrl.getHistorical(req, res));

// ---------------------------------------------------------
// 5. Approvals
// ---------------------------------------------------------
router.get('/approvals/pending', authorize('Approve'), (req, res) => approvalCtrl.getPending(req, res));
router.post('/approvals/approve', authorize('Approve'), (req, res) => approvalCtrl.approve(req, res));
router.post('/approvals/reject', authorize('Approve'), (req, res) => approvalCtrl.reject(req, res));
router.put('/approvals/status', authorize('Approve'), (req, res) => approvalCtrl.updateStatus(req, res));

// ---------------------------------------------------------
// 6. Scheduler
// ---------------------------------------------------------
router.post('/scheduler/run', authorize('Reports'), (req, res) => schedulerCtrl.run(req, res));
router.post('/scheduler/daily-reports', authorize('Reports'), (req, res) => schedulerCtrl.generateDailyReports(req, res));
router.post('/scheduler/triggers', authorize('Reports'), (req, res) => schedulerCtrl.executeTriggers(req, res));

// ---------------------------------------------------------
// 7. Notifications
// ---------------------------------------------------------
router.get('/notifications', (req, res) => notificationCtrl.getAll(req, res));
router.get('/notifications/unread-count', (req, res) => notificationCtrl.getUnreadCount(req, res));
router.patch('/notifications/read-all', (req, res) => notificationCtrl.markAllRead(req, res));
// ---------------------------------------------------------
// 8. Health Check & Metrics
// ---------------------------------------------------------
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

router.get('/metrics', async (req, res) => {
  try {
    const { register } = require('../metrics/prometheus');
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err: any) {
    res.status(500).end(err.message || err);
  }
});

// ---------------------------------------------------------
// 9. Sync Routes
// ---------------------------------------------------------
router.use('/sync', syncRoutes);

// ---------------------------------------------------------
// 10. Config / Masters
// ---------------------------------------------------------
router.use('/config', authenticate, authorize('Masters'), configRouter);

// ---------------------------------------------------------
// 11. Preventive Maintenance (PM)
// ---------------------------------------------------------
router.use('/pm', authenticate, authorize('PreventiveMaintenance'), pmRouter);
router.use('/masters', mastersRouter);  // Master Setup — auth handled inside mastersRouter

export default router;
