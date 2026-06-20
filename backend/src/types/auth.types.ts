import { Request } from 'express';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: string;          // Role code (e.g., 'SUPER_ADMIN')
  permissions: string[]; // List of permission codes (e.g., ['BREAKDOWN_CREATE'])
  plantId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}
