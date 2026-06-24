import { BreakdownRepository } from '../repositories/BreakdownRepository';

const breakdownRepo = new BreakdownRepository();

export class ApprovalService {
  /**
   * Replaces `getPendingEntries()` from Code.gs, specifically scoped for approval workflows.
   * GAS logic: Iterates over raw data, matches PENDING_REVIEW, and counts totals.
   */
  async getPendingApprovals() {
    const all = await breakdownRepo.getAll();
    const pending = all.filter((e: any) => e.status === 'PENDING_REVIEW');
    
    return {
      status: 'success',
      all: all,
      pendingCount: pending.length,
      totalCount: all.length
    };
  }

  /**
   * Replaces the shared `setStatus(data, statusValue)` logic from Code.gs.
   * GAS logic: Changes the status column while preserving all other data.
   */
  async updateApprovalStatus(data: any, statusValue: string) {
    if (!data.refId) {
      // Replicate GAS behavior which relied on rowNum, adapted to refId
      return { status: 'error', message: 'Invalid row' };
    }
    
    await breakdownRepo.updateStatus(data.refId, statusValue);
    
    return {
      status: 'success',
      message: statusValue,
      refId: data.refId
    };
  }

  /**
   * Replaces `approveEntry(data)` from Code.gs.
   * GAS logic: Hardcodes 'APPROVED' status value.
   */
  async approveEntry(data: any) {
    return await this.updateApprovalStatus(data, 'APPROVED');
  }

  /**
   * Replaces `rejectEntry(data)` from Code.gs.
   * GAS logic: Hardcodes 'REJECTED' status value.
   */
  async rejectEntry(data: any) {
    return await this.updateApprovalStatus(data, 'REJECTED');
  }
}
