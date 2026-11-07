import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@quick-appointments/shared-types';

export const JWT_SECRET = process.env.JWT_SECRET || 'quick-appointments-dev-secret-key-32chars!';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'quick-appointments-refresh-dev-key-32chars!';

export interface AuthUserPayload {
  userId: string;
  phone: string;
  roles: UserRole[];
  activeRole: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const hasRole = allowedRoles.some(r => req.user!.roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role(s)`
      });
    }

    next();
  };
}

