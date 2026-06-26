/**
 * dailyReportJob.ts
 * Sends the daily maintenance summary email at 9:00 AM IST every day.
 * Replicates the GAS sendDailyEmailReport() function.
 *
 * Registered in server.ts on startup.
 */

import cron from 'node-cron';
import logger from '../utils/logger';
import { sendEmail, getReportRecipients } from '../services/email.service';
import { SchedulerService } from '../services/SchedulerService';

const schedulerService = new SchedulerService();

/** Build and send the daily report email. Called by cron and by the manual trigger API. */
export async function sendDailyReport(): Promise<{ success: boolean; error?: string }> {
  logger.info('[DailyReportJob] Generating daily maintenance report...');
  try {
    const report = await schedulerService.generateDailyReports();
    const recipients = getReportRecipients();

    const sent = await sendEmail({
      to: recipients,
      subject: report.subject,
      html: report.htmlBody,
    });

    if (sent) {
      logger.info(`[DailyReportJob] Report sent to: ${recipients.join(', ')}`);
      return { success: true };
    } else {
      return { success: false, error: 'Email transport failed — check SMTP config in .env' };
    }
  } catch (err: any) {
    logger.error('[DailyReportJob] Failed to generate/send daily report:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Register the 9AM IST daily cron job.
 * Called once in server.ts after the HTTP server starts.
 */
export function registerDailyReportJob(): void {
  // "0 9 * * *" = 09:00 every day, Asia/Kolkata timezone
  cron.schedule('0 9 * * *', async () => {
    logger.info('[DailyReportJob] 9AM IST trigger fired');
    await sendDailyReport();
  }, {
    timezone: 'Asia/Kolkata'
  });

  logger.info('[DailyReportJob] Scheduled daily report email at 9:00 AM IST');
}
