import { z } from 'zod';

// Zod schema to validate new breakdown entries
export const createBreakdownSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format.'
  }),
  shiftId: z.string().uuid({ message: 'Invalid Shift ID format.' }),
  machineId: z.string().uuid({ message: 'Invalid Machine ID format.' }),
  unitId: z.string().uuid({ message: 'Invalid Unit ID format.' }).optional().nullable(),
  problemCategoryId: z.string().uuid({ message: 'Invalid Problem Category ID format.' }),
  categoryId: z.string().uuid({ message: 'Invalid Breakdown Category ID format.' }),
  problemDescription: z.string().min(3, {
    message: 'Problem description must be at least 3 characters long.'
  }),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start time date format.'
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end time date format.'
  }).optional().nullable(),
  durationMin: z.number().int().nonnegative().optional().nullable(),
  remarks: z.string().optional().nullable(),
  attendedBy: z.string().optional().nullable(),
  submittedBy: z.string().optional().nullable(),
  actionTakenDescription: z.string().optional().nullable(),
  rootCauseDescription: z.string().optional().nullable()
});

// Zod schema to validate entry approvals
export const approveBreakdownSchema = z.object({
  actionTakenCategoryId: z.string().uuid({ message: 'Invalid Action Taken Category ID.' }).optional().nullable(),
  actionTakenDescription: z.string().optional().nullable(),
  rootCauseCategoryId: z.string().uuid({ message: 'Invalid Root Cause Category ID.' }).optional().nullable(),
  rootCauseDescription: z.string().optional().nullable(),
  remarks: z.string().optional().nullable()
});

// Zod schema to validate entry updates
export const updateBreakdownSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format.'
  }).optional(),
  shiftId: z.string().uuid({ message: 'Invalid Shift ID format.' }).optional(),
  machineId: z.string().uuid({ message: 'Invalid Machine ID format.' }).optional(),
  unitId: z.string().uuid({ message: 'Invalid Unit ID format.' }).optional().nullable(),
  problemCategoryId: z.string().uuid({ message: 'Invalid Problem Category ID format.' }).optional(),
  categoryId: z.string().uuid({ message: 'Invalid Breakdown Category ID format.' }).optional(),
  problemDescription: z.string().min(3).optional(),
  actionTakenCategoryId: z.string().uuid().optional().nullable(),
  actionTakenDescription: z.string().optional().nullable(),
  rootCauseCategoryId: z.string().uuid().optional().nullable(),
  rootCauseDescription: z.string().optional().nullable(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val))).optional().nullable(),
  durationMin: z.number().int().nonnegative().optional().nullable(),
  remarks: z.string().optional().nullable(),
  attendedBy: z.string().optional().nullable(),
  submittedBy: z.string().optional().nullable()
});
