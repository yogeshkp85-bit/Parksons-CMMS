import prisma from '../utils/db';
import bcrypt from 'bcrypt';

export class UserRepository {
  /**
   * Replaces `seedAdminUsersIfEmpty()`.
   * GAS Mapping: Populates 'Admin_Users' sheet with the default superadmin if empty.
   */
  async seedIfEmpty() {
    const count = await prisma.adminUsers.count();
    if (count > 0) return;

    const hash = await bcrypt.hash('PKS@2026', 10);
    await prisma.adminUsers.create({
      data: {
        name: 'YogeshK',
        email: 'yogeshkp85@gmail.com',
        password: hash,
        level: 'superadmin'
      }
    });
  }

  /**
   * Replaces the sheet reading in `getAdminUsers()`.
   * GAS Mapping: Returns all users mapped to { name, email, level } (omitting password).
   */
  async getAll() {
    const users = await prisma.adminUsers.findMany();
    return users.map(user => ({
      name: user.name,
      email: user.email,
      level: user.level,
      permissions: user.permissions
    }));
  }

  /**
   * Fetch the user by unique email.
   */
  async findByEmail(email: string) {
    return await prisma.adminUsers.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
  }

  /**
   * Replaces the manual row iteration in `loginAdmin()`.
   * GAS Mapping: Fetches the user by email and level to allow the Service layer to check the password.
   * Note: Treating email as the unique identifier.
   */
  async findByEmailAndLevel(email: string, level: string) {
    return await prisma.adminUsers.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        level: level.trim().toLowerCase()
      }
    });
  }

  /**
   * Replaces loop updates and `sheet.appendRow()` in `saveAdminUser()`.
   * GAS Mapping: Updates existing user row or creates a new one based on email.
   */
  async upsert(data: { name: string; email: string; password: string; level: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    let pwd = data.password.trim();
    if (!pwd.startsWith('$2b$') && !pwd.startsWith('$2a$')) {
      pwd = await bcrypt.hash(pwd, 10);
    }
    
    return await prisma.adminUsers.upsert({
      where: { email: normalizedEmail },
      update: {
        name: data.name.trim(),
        password: pwd,
        level: data.level.trim()
      },
      create: {
        name: data.name.trim(),
        email: normalizedEmail,
        password: pwd,
        level: data.level.trim()
      }
    });
  }

  /**
   * Replaces loop deletion `sheet.deleteRow(i + 2)` in `deleteAdminUser()`.
   * GAS Mapping: Deletes a user row matching the exact email.
   */
  async deleteByEmail(email: string) {
    try {
      await prisma.adminUsers.delete({
        where: { email: email.trim().toLowerCase() }
      });
      return true;
    } catch (e) {
      // Record does not exist
      return false;
    }
  }
}
