import prisma from '../utils/db';

export class BreakdownRepository {
  /**
   * Replaces getting all rows from 'Raw_Data' and mapping them to objects.
   * GAS Mapping: Maps the `sheet.getRange().getValues()` portion of `getPendingEntries()`.
   */
  async getAll() {
    const data = await prisma.rawData.findMany({
      orderBy: { Timestamp: 'asc' }
    });

    // Transformation Layer: Adapts Prisma Schema to the exact GAS JSON contract
    return data.map((row, index) => ({
      rowNum: index + 2, // Emulating sheet row behavior for legacy compatibility
      refId: row.Ref_ID || '',
      timestamp: row.Timestamp ? row.Timestamp.toISOString() : '',
      date: row.Date || '',
      shift: row.Shift || '',
      machineType: row.Machine_Type || '',
      machineName: row.Machine_Name || '',
      unit: row.Unit || '',
      problemType: row.Problem_Type || '',
      category: row.Category || '',
      description: row.Description || '',
      actionTaken: row.Action_Taken || '',
      rootCause: row.Root_Cause || '',
      timeStart: row.Time_Start || '',
      timeEnd: row.Time_End || '',
      duration: row.Duration_Min ? String(row.Duration_Min) : '',
      attendedBy: row.Attended_By || '',
      submittedBy: row.Submitted_By || '',
      remarks: row.Remarks || '',
      problemReported: row.Problem_Reported || '',
      spareConsumed: row.Spare_Consumed || '',
      additionalTeam: row.Additional_Team || '',
      status: row.Status || 'PENDING_REVIEW'
    }));
  }

  /**
   * Replaces `sheet.appendRow()` in `writeFormSubmission()`.
   * GAS Mapping: Writes a new row to 'Raw_Data'.
   */
  async create(data: any) {
    return await prisma.rawData.create({
      data: {
        Timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        Ref_ID: data.refId,
        Date: data.date,
        Shift: data.shift,
        Machine_Type: data.machineType,
        Machine_Name: data.machineName,
        Unit: data.unit,
        Problem_Type: data.problemType,
        Category: data.category,
        Description: data.description,
        Action_Taken: data.actionTaken,
        Root_Cause: data.rootCause,
        Time_Start: data.timeStart,
        Time_End: data.timeEnd,
        Duration_Min: data.durationMin ? parseFloat(data.durationMin) : null,
        Attended_By: data.attendedBy,
        Submitted_By: data.submittedBy,
        Remarks: data.remarks,
        Problem_Reported: data.problemReported,
        Spare_Consumed: data.spareConsumed,
        Additional_Team: data.additionalTeam,
        Status: 'PENDING_REVIEW'
      }
    });
  }

  /**
   * Replaces `writeEdits(sheet, rowNum, data)` in `updateEntry()` and `updateAndApprove()`.
   * GAS Mapping: Updates specific columns of an existing row in 'Raw_Data'.
   */
  async update(refId: string, data: any) {
    // Only update fields that are provided in the data payload
    const updatePayload: any = {};
    if (data.date !== undefined) updatePayload.Date = data.date;
    if (data.shift !== undefined) updatePayload.Shift = data.shift;
    if (data.machineType !== undefined) updatePayload.Machine_Type = data.machineType;
    if (data.machineName !== undefined) updatePayload.Machine_Name = data.machineName;
    if (data.unit !== undefined) updatePayload.Unit = data.unit;
    if (data.problemType !== undefined) updatePayload.Problem_Type = data.problemType;
    if (data.category !== undefined) updatePayload.Category = data.category;
    if (data.description !== undefined) updatePayload.Description = data.description;
    if (data.actionTaken !== undefined) updatePayload.Action_Taken = data.actionTaken;
    if (data.rootCause !== undefined) updatePayload.Root_Cause = data.rootCause;
    if (data.timeStart !== undefined) updatePayload.Time_Start = data.timeStart;
    if (data.timeEnd !== undefined) updatePayload.Time_End = data.timeEnd;
    if (data.duration !== undefined) updatePayload.Duration_Min = parseFloat(data.duration);
    if (data.attendedBy !== undefined) updatePayload.Attended_By = data.attendedBy;
    if (data.remarks !== undefined) updatePayload.Remarks = data.remarks;
    if (data.problemReported !== undefined) updatePayload.Problem_Reported = data.problemReported;
    if (data.spareConsumed !== undefined) updatePayload.Spare_Consumed = data.spareConsumed;
    if (data.additionalTeam !== undefined) updatePayload.Additional_Team = data.additionalTeam;

    return await prisma.rawData.update({
      where: { Ref_ID: refId },
      data: updatePayload
    });
  }

  /**
   * Replaces `sheet.getRange(rowNum, COL.STATUS + 1).setValue(statusValue)` in `setStatus()`.
   * GAS Mapping: Updates only the status column in 'Raw_Data'.
   */
  async updateStatus(refId: string, status: string) {
    return await prisma.rawData.update({
      where: { Ref_ID: refId },
      data: { Status: status }
    });
  }

  /**
   * Replaces `buildStatusMap()`.
   * GAS Mapping: Returns an object mapping Ref_ID to Status.
   */
  async getStatusMap(): Promise<Record<string, string>> {
    const data = await prisma.rawData.findMany({
      select: { Ref_ID: true, Status: true }
    });

    const map: Record<string, string> = {};
    data.forEach(row => {
      if (row.Ref_ID) {
        map[row.Ref_ID] = row.Status || 'PENDING_REVIEW';
      }
    });
    return map;
  }
}
