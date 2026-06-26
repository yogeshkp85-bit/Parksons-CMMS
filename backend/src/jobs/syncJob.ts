/**
 * syncJob.ts
 * Scheduled Google Sheets → PostgreSQL synchronisation job.
 *
 * Runs every SYNC_INTERVAL_HOURS (default 4) hours.
 * Syncs: Raw_Data → BreakdownLog, Final_Data → FinalData, KPI data.
 * The original GAS system is READ-ONLY from this side — nothing is written back.
 *
 * Registered in server.ts on startup.
 */

import cron from 'node-cron';
import logger from '../utils/logger';
import { RawDataSyncService } from '../integrations/google/raw-data.sync';
import { FinalDataSyncService } from '../integrations/google/final-data.sync';
import { KpiSyncService } from '../integrations/google/kpi.sync';

const rawDataSync = new RawDataSyncService();
const finalDataSync = new FinalDataSyncService();
const kpiSync = new KpiSyncService();

/**
 * Run the full sync pipeline once.
 * Called both by the cron schedule and on-demand from the sync route.
 */
export async function runGoogleSheetSync(): Promise<{
  success: boolean;
  rawData?: any;
  finalData?: any;
  kpi?: any;
  error?: string;
}> {
  logger.info('[SyncJob] Starting scheduled Google Sheets sync...');
  try {
    const [rawResult, finalResult, kpiResult] = await Promise.allSettled([
      rawDataSync.syncRawData(),
      finalDataSync.syncFinalData(),
      kpiSync.syncKpi(),
    ]);

    const summary = {
      rawData:   rawResult.status   === 'fulfilled' ? rawResult.value   : { error: (rawResult as any).reason?.message },
      finalData: finalResult.status === 'fulfilled' ? finalResult.value : { error: (finalResult as any).reason?.message },
      kpi:       kpiResult.status   === 'fulfilled' ? kpiResult.value   : { error: (kpiResult as any).reason?.message },
    };

    logger.info('[SyncJob] Sync complete', summary);
    return { success: true, ...summary };
  } catch (err: any) {
    logger.error('[SyncJob] Unexpected sync failure:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Register the cron schedule.
 * Called once in server.ts after the HTTP server starts.
 *
 * SYNC_INTERVAL_HOURS env var: 1 | 2 | 4 | 6 | 8 | 12 | 24
 * Defaults to 4 hours if not set or if value is invalid.
 */
export function registerSyncJob(): void {
  const intervalHours = parseInt(process.env.SYNC_INTERVAL_HOURS || '4', 10);
  const validIntervals = [1, 2, 3, 4, 6, 8, 12, 24];
  const hours = validIntervals.includes(intervalHours) ? intervalHours : 4;

  // Cron expression: run at minute 0, every N hours
  // e.g. hours=4 → "0 */4 * * *"  (midnight, 4AM, 8AM, 12PM, 4PM, 8PM IST)
  const cronExpr = `0 */${hours} * * *`;

  logger.info(`[SyncJob] Scheduled Google Sheets sync every ${hours} hour(s) — cron: "${cronExpr}"`);

  cron.schedule(cronExpr, async () => {
    logger.info('[SyncJob] Cron trigger fired');
    await runGoogleSheetSync();
  }, {
    timezone: 'Asia/Kolkata'   // IST — ensures 4-hourly runs align to IST midnight
  });
}
