import prisma from '../../src/utils/db';
import { 
  notifyBreakdownCreated, 
  notifyBreakdownApproved, 
  notifyBreakdownRejected, 
  NotificationType 
} from '../../src/services/socket.service';

describe('Notification Service Persistence Unit Tests', () => {
  const supervisorEmail = 'supervisor@test.com';
  const technicianEmail = 'technician@test.com';

  beforeAll(async () => {
    // Ensure clean state
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userEmail: supervisorEmail },
          { userEmail: technicianEmail }
        ]
      }
    });

    // Retrieve existing roles instead of upserting new ones to prevent unique constraint failures on 'name'
    let supervisorRole = await prisma.role.findUnique({ where: { code: 'supervisor' } });
    if (!supervisorRole) {
      supervisorRole = await prisma.role.findFirst({ where: { name: { equals: 'Supervisor', mode: 'insensitive' } } });
    }
    if (!supervisorRole) {
      supervisorRole = await prisma.role.create({
        data: { name: 'Supervisor Unit Test Role', code: 'supervisor', description: 'Supervisor role' }
      });
    }

    let technicianRole = await prisma.role.findUnique({ where: { code: 'technician' } });
    if (!technicianRole) {
      technicianRole = await prisma.role.findFirst({ where: { name: { equals: 'Technician', mode: 'insensitive' } } });
    }
    if (!technicianRole) {
      technicianRole = await prisma.role.create({
        data: { name: 'Technician Unit Test Role', code: 'technician', description: 'Technician role' }
      });
    }

    // Ensure users exist in users table
    await prisma.user.upsert({
      where: { email: supervisorEmail },
      update: { roleId: supervisorRole.id },
      create: { name: 'Supervisor Unit Test', email: supervisorEmail, passwordHash: 'hashed', roleId: supervisorRole.id }
    });

    await prisma.user.upsert({
      where: { email: technicianEmail },
      update: { roleId: technicianRole.id },
      create: { name: 'Technician Unit Test', email: technicianEmail, passwordHash: 'hashed', roleId: technicianRole.id }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userEmail: supervisorEmail },
          { userEmail: technicianEmail }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: [supervisorEmail, technicianEmail] }
      }
    });
    await prisma.$disconnect();
  });

  it('notifyBreakdownCreated should persist a notification for supervisors', async () => {
    const refId = `PKS-UNIT-${Date.now()}`;
    const payload = {
      type: NotificationType.BREAKDOWN_CREATED,
      title: 'New Breakdown Reported',
      message: 'TestMachineX — Feeder failure',
      refId,
      machine: 'TestMachineX',
      timestamp: new Date().toISOString()
    };

    await notifyBreakdownCreated(payload);

    // Retrieve notifications persisted for supervisor
    const notifs = await prisma.notification.findMany({
      where: { refId, userEmail: supervisorEmail }
    });

    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].type).toBe(NotificationType.BREAKDOWN_CREATED);
    expect(notifs[0].title).toBe('New Breakdown Reported');
    expect(notifs[0].message).toBe('TestMachineX — Feeder failure');
    expect(notifs[0].machine).toBe('TestMachineX');
  });

  it('notifyBreakdownApproved should persist an approval notification for the technician', async () => {
    const refId = `PKS-UNIT-APP-${Date.now()}`;
    const payload = {
      type: NotificationType.BREAKDOWN_APPROVED,
      title: 'Breakdown Approved',
      message: `${refId} has been approved`,
      refId,
      machine: 'TestMachineX',
      timestamp: new Date().toISOString(),
      technicianEmail
    };

    await notifyBreakdownApproved(payload);

    const notif = await prisma.notification.findFirst({
      where: { refId, userEmail: technicianEmail }
    });

    expect(notif).toBeDefined();
    expect(notif?.type).toBe(NotificationType.BREAKDOWN_APPROVED);
    expect(notif?.message).toContain('has been approved');
  });

  it('notifyBreakdownRejected should persist a rejection notification with remarks for the technician', async () => {
    const refId = `PKS-UNIT-REJ-${Date.now()}`;
    const payload = {
      type: NotificationType.BREAKDOWN_REJECTED,
      title: 'Breakdown Rejected',
      message: `${refId} has been rejected`,
      refId,
      machine: 'TestMachineX',
      timestamp: new Date().toISOString(),
      remarks: 'Incorrect machine selection',
      technicianEmail
    };

    await notifyBreakdownRejected(payload);

    const notif = await prisma.notification.findFirst({
      where: { refId, userEmail: technicianEmail }
    });

    expect(notif).toBeDefined();
    expect(notif?.type).toBe(NotificationType.BREAKDOWN_REJECTED);
    expect(notif?.remarks).toBe('Incorrect machine selection');
  });
});
