import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing MDM tables to remove duplicates...');
  try {
    await prisma.mstMachineUnit.deleteMany();
    await prisma.mstMachine.deleteMany();
    await prisma.mstMachineType.deleteMany();
    await prisma.mstDepartment.deleteMany();
    await prisma.mstProblemType.deleteMany();
    await prisma.mstWoCategory.deleteMany();
    await prisma.mstStatus.deleteMany();
    await prisma.mstPriority.deleteMany();
    console.log('MDM tables cleared successfully.');
  } catch (err) {
    console.error('Error clearing MDM tables:', err);
  }
}

main().finally(() => prisma.$disconnect());
