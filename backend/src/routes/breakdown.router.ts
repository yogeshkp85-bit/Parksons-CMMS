import { Router } from 'express';
import { 
  createBreakdown, 
  getDashboardData, 
  getPendingReviews, 
  approveBreakdown, 
  rejectBreakdown, 
  updateBreakdown, 
  exportBreakdownsCSV,
  getBreakdownMasterData
} from '../controllers/breakdown.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validateBody } from '../validators/auth.validator';
import { 
  createBreakdownSchema, 
  approveBreakdownSchema, 
  updateBreakdownSchema 
} from '../validators/breakdown.validator';

const breakdownRouter = Router();

// Master options data list
breakdownRouter.get('/master-data', authenticate, getBreakdownMasterData);

// 1. Submit a breakdown log
breakdownRouter.post(
  '/', 
  authenticate, 
  authorize('BREAKDOWN_CREATE'), 
  validateBody(createBreakdownSchema), 
  createBreakdown
);

// 2. Fetch approved breakdowns for analytics dashboard
breakdownRouter.get(
  '/dashboard', 
  authenticate, 
  authorize('DASHBOARD_VIEW'), 
  getDashboardData
);

// 3. Fetch pending breakdowns for admin review queue
breakdownRouter.get(
  '/pending', 
  authenticate, 
  authorize('BREAKDOWN_REVIEW'), 
  getPendingReviews
);

// 4. Approve an entry (sets status to APPROVED and records root cause / actions taken)
breakdownRouter.post(
  '/:id/approve', 
  authenticate, 
  authorize('BREAKDOWN_APPROVE'), 
  validateBody(approveBreakdownSchema), 
  approveBreakdown
);

// 5. Reject an entry (sets status to REJECTED)
breakdownRouter.post(
  '/:id/reject', 
  authenticate, 
  authorize('BREAKDOWN_APPROVE'), 
  rejectBreakdown
);

// 6. Update/Edit a breakdown log details
breakdownRouter.put(
  '/:id', 
  authenticate, 
  authorize('BREAKDOWN_REVIEW'), 
  validateBody(updateBreakdownSchema), 
  updateBreakdown
);

// 7. Export all approved breakdowns in CSV format
breakdownRouter.get(
  '/export', 
  authenticate, 
  authorize('REPORTS_EXPORT'), 
  exportBreakdownsCSV
);

export default breakdownRouter;
