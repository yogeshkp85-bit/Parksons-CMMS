import { BreakdownRepository } from '../repositories/BreakdownRepository';

const breakdownRepo = new BreakdownRepository();

export class BreakdownService {
  /**
   * Replaces `getPendingEntries()` from Code.gs.
   * GAS logic: Fetches all entries, filters for 'PENDING_REVIEW', and returns counts.
   */
  async getPendingLogs() {
    // 1. Fetch raw data entirely through the Repository (No Prisma knowledge)
    const all = await breakdownRepo.getAll();
    
    // 2. Execute the exact GAS business logic (filter by status)
    const pending = all.filter((e: any) => e.status === 'PENDING_REVIEW');
    
    // 3. Return identical GAS JSON structure
    return {
      status: 'success',
      all: all,
      pendingCount: pending.length,
      totalCount: all.length
    };
  }

  /**
   * Replaces `writeFormSubmission(data)` from Code.gs.
   * GAS logic: Generates a unique PKS- RefID using Asia/Kolkata timezone if absent, and writes data.
   */
  async createLog(data: any) {
    const now = new Date();
    let refId = data.refId;

    // Normalize incoming mobile payload contract
    if (data.categoryName && !data.category) data.category = data.categoryName;
    if (data.problemTypeName && !data.problemType) data.problemType = data.problemTypeName;
    if (data.startTime && !data.timeStart) data.timeStart = data.startTime;
    if (!data.timeStart) data.timeStart = now.toISOString();

    if (!refId) {
      // Replicate `Utilities.formatDate(now, 'Asia/Kolkata', 'yyyyMMdd')` and `HHmmss`
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const getP = (type: string) => parts.find(p => p.type === type)?.value;
      
      refId = `PKS-${getP('year')}${getP('month')}${getP('day')}-${getP('hour')}${getP('minute')}${getP('second')}`;
    }

    data.refId = refId;
    data.timestamp = now.toISOString(); // Pass to repository for safe DB storage

    // Delegate database storage entirely to repository
    await breakdownRepo.create(data);

    // GAS writeFormSubmission strictly returns { refId }
    return { refId: refId };
  }

  /**
   * Replaces `updateEntry(data)` from Code.gs.
   * GAS logic: Writes edits and returns 'Saved (still pending)'.
   */
  async updateLog(data: any) {
    if (!data.refId) {
      return { status: 'error', message: 'Missing refId' };
    }

    // Delegate update storage entirely to repository
    await breakdownRepo.update(data.refId, data);

    // Identical GAS return structure
    return {
      status: 'success',
      message: 'Saved (still pending)',
      refId: data.refId
    };
  }
}
