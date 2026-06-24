import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

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

  async getRegisterMetadata(req: Request, res: Response) {
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
        plants: [
          { id: 'daman-plant', name: 'Daman Plant', code: 'DAMAN' }
        ]
      }
    });
  }
}

