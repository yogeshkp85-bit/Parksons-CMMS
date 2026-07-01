import { ReportRepository } from '../repositories/ReportRepository';
import { BreakdownRepository } from '../repositories/BreakdownRepository';

const reportRepo = new ReportRepository();
const breakdownRepo = new BreakdownRepository();

export class SchedulerService {
  /**
   * Replaces `sendDailyEmailReport()` from Code.gs.
   * GAS logic: Reconstructs Dashboard data, filters for yesterday, calculates MTTR/Tot, and builds HTML string.
   */
  async generateDailyReports() {
    // 1. Reconstruct getDashboardData() fetching logic for the report
    const rawData = await reportRepo.getFinalData();
    const statusMap = await breakdownRepo.getStatusMap();
    const hasStatusMap = Object.keys(statusMap).length > 0;

    const rows = rawData.filter((row: any) => {
      const mn = String(row.machineName || '').trim();
      const refId = String(row.refId || '').trim();
      if (!mn && !refId) return false;
      if (hasStatusMap && refId) {
        const entryStatus = statusMap[refId];
        if (entryStatus === 'PENDING_REVIEW' || entryStatus === 'REJECTED') return false;
      }
      return true;
    });

    // 2. Exact GAS date generation logic
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    
    // Mimic Utilities.formatDate(yest, CONFIG.timezone, 'dd/MM/yyyy')
    const pad = (n: number) => String(n).padStart(2, '0');
    const yStr = `${pad(yest.getDate())}/${pad(yest.getMonth() + 1)}/${yest.getFullYear()}`;
    
    // 3. Exact GAS KPI calculation logic
    const yRows = rows.filter((r: any) => r.date === yStr);
    const bdRows = yRows.filter((r: any) => r.category === 'Breakdown');
    
    const tot = yRows.reduce((s: number, r: any) => s + (r.minutes || 0), 0);
    const mttr = bdRows.length > 0 ? Math.round(bdRows.reduce((s: number, r: any) => s + (r.minutes || 0), 0) / bdRows.length) : 0;

    // 4. Exact HTML string construction from Code.gs
    const subj = `Parksons Packaging Ltd - Daily Maintenance Report - ${yest.toDateString()}`;
    const body = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
        <div style="background:#0a0d13;color:#f0a500;padding:22px 24px">
          <h2 style="margin:0;font-size:20px;letter-spacing:2px">PARKSONS MAINTENANCE REPORT</h2>
        </div>
        <div style="background:#fff;padding:22px 24px;border:1px solid #e0e0e0;border-top:none">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr>
              <td style="background:#f9f9f9;padding:12px;border:1px solid #eee;font-size:12px;color:#666">Total Entries</td>
              <td style="padding:12px;border:1px solid #eee;font-weight:bold;font-size:18px;color:#2d7bf4">${yRows.length}</td>
              <td style="background:#f9f9f9;padding:12px;border:1px solid #eee;font-size:12px;color:#666">Breakdowns</td>
              <td style="padding:12px;border:1px solid #eee;font-weight:bold;font-size:18px;color:#e84040">${bdRows.length}</td>
            </tr>
            <tr>
              <td style="background:#f9f9f9;padding:12px;border:1px solid #eee;font-size:12px;color:#666">Total Downtime</td>
              <td style="padding:12px;border:1px solid #eee;font-weight:bold;font-size:18px">${(tot/60).toFixed(1)} hrs</td>
              <td style="background:#f9f9f9;padding:12px;border:1px solid #eee;font-size:12px;color:#666">Avg MTTR</td>
              <td style="padding:12px;border:1px solid #eee;font-weight:bold;font-size:18px;color:#f0a500">${mttr} min</td>
            </tr>
          </table>
        </div>
      </div>
    `;

    return {
      to: 'yogeshkp85@gmail.com', // CONFIG.emailTo
      subject: subj,
      htmlBody: body
    };
  }

  /**
   * Replaces the GAS execution trigger function mappings
   */
  async executeTriggerJobs() {
    return await this.generateDailyReports();
  }

  /**
   * Main entry point for cron-like scheduling orchestration
   */
  async runScheduledJobs() {
    return await this.executeTriggerJobs();
  }

  /**
   * Automatically generate PM Schedules for the next 30 days for all active tasks.
   */
  async autoGeneratePMSchedules() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const activeTasks = await prisma.pmTask.findMany({
        where: { isActive: true, deletedAt: null },
        include: { frequency: true }
      });

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let createdCount = 0;

      for (const task of activeTasks) {
        if (!task.frequency) continue;

        const machines = await prisma.machine.findMany({
          where: task.machineCategoryId ? { machineCategoryId: task.machineCategoryId } : {}
        });

        for (const machine of machines) {
          // Check the latest schedule for this machine & task
          const latestSchedule = await prisma.pmSchedule.findFirst({
            where: { pmTaskId: task.id, machineId: machine.id },
            orderBy: { dueDate: 'desc' }
          });

          let nextDueDate = new Date(now);
          if (latestSchedule) {
            nextDueDate = new Date(latestSchedule.dueDate);
            nextDueDate.setDate(nextDueDate.getDate() + task.frequency.intervalDays);
          } else {
            // If no previous schedule, start from today + interval
            nextDueDate.setDate(nextDueDate.getDate() + task.frequency.intervalDays);
          }

          // Generate schedules up to 30 days in advance
          while (nextDueDate <= thirtyDaysFromNow) {
            // Check if it already exists to avoid duplicates (just in case)
            const exists = await prisma.pmSchedule.findFirst({
              where: {
                pmTaskId: task.id,
                machineId: machine.id,
                dueDate: {
                  gte: new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate()),
                  lt: new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate() + 1)
                }
              }
            });

            if (!exists) {
              await prisma.pmSchedule.create({
                data: {
                  machineId: machine.id,
                  pmTaskId: task.id,
                  dueDate: new Date(nextDueDate),
                  status: 'PENDING'
                }
              });
              createdCount++;
            }
            nextDueDate.setDate(nextDueDate.getDate() + task.frequency.intervalDays);
          }
        }
      }
      console.log(`Auto-generated ${createdCount} PM schedules.`);
      return { success: true, createdCount };
    } catch (err) {
      console.error('Error auto-generating PM schedules', err);
      throw err;
    } finally {
      await prisma.$disconnect();
    }
  }
}
