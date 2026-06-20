import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth.types';

// Helper to generate access tokens (15 minutes)
const generateAccessToken = (user: {
  id: string;
  name: string;
  email: string;
  role: { code: string };
  permissions: string[];
  plantId: string | null;
}) => {
  const secret = process.env.JWT_SECRET || 'super-secret-cmms-jwt-key-2026-pks';
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.code,
      permissions: user.permissions,
      plantId: user.plantId
    },
    secret,
    { expiresIn: '15m' }
  );
};

// Helper to generate refresh tokens (7 days)
const generateRefreshToken = (userId: string) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'super-secret-cmms-refresh-jwt-key-2026-pks';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

// Helper to cookie options
const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
};

// Helper to manual cookie parsing (avoiding dependency overhead)
const parseCookie = (req: Request, name: string): string | null => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, current) => {
    const [key, val] = current.trim().split('=');
    if (key && val) {
      acc[key] = decodeURIComponent(val);
    }
    return acc;
  }, {} as Record<string, string>);

  return cookies[name] || null;
};

// 1. REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, roleId, plantId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'A user account with this email address already exists.'
      });
    }

    // Verify role exists
    const roleExists = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!roleExists) {
      return res.status(400).json({
        status: 'error',
        message: 'The requested role ID does not exist in the system.'
      });
    }

    // Verify plant exists if provided
    if (plantId) {
      const plantExists = await prisma.plant.findUnique({
        where: { id: plantId }
      });
      if (!plantExists) {
        return res.status(400).json({
          status: 'error',
          message: 'The requested plant ID does not exist in the system.'
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create User
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone,
        roleId,
        plantId,
        isActive: true // Active by default in dev/test, can be toggled by Admin
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            name: true,
            code: true
          }
        },
        plant: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    logger.info(`User registered successfully: ${newUser.email}`);
    
    // Log Audit Trail
    await prisma.auditLog.create({
      data: {
        module: 'Authentication',
        action: 'CREATE',
        targetId: newUser.id,
        newValue: JSON.stringify({ email: newUser.email, role: newUser.role.code }),
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: newUser
    });
  } catch (error: any) {
    logger.error(`Registration error: ${error.stack}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to complete registration process.'
    });
  }
};

// 2. LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email address or password credentials.'
      });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email address or password credentials.'
      });
    }

    // Check if active
    if (!user.isActive) {
      logger.warn(`Inactive login attempt: ${user.email}`);
      return res.status(403).json({
        status: 'error',
        message: 'Your user account is inactive. Please contact the administrator.'
      });
    }

    // Extract dynamic permission codes
    const permissionCodes = user.role.permissions
      .filter(rp => rp.permission.isActive)
      .map(rp => rp.permission.code);

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: { code: user.role.code },
      permissions: permissionCodes,
      plantId: user.plantId
    };

    // Generate tokens
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    logger.info(`User logged in successfully: ${user.email}`);

    // Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        module: 'Authentication',
        action: 'LOGIN',
        targetId: user.id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Authentication successful.',
      data: {
        token: accessToken,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: {
            name: user.role.name,
            code: user.role.code
          },
          plantId: user.plantId
        },
        permissions: permissionCodes
      }
    });
  } catch (error: any) {
    logger.error(`Login error: ${error.stack}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to complete authentication process.'
    });
  }
};

// 3. REFRESH TOKEN
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = parseCookie(req, 'refreshToken');

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication refresh token missing.'
      });
    }

    const secret = process.env.JWT_REFRESH_SECRET || 'super-secret-cmms-refresh-jwt-key-2026-pks';
    
    jwt.verify(refreshToken, secret, async (err, decoded: any) => {
      if (err) {
        logger.warn(`Failed refresh token verification: ${err.message}`);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or expired refresh token.'
        });
      }

      const userId = decoded.id;
      const user = await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account associated with this token is disabled or deleted.'
        });
      }

      // Extract dynamic permissions
      const permissionCodes = user.role.permissions
        .filter(rp => rp.permission.isActive)
        .map(rp => rp.permission.code);

      const userPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: { code: user.role.code },
        permissions: permissionCodes,
        plantId: user.plantId
      };

      // Generate new access token
      const newAccessToken = generateAccessToken(userPayload);

      return res.status(200).json({
        status: 'success',
        data: {
          token: newAccessToken,
          tokenType: 'Bearer'
        }
      });
    });
  } catch (error: any) {
    logger.error(`Token refresh error: ${error.stack}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to refresh authentication token.'
    });
  }
};

// 4. LOGOUT
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logout completed successfully.'
    });
  } catch (error: any) {
    logger.error(`Logout error: ${error.stack}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process logout request.'
    });
  }
};

// 5. GET CURRENT PROFILE (ME)
export const me = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userPayload = req.user;
    if (!userPayload) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized profile request.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        role: {
          select: {
            name: true,
            code: true
          }
        },
        plant: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user,
        permissions: userPayload.permissions
      }
    });
  } catch (error: any) {
    logger.error(`Fetch profile error: ${error.stack}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch current user profile.'
    });
  }
};

// 6. GET REGISTRATION ROLES & PLANTS
export const getRegistrationMasterData = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    });
    const plants = await prisma.plant.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    });
    return res.status(200).json({
      status: 'success',
      data: { roles, plants }
    });
  } catch (error: any) {
    logger.error(`Fetch registration master data error: ${error.stack}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve role and plant selection master data.'
    });
  }
};
