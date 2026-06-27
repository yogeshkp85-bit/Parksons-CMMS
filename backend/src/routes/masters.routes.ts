/**
 * masters.routes.ts
 * All Master Setup API routes.
 * Protected by authenticate middleware.
 * Write operations (POST/PUT/DELETE) require Masters permission.
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import {
  listMaster, getMaster, createMaster, updateMaster,
  deleteMaster, restoreMaster,
  getMachineHierarchy, getTechnicianList, getFinancialYearList,
} from '../controllers/masters/masters.controller';

const router = Router();
router.use(authenticate);

// ── SPECIAL READ ENDPOINTS (used by Breakdown form + Dashboard) ─────────
router.get('/machines/hierarchy',      getMachineHierarchy);   // GET /masters/machines/hierarchy
router.get('/technicians/list',        getTechnicianList);      // GET /masters/technicians/list
router.get('/financial-years/list',    getFinancialYearList);   // GET /masters/financial-years/list

// ── GENERIC CRUD ENDPOINTS ────────────────────────────────────────────────
// GET    /masters/:model           → list all
// GET    /masters/:model/:id       → get one
// POST   /masters/:model           → create (requires Masters permission)
// PUT    /masters/:model/:id       → update (requires Masters permission)
// DELETE /masters/:model/:id       → soft delete (requires Masters permission)
// PUT    /masters/:model/:id/restore → restore (requires Masters permission)

router.get('/:model',              listMaster);
router.get('/:model/:id',          getMaster);
router.post('/:model',             requirePermission('Masters'), createMaster);
router.put('/:model/:id/restore',  requirePermission('Masters'), restoreMaster);
router.put('/:model/:id',          requirePermission('Masters'), updateMaster);
router.delete('/:model/:id',       requirePermission('Masters'), deleteMaster);

export default router;
