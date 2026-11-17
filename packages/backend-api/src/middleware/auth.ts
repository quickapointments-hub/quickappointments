import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@quick-appointments/shared-types';
import { SupabaseDb, mapProviderDto } from '../db/supabaseDb';

const envJwtSecret = process.env.JWT_SECRET;
const envRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (process.env.NODE_ENV === 'production' && (!envJwtSecret || envJwtSecret.length < 32)) {
  throw new Error('[Security Policy] JWT_SECRET must be set (>= 32 chars) in production.');
}

export const JWT_SECRET = envJwtSecret || 'quick-appointments-dev-secret-key-32chars!';
export const JWT_REFRESH_SECRET = envRefreshSecret || 'quick-appointments-refresh-dev-key-32chars!';

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
      providerProfile?: ReturnType<typeof mapProviderDto>;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    if (!decoded || !decoded.userId || !Array.isArray(decoded.roles)) {
      return res.status(403).json({ success: false, code: 'INVALID_TOKEN', message: 'Malformed authentication token' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ success: false, code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Unauthorized' });
    }

    const hasRole = allowedRoles.some((r) => req.user!.roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role(s)`,
      });
    }

    next();
  };
}

/**
 * Authoritative DB-backed guard verifying the authenticated user has a Service Provider profile
 * AND its verification_status is strictly 'APPROVED'.
 * Prevents any PENDING, UNDER_REVIEW, NEEDS_INFO, or REJECTED provider from accessing provider operations.
 */
export async function requireApprovedProvider(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Unauthorized' });
    }

    const row = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user.userId)}`
    );

    if (!row) {
      return res.status(403).json({
        success: false,
        code: 'PROVIDER_PROFILE_REQUIRED',
        message: 'Service Provider profile is required to access this feature.',
      });
    }

    if (row.verification_status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        code: 'PROVIDER_NOT_APPROVED',
        message:
          row.verification_status === 'REJECTED'
            ? 'Your Service Provider application was rejected. Review feedback or re-submit documents.'
            : row.verification_status === 'NEEDS_INFO'
              ? 'Admin requested updated KYC documents before approving your provider account.'
              : 'Your Service Provider account is pending Admin verification. Access to provider features is disabled until approved.',
        verificationStatus: row.verification_status,
        rejectionReason: row.rejection_reason || null,
      });
    }

    req.providerProfile = mapProviderDto(row);
    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to verify provider approval status' });
  }
}
