import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

// Hardcoded values discovered from Form.html legacy Apps Script
const CATEGORIES = [
  'Breakdown',
  'Preventive Maintenance',
  'Project / Modification',
  'Facility',
  'Safety',
  '5S / Cleaning',
  'Other'
];

const PROBLEM_TYPES = [
  'Mechanical',
  'Electrical',
  'Electronic',
  'Pneumatic',
  'Hydraulic',
  'Software/PLC',
  'Operational Error',
  'Utility Failure',
  'Other'
];

const SHIFTS = [
  'Shift 1 (07:00-15:00)',
  'Shift 2 (15:00-23:00)',
  'Shift 3 (23:00-07:00)',
  'General Shift'
];

export async function seedMasterData() {
  logger.info('[Seed] Starting seeding of static Master Data (Categories, Problem Types, Shifts)...');
  
  try {
    let catCount = 0;
    for (const cat of CATEGORIES) {
      await prisma.breakdownCategory.upsert({
        where: { name: cat },
        update: {},
        create: { name: cat }
      });
      catCount++;
    }
    logger.info(`[Seed] Seeded ${catCount} BreakdownCategories.`);

    let probCount = 0;
    for (const prob of PROBLEM_TYPES) {
      await prisma.problemCategory.upsert({
        where: { name: prob },
        update: {},
        create: { name: prob }
      });
      probCount++;
    }
    logger.info(`[Seed] Seeded ${probCount} ProblemCategories.`);

    let shiftCount = 0;
    for (const shift of SHIFTS) {
      const shiftCode = shift.replace(/[^A-Z0-9]/ig, '').toUpperCase().substring(0, 10);
      await prisma.shiftMaster.upsert({
        where: { code: shiftCode },
        update: { name: shift },
        create: { name: shift, code: shiftCode, startTime: "00:00", endTime: "00:00" }
      });
      shiftCount++;
    }
    logger.info(`[Seed] Seeded ${shiftCount} ShiftMasters.`);

    return {
      status: 'success',
      categories: catCount,
      problemTypes: probCount,
      shifts: shiftCount
    };
  } catch (error: any) {
    logger.error(`[Seed] Failed to seed master data: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
