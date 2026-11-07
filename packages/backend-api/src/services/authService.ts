import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { UserRole, RequestOtpSchema, VerifyOtpSchema } from '@quick-appointments/shared-types';
import { JWT_SECRET, JWT_REFRESH_SECRET, AuthUserPayload } from '../middleware/auth';

export class AuthService {
  /**
   * Request OTP for mobile login / registration
   */
  static async requestOtp(phone: string, requestedRole: string = 'CUSTOMER') {
    // Generate 6-digit OTP (for dev / testing convenience: predictable 123456 or random)
    const otp = process.env.NODE_ENV === 'production' 
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP verification record
    await prisma.otpVerification.create({
      data: {
        phone,
        otp,
        expiresAt,
        isUsed: false,
      },
    });

    return {
      success: true,
      message: 'OTP dispatched successfully',
      debugOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    };
  }

  /**
   * Verify OTP and log in / create user account
   */
  static async verifyOtp(phone: string, otp: string, fullName?: string, defaultRole: UserRole = UserRole.CUSTOMER) {
    // Validate OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone,
        otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone },
      include: {
        roles: true,
        customer: true,
        provider: true,
      },
    });

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          phone,
          fullName: fullName || `User ${phone.slice(-4)}`,
          roles: {
            create: [{ role: defaultRole }],
          },
          customer: defaultRole === UserRole.CUSTOMER ? {
            create: { city: 'Default City' }
          } : undefined,
          provider: defaultRole === UserRole.PROVIDER ? {
            create: {
              city: 'Default City',
              address: 'Default Address',
              verificationStatus: 'PENDING'
            }
          } : undefined,
        },
        include: {
          roles: true,
          customer: true,
          provider: true,
        },
      });
    }

    const roles = user.roles.map(r => r.role as UserRole);
    const activeRole = roles.includes(defaultRole) ? defaultRole : roles[0];

    const tokenPayload: AuthUserPayload = {
      userId: user.id,
      phone: user.phone,
      roles,
      activeRole,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    // Store session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        roles,
        activeRole,
        customerProfile: user.customer,
        providerProfile: user.provider,
      },
    };
  }

  /**
   * Switch Active Role (e.g. from Customer to Provider)
   */
  static async switchRole(userId: string, targetRole: UserRole) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) throw new Error('User not found');

    const hasTargetRole = user.roles.some(r => r.role === targetRole);
    if (!hasTargetRole) {
      // Add role if eligible
      await prisma.userRoleItem.create({
        data: {
          userId,
          role: targetRole,
        },
      });
    }

    const updatedRoles = [...user.roles.map(r => r.role as UserRole)];
    if (!updatedRoles.includes(targetRole)) updatedRoles.push(targetRole);

    const tokenPayload: AuthUserPayload = {
      userId: user.id,
      phone: user.phone,
      roles: updatedRoles,
      activeRole: targetRole,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return {
      accessToken,
      activeRole: targetRole,
    };
  }
}

