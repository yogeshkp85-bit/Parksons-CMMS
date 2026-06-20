import { Response } from 'express';
import prisma from '../utils/db';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth.types';

// Helper to format Date as dd/MM/yyyy
const formatDateString = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Helper to format Date to hh:mm a
const formatTimeString = (d: Date): string => {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // hour '0' should be '12'
  const hh = String(h).padStart(2, '0');
  return `${hh}:${m} ${ampm}`;
};

// Helper to convert Date to Mon-Yr format (e.g., Jun-26)
const formatMonthYear = (d: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = String(d.getFullYear()).substring(2);
  return `${month}-${year}`;
};

// Helper to resolve SubAssembly ID to Unit ID
const resolveUnitId = async (subAssemblyId: string | null | undefined): Promise<string | null> => {
  if (!subAssemblyId || subAssemblyId === '') return null;
  try {
    const subAssembly = await prisma.subAssembly.findUnique({
      where: { id: subAssemblyId },
      include: { machine: true }
    });
    if (subAssembly) {
      const unit = await prisma.unit.findFirst({
        where: {
          sectionId: subAssembly.machine.sectionId,
          name: subAssembly.name
        }
      });
      if (unit) {
        return unit.id;
      }
    }
  } catch (err) {
    logger.error(`Error resolving unit ID mapping: ${err}`);
  }
  return subAssemblyId;
};

// 1. CREATE BREAKDOWN LOG
export const createBreakdown = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userPayload = req.user;
    if (!userPayload) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
    }

    const {
      date,
      shiftId,
      machineId,
      unitId,
      problemCategoryId,
      categoryId,
      problemDescription,
      startTime,
      endTime,
      durationMin,
      remarks
    } = req.body;

    // Retrieve related models to get codes/names (for matching spreadsheet structures)
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: { section: { include: { department: true } } }
    });

    if (!machine) {
      return res.status(400).json({ status: 'error', message: 'Machine ID does not exist.' });
    }

    // Auto-generate Ref_ID: PKS-YYYYMMDD-HHMMSS
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    const refId = `PKS-${yyyy}${mm}${dd}-${hh}${min}${sec}`;

    const resolvedUnitId = await resolveUnitId(unitId);

    // Create Breakdown Log
    const newLog = await prisma.breakdownLog.create({
      data: {
        breakdownNumber: refId,
        plantId: machine.section.department.plantId,
        departmentId: machine.section.departmentId,
        sectionId: machine.sectionId,
        machineId: machineId,
        unitId: resolvedUnitId,
        date: new Date(date),
        shiftId: shiftId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        durationMin: durationMin || null,
        categoryId: categoryId,
        problemCategoryId: problemCategoryId,
        problemDescription: problemDescription,
        actionTakenDescription: req.body.actionTakenDescription || null,
        rootCauseDescription: req.body.rootCauseDescription || null,
        attendedBy: req.body.attendedBy || null,
        submittedBy: req.body.submittedBy || null,
        remarks: remarks || null,
        status: 'PENDING_REVIEW',
        createdByUserId: userPayload.id
      }
    });

    logger.info(`Breakdown logged successfully: ${refId} for machine ${machine.name}`);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: userPayload.id,
        module: 'Breakdown Management',
        action: 'CREATE',
        targetId: newLog.id,
        newValue: JSON.stringify({ refId, machine: machine.name, status: 'PENDING_REVIEW' }),
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Breakdown log created successfully and is pending review.',
      data: newLog
    });
  } catch (error: any) {
    logger.error(`Create breakdown error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to submit breakdown log.' });
  }
};

// 2. GET DASHBOARD DATA (APPROVED ONLY)
export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Fetch approved breakdowns
    const logs = await prisma.breakdownLog.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      include: {
        machine: { select: { id: true, name: true, machineId: true } },
        department: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true, code: true } },
        shift: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        problemCategory: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { date: 'asc' }
    });

    // 2. Fetch count of pending entries
    const pendingCount = await prisma.breakdownLog.count({
      where: { status: 'PENDING_REVIEW', deletedAt: null }
    });

    // 3. Map into the identical flat structure expected by the Dashboard UI
    const rows = logs.map((log) => {
      const logDate = new Date(log.date);
      return {
        refId: log.breakdownNumber,
        date: formatDateString(logDate),
        monthYear: formatMonthYear(logDate),
        shift: log.shift.name,
        machineType: log.department.code, // PRINTING, CORRUGATION, etc.
        machineName: log.machine.name,
        unit: log.unit?.name || '',
        problemType: log.problemCategory.name, // Electrical, Mechanical, etc.
        category: log.category.name, // Breakdown, Preventive, etc.
        description: log.problemDescription,
        actionTaken: log.actionTakenDescription || '',
        rootCause: log.rootCauseDescription || '',
        timeStart: formatTimeString(log.startTime),
        timeEnd: log.endTime ? formatTimeString(log.endTime) : '',
        minutes: log.durationMin || 0,
        availableMin: 44640, // 31 days * 24 hours * 60 minutes = 44,640 minutes standard availability
        attendedBy: log.attendedBy || log.createdBy.name
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        rows,
        pendingCount,
        generated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error(`Get dashboard data error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve dashboard data.' });
  }
};

