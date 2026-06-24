import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userRepo = new UserRepository();

export class UserService {
  /**
   * Replaces `seedAdminUsersIfEmpty()` from Code.gs.
   */
  async initializeAdminUsers() {
    await userRepo.seedIfEmpty();
  }

  /**
   * Replaces `getAdminUsers()` from Code.gs.
   * GAS logic: Returns all users mapped to { name, email, level } (password stripped).
   */
  async getAdminUsers() {
    await this.initializeAdminUsers();
    
    // Repository handles the sheet mapping abstraction
    const users = await userRepo.getAll();
    
    return {
      status: 'success',
      users: users
    };
  }

  /**
   * Replaces `loginAdmin(params)` from Code.gs.
   * GAS logic: Validates password in-memory.
   */
  async loginAdmin(params: any) {
    await this.initializeAdminUsers();

    const email = String(params.email || '').trim().toLowerCase();
    const pwd = String(params.password || '').trim();

    // 1. Fetch user by Email ONLY via Repository
    const user = await userRepo.findByEmail(email);

    if (!user) {
      return { status: 'error', message: 'Invalid credentials' };
    }

    // 2. Verify hashed password via bcrypt
    const isMatch = await bcrypt.compare(pwd, user.password);
    if (!isMatch) {
      return { status: 'error', message: 'Invalid credentials' };
    }

    // 3. Generate JWT token (expires 24h)
    const secret = process.env.JWT_SECRET || 'test_secret_for_local_development';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        level: user.level
      },
      secret,
      { expiresIn: '24h' }
    );

    return {
      status: 'success',
      token,
      user: {
        name: user.name,
        email: user.email,
        level: user.level
      }
    };
  }

  /**
   * Replaces `saveAdminUser(params)` from Code.gs.
   * GAS logic: Checks for required fields, updates or creates based on email.
   */
  async createAdminUser(params: any) {
    await this.initializeAdminUsers();

    const name = String(params.name || '').trim();
    const email = String(params.email || '').trim();
    const pwd = String(params.password || '').trim();
    const level = String(params.level || 'supervisor').trim();

    // GAS exactly required name and password (missing email check ironically in GAS)
    if (!name || !pwd) {
      return { status: 'error', message: 'name and password required' };
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(pwd, 10);

    await userRepo.upsert({
      name: name,
      email: email,
      password: hashedPassword,
      level: level
    });

    return { status: 'success' };
  }

  /**
   * Replaces `deleteAdminUser(params)` from Code.gs.
   * GAS logic: Prevents deletion of the core super admin, deletes otherwise.
   */
  async deleteAdminUser(params: any) {
    const email = String(params.email || '').trim().toLowerCase();

    // GAS super admin protection rule
    if (email === 'yogeshkp85@gmail.com') {
      return { status: 'error', message: 'Cannot delete super admin' };
    }

    await userRepo.deleteByEmail(email);

    // GAS returns success regardless of whether the user was found
    return { status: 'success' };
  }
}
