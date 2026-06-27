import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import prisma from '../utils/db';

const userService = new UserService();

export class UserController {
  async login(req: Request, res: Response) {
    try {
      const data = await userService.loginAdmin(req.body);
      if (data.status === 'error') {
        return res.status(401).json({ success: false, data: null, message: data.message });
      }
      res.json({ success: true, data, message: 'Login successful' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const data = await userService.getAdminUsers();
      res.json({ success: true, data, message: '' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await userService.createAdminUser(req.body);
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }
      res.json({ success: true, data, message: 'User created successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const data = await userService.deleteAdminUser({ email: req.params.email });
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }
      res.json({ success: true, data, message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async init(req: Request, res: Response) {
    try {
      await userService.initializeAdminUsers();
      res.json({ success: true, data: null, message: 'Admin users initialized' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { name, email, password, roleId } = req.body;
      const data = await userService.createAdminUser({
        name,
        email,
        password,
        level: roleId
      });
      if (data.status === 'error') {
        return res.status(400).json({ success: false, data: null, message: data.message });
      }
      res.status(201).json({ success: true, data: null, message: 'User registered successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, data: null, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    const { email } = req.params;
    const { name, level, password } = req.body;
    try {
      const updateData: any = {};
      if (name)  updateData.name  = name;
      if (level) updateData.level = level;
      if (password && password.length >= 6) {
        const bcrypt = require('bcrypt');
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      const updated = await prisma.user.update({
        where: { email },
        data: updateData,
        select: { id: true, name: true, email: true, level: true },
      });
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      if (err.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRegisterMetadata(req: Request, res: Response) {
    try {
      // Try to fetch roles from the database for accuracy
      const dbRoles = await prisma.role.findMany({
        select: { id: true, name: true, code: true }
      });
      const roles = dbRoles.length > 0 ? dbRoles : [
        { id: 'superadmin', name: 'Super Admin', code: 'superadmin' },
        { id: 'admin', name: 'Admin', code: 'admin' },
        { id: 'manager', name: 'Manager', code: 'manager' },
        { id: 'supervisor', name: 'Supervisor', code: 'supervisor' },
        { id: 'technician', name: 'Technician', code: 'technician' },
        { id: 'viewer', name: 'Viewer', code: 'viewer' }
      ];

      // Fetch plants from DB if available
      const dbPlants = await prisma.plant.findMany({
        select: { id: true, name: true, code: true }
      }).catch(() => [] as { id: string; name: string; code: string }[]);
      const plants = dbPlants.length > 0 ? dbPlants : [
        { id: 'daman-plant', name: 'Daman Plant', code: 'DAMAN' }
      ];

      res.json({ success: true, data: { roles, plants } });
    } catch (error: any) {
      // Fallback to static data so registration form never shows a blank page
      res.json({
        success: true,
        data: {
          roles: [
            { id: 'superadmin', name: 'Super Admin', code: 'superadmin' },
            { id: 'admin', name: 'Admin', code: 'admin' },
            { id: 'manager', name: 'Manager', code: 'manager' },
            { id: 'supervisor', name: 'Supervisor', code: 'supervisor' },
            { id: 'technician', name: 'Technician', code: 'technician' },
            { id: 'viewer', name: 'Viewer', code: 'viewer' }
          ],
          plants: [{ id: 'daman-plant', name: 'Daman Plant', code: 'DAMAN' }]
        }
      });
    }
  }
}