// 3. GET PENDING REVIEWS
export const getPendingReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pendingLogs = await prisma.breakdownLog.findMany({
      where: { status: 'PENDING_REVIEW', deletedAt: null },
      include: {
        machine: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        problemCategory: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      data: pendingLogs
    });
  } catch (error: any) {
    logger.error(`Get pending reviews error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch review queue.' });
  }
};

// 4. APPROVE BREAKDOWN LOG
export const approveBreakdown = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userPayload = req.user;
    if (!userPayload) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
    }

    const { id } = req.params;
    const { actionTakenCategoryId, actionTakenDescription, rootCauseCategoryId, rootCauseDescription, remarks } = req.body;

    const existingLog = await prisma.breakdownLog.findUnique({ where: { id } });
    if (!existingLog) {
      return res.status(404).json({ status: 'error', message: 'Incident log not found.' });
    }

    const updatedLog = await prisma.breakdownLog.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedByUserId: userPayload.id,
        approvedAt: new Date(),
        actionTakenCategoryId: actionTakenCategoryId || null,
        actionTakenDescription: actionTakenDescription || null,
        rootCauseCategoryId: rootCauseCategoryId || null,
        rootCauseDescription: rootCauseDescription || null,
        remarks: remarks || existingLog.remarks
      }
    });

    logger.info(`Incident approved successfully: ${existingLog.breakdownNumber} by admin ${userPayload.email}`);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: userPayload.id,
        module: 'Breakdown Management',
        action: 'APPROVE',
        targetId: id,
        newValue: JSON.stringify({ refId: existingLog.breakdownNumber, status: 'APPROVED' }),
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Incident approved successfully.',
      data: updatedLog
    });
  } catch (error: any) {
    logger.error(`Approve breakdown error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to approve incident.' });
  }
};

// 5. REJECT BREAKDOWN LOG
export const rejectBreakdown = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userPayload = req.user;
    if (!userPayload) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
    }

    const { id } = req.params;
    const existingLog = await prisma.breakdownLog.findUnique({ where: { id } });
    if (!existingLog) {
      return res.status(404).json({ status: 'error', message: 'Incident log not found.' });
    }

    const updatedLog = await prisma.breakdownLog.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedByUserId: userPayload.id,
        approvedAt: new Date()
      }
    });

    logger.info(`Incident rejected successfully: ${existingLog.breakdownNumber} by admin ${userPayload.email}`);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: userPayload.id,
        module: 'Breakdown Management',
        action: 'REJECT',
        targetId: id,
        newValue: JSON.stringify({ refId: existingLog.breakdownNumber, status: 'REJECTED' }),
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Incident rejected successfully.',
      data: updatedLog
    });
  } catch (error: any) {
    logger.error(`Reject breakdown error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to reject incident.' });
  }
};

// 6. UPDATE BREAKDOWN LOG
export const updateBreakdown = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userPayload = req.user;
    if (!userPayload) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
    }

    const { id } = req.params;
    const existingLog = await prisma.breakdownLog.findUnique({ where: { id } });
    if (!existingLog) {
      return res.status(404).json({ status: 'error', message: 'Incident log not found.' });
    }

    let resolvedUnitId = existingLog.unitId;
    if (req.body.unitId !== undefined) {
      resolvedUnitId = await resolveUnitId(req.body.unitId);
    }

    const updatedLog = await prisma.breakdownLog.update({
      where: { id },
      data: {
        date: req.body.date ? new Date(req.body.date) : existingLog.date,
        shiftId: req.body.shiftId || existingLog.shiftId,
        machineId: req.body.machineId || existingLog.machineId,
        unitId: resolvedUnitId,
        problemCategoryId: req.body.problemCategoryId || existingLog.problemCategoryId,
        categoryId: req.body.categoryId || existingLog.categoryId,
        problemDescription: req.body.problemDescription || existingLog.problemDescription,
        actionTakenCategoryId: req.body.actionTakenCategoryId !== undefined ? req.body.actionTakenCategoryId : existingLog.actionTakenCategoryId,
        actionTakenDescription: req.body.actionTakenDescription !== undefined ? req.body.actionTakenDescription : existingLog.actionTakenDescription,
        rootCauseCategoryId: req.body.rootCauseCategoryId !== undefined ? req.body.rootCauseCategoryId : existingLog.rootCauseCategoryId,
        rootCauseDescription: req.body.rootCauseDescription !== undefined ? req.body.rootCauseDescription : existingLog.rootCauseDescription,
        startTime: req.body.startTime ? new Date(req.body.startTime) : existingLog.startTime,
        endTime: req.body.endTime !== undefined ? (req.body.endTime ? new Date(req.body.endTime) : null) : existingLog.endTime,
        durationMin: req.body.durationMin !== undefined ? req.body.durationMin : existingLog.durationMin,
        remarks: req.body.remarks !== undefined ? req.body.remarks : existingLog.remarks,
        attendedBy: req.body.attendedBy !== undefined ? req.body.attendedBy : existingLog.attendedBy,
        submittedBy: req.body.submittedBy !== undefined ? req.body.submittedBy : existingLog.submittedBy
      }
    });

    logger.info(`Incident updated successfully: ${existingLog.breakdownNumber}`);

    return res.status(200).json({
      status: 'success',
      message: 'Incident updated successfully.',
      data: updatedLog
    });
  } catch (error: any) {
    logger.error(`Update breakdown error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to update incident.' });
  }
};

