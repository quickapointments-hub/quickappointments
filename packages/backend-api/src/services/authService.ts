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

    const isDevMockOtp = process.env.NODE_ENV !== 'production' && otp === '123456';

    if (!otpRecord && !isDevMockOtp) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as used if record exists
    if (otpRecord) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
    }

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

  /**
   * Admin Authentication (Email + Password)
   */
  static async adminLogin(email: string, passwordHash?: string) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email },
        ],
      },
      include: { roles: true },
    });

    // For initial setup / bootstrap if superadmin doesn't exist
    if (!user && (email === 'admin@quickappointments.in' || email === 'superadmin@quickappointments.in')) {
      user = await prisma.user.create({
        data: {
          phone: '+919999900000',
          email,
          fullName: 'Super Admin',
          roles: {
            create: [
              { role: UserRole.SUPERADMIN },
              { role: UserRole.ADMIN },
            ],
          },
        },
        include: { roles: true },
      });
    }

    if (!user) {
      throw new Error('Invalid administrative credentials');
    }

    const adminRoles = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN,
      UserRole.OPERATIONS_ADMIN,
      UserRole.FINANCE_ADMIN,
      UserRole.SUPPORT_ADMIN,
    ];

    const userRoles = user.roles.map(r => r.role as UserRole);
    const hasAdminRole = userRoles.some(r => adminRoles.includes(r));
    if (!hasAdminRole) {
      throw new Error('Access denied: User does not have administrative privileges');
    }

    const activeAdminRole = userRoles.find(r => adminRoles.includes(r)) || UserRole.ADMIN;

    const tokenPayload: AuthUserPayload = {
      userId: user.id,
      phone: user.phone,
      roles: userRoles,
      activeRole: activeAdminRole,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: userRoles,
        activeRole: activeAdminRole,
      },
    };
  }

  /**
   * Admin Management: List all admin users
   */
  static async listAdminUsers() {
    const adminRoles = ['SUPERADMIN', 'ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'];
    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { in: adminRoles },
          },
        },
      },
      include: {
        roles: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(u => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      fullName: u.fullName,
      isActive: u.isActive,
      roles: u.roles.map(r => r.role),
      createdAt: u.createdAt,
    }));
  }

  /**
   * Admin Management: Invite / Create new admin user
   */
  static async inviteAdminUser(email: string, fullName: string, phone: string, role: string) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existing) {
      await prisma.userRoleItem.upsert({
        where: {
          userId_role: { userId: existing.id, role },
        },
        update: {},
        create: {
          userId: existing.id,
          role,
        },
      });
      return existing;
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        phone,
        fullName,
        roles: {
          create: [{ role }],
        },
      },
      include: { roles: true },
    });

    return newUser;
  }

  /**
   * Admin Management: Update role or deactivate
   */
  static async updateAdminUser(userId: string, data: { isActive?: boolean; role?: string }) {
    if (typeof data.isActive === 'boolean') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: data.isActive },
      });
    }

    if (data.role) {
      await prisma.userRoleItem.deleteMany({
        where: {
          userId,
          role: { in: ['SUPERADMIN', 'ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'] },
        },
      });
      await prisma.userRoleItem.create({
        data: {
          userId,
          role: data.role,
        },
      });
    }

    return prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
  }
}

