import { PrismaClient } from '@prisma/client';
import { MachineSyncService } from './src/integrations/google/machine.sync';

const prisma = new PrismaClient();
const machineSync = new MachineSyncService();

async function main() {
    console.log('Running Machine Sync...');
    const result = await machineSync.syncMachines();
    console.log(result);
    console.log('Machine Count:', await prisma.machine.count());
}

main().finally(() => prisma.$disconnect());
