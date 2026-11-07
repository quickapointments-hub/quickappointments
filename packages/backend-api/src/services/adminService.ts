import { prisma } from '../prisma';
import { VerificationStatus, CommissionType, AdminDashboardMetrics } from '@quick-appointments/shared-types';

export class AdminService {
  /**
   * Aggregate high-level SaaS KPIs for admin overview
   */
  static async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalCustomers,
      totalProviders,
      activeProviders,
      pendingVerifications,
      totalBookings,
      todayBookings,
      completedBookings,
      cancelledBookings,
      revenueAgg,
      settlementAgg,
    ] = await Promise.all([
      prisma.customerProfile.count(),
      prisma.providerProfile.count(),
      prisma.providerProfile.count({ where: { verificationStatus: 'APPROVED', isAcceptingBookings: true } }),
      prisma.providerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { date: todayStr } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.aggregate({
        _sum: {
          totalAmount: true,
          platformCommission: true,
        },
      }),
      prisma.providerEarning.aggregate({
        _sum: {
          netEarnings: true,
        },
      }),
    ]);

    return {
      totalCustomers,
      totalProviders,
      activeProviders,
      pendingVerifications,
      totalBookings,
      todayBookings,
      completedBookings,
      cancelledBookings,
      grossRevenue: revenueAgg._sum.totalAmount || 0,
      platformCommission: revenueAgg._sum.platformCommission || 0,
      netProviderPayout: settlementAgg._sum.netEarnings || 0,
    };
  }

  /**
   * List all providers with filtering by status and pagination
   */
  static async getProviders(status?: string, search?: string) {
    const where: any = {};
    if (status) {
      where.verificationStatus = status;
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { city: { contains: search } },
        { user: { fullName: { contains: search } } },
        { user: { phone: { contains: search } } },
      ];
    }

    return prisma.providerProfile.findMany({
      where,
      include: {
        user: true,
        documents: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Provider verification decision (Approve / Reject) with mandatory audit logging
   */
  static async verifyProvider(
    providerId: string,
    action: 'APPROVE' | 'REJECT',
    adminUserId: string,
    reason?: string
  ) {
    const newStatus = action === 'APPROVE' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;

    const updated = await prisma.$transaction(async (tx) => {
      const provider = await tx.providerProfile.update({
        where: { id: providerId },
        data: {
          verificationStatus: newStatus,
          rejectionReason: action === 'REJECT' ? reason : null,
          isAcceptingBookings: action === 'APPROVE',
        },
        include: { user: true },
      });

      // Mark all documents as verified if approved
      if (action === 'APPROVE') {
        await tx.providerDocument.updateMany({
          where: { providerId },
          data: { isVerified: true },
        });
      }

      // Record immutable audit log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: `PROVIDER_${action}D`,
          entityType: 'ProviderProfile',
          entityId: providerId,
          details: JSON.stringify({ reason, previousStatus: provider.verificationStatus, newStatus }),
        },
      });

      // Notify provider
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: 'SYSTEM_ALERT',
          title: action === 'APPROVE' ? 'Account Verified & Activated! 🎉' : 'KYC Verification Update ⚠️',
          message: action === 'APPROVE'
            ? 'Your provider account has been approved. You are now live and can receive customer appointments!'
            : `Your application could not be approved at this time: ${reason || 'Document mismatch'}`,
        },
      });

      return provider;
    });

    return updated;
  }

  /**
   * List all bookings with customer & provider details
   */
  static async getAllBookings(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return prisma.booking.findMany({
      where,
      include: {
        service: true,
        customer: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
        provider: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Commission rate configuration
   */
  static async setCommission(rate: number, type: CommissionType = CommissionType.PERCENTAGE, categoryId?: string) {
    return prisma.commissionSetting.create({
      data: {
        rate,
        type,
        categoryId,
        isActive: true,
      },
    });
  }

  /**
   * Get active commission settings
   */
  static async getCommissionSettings() {
    return prisma.commissionSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Audit Logs
   */
  static async getAuditLogs() {
    return prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, phone: true } },
      },
    });
  }
}