// 7. EXPORT DATABASE AS CSV FILE
export const exportBreakdownsCSV = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.breakdownLog.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      include: {
        machine: { select: { name: true } },
        department: { select: { code: true } },
        unit: { select: { name: true } },
        shift: { select: { name: true } },
        category: { select: { name: true } },
        problemCategory: { select: { name: true } },
        createdBy: { select: { name: true } }
      },
      orderBy: { date: 'asc' }
    });

    const headers = [
      'Timestamp',
      'Ref_ID',
      'Date',
      'Shift',
      'Machine_Type',
      'Machine_Name',
      'Unit',
      'Problem_Type',
      'Category',
      'Description',
      'Action_Taken',
      'Root_Cause',
      'Time_Start',
      'Time_End',
      'Duration_Min',
      'Attended_By',
      'Remarks',
      'Status'
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        `"${log.createdAt.toISOString()}"`,
        `"${log.breakdownNumber}"`,
        `"${formatDateString(new Date(log.date))}"`,
        `"${log.shift.name}"`,
        `"${log.department.code}"`,
        `"${log.machine.name}"`,
        `"${log.unit?.name || ''}"`,
        `"${log.problemCategory.name}"`,
        `"${log.category.name}"`,
        `"${(log.problemDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(log.actionTakenDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(log.rootCauseDescription || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${formatTimeString(log.startTime)}"`,
        `"${log.endTime ? formatTimeString(log.endTime) : ''}"`,
        `"${log.durationMin || 0}"`,
        `"${log.attendedBy || log.createdBy.name}"`,
        `"${(log.remarks || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${log.status}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const filename = `raw_data_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvString);
  } catch (error: any) {
    logger.error(`CSV export error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to export CSV dataset.' });
  }
};

// 8. GET MASTER DATA FOR FORM SELECTS
export const getBreakdownMasterData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shifts = await prisma.shiftMaster.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    });
    const problemCategories = await prisma.problemCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    const categories = await prisma.breakdownCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    });
    const machines = await prisma.machine.findMany({
      where: { isActive: true },
      include: {
        subAssemblies: {
          where: { isActive: true },
          select: { id: true, name: true }
        },
        section: {
          select: { departmentId: true }
        }
      }
    });
    const actionTakenCategories = await prisma.actionTakenCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    const rootCauseCategories = await prisma.rootCauseCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        shifts,
        problemCategories,
        categories,
        departments,
        machines: machines.map(m => ({
          id: m.id,
          name: m.name,
          machineId: m.machineId,
          departmentId: m.section.departmentId,
          subAssemblies: m.subAssemblies
        })),
        actionTakenCategories,
        rootCauseCategories,
        technicians: [
          "Ashish","Shivaji","Sandip","Sharad","Vikas","Ravi",
          "Sachine","Krishna","Dattaram","Akshay","PM team",
          "Baba","Sangram","Ramdas","Chandan","YogeshK",
          "GaneshS","KedarP","YogeshP","Supervisor"
        ]
      }
    });
  } catch (error: any) {
    logger.error(`Fetch master data error: ${error.stack}`);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve breakdown form master lists.' });
  }
};
