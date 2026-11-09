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

  /**
   * A-06 Customer Management
   */
  static async getCustomers(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search } } },
        { user: { phone: { contains: search } } },
        { city: { contains: search } },
      ];
    }
    return prisma.customerProfile.findMany({
      where,
      include: {
        user: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateCustomerStatus(customerId: string, isActive: boolean, adminUserId: string) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      include: { user: true },
    });
    if (!customer) throw new Error('Customer not found');

    await prisma.user.update({
      where: { id: customer.userId },
      data: { isActive },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: isActive ? 'CUSTOMER_UNBLOCKED' : 'CUSTOMER_BLOCKED',
        entityType: 'CustomerProfile',
        entityId: customerId,
        details: JSON.stringify({ customerPhone: customer.user.phone, isActive }),
      },
    });

    return customer;
  }

  /**
   * A-09 Rate Card Approvals
   */
  static async getPendingRates() {
    return prisma.providerServiceRate.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        provider: { include: { user: { select: { fullName: true, phone: true } } } },
        service: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  static async decideRateCard(rateId: string, action: 'APPROVE' | 'REJECT', adminUserId: string, reason?: string) {
    const updated = await prisma.providerServiceRate.update({
      where: { id: rateId },
      data: { approvalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
      include: { provider: true, service: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `RATE_CARD_${action}D`,
        entityType: 'ProviderServiceRate',
        entityId: rateId,
        details: JSON.stringify({
          providerId: updated.providerId,
          serviceId: updated.serviceId,
          customPrice: updated.customPrice,
          reason,
        }),
      },
    });

    return updated;
  }

  /**
   * A-11 Refunds Management (48-hour SLA)
   */
  static async getRefunds() {
    return prisma.refund.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          include: {
            customer: { include: { user: { select: { fullName: true, phone: true } } } },
            provider: { include: { user: { select: { fullName: true, phone: true } } } },
            service: true,
          },
        },
      },
    });
  }

  /**
   * A-13 Payouts (T+1 Batch Processing)
   */
  static async getPayouts() {
    return prisma.payoutBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            provider: { include: { user: { select: { fullName: true, phone: true } }, bankAccount: true } },
          },
        },
      },
    });
  }

  static async generatePayoutBatch(adminUserId: string) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Find unsettled earnings
    const unsettled = await prisma.providerEarning.findMany({
      where: { isSettled: false },
      include: { provider: { include: { bankAccount: true } } },
    });

    if (unsettled.length === 0) {
      throw new Error('No unsettled provider earnings available for payout batch generation');
    }

    const batchRef = `BATCH-${Date.now().toString().slice(-6)}`;
    const totalAmount = unsettled.reduce((sum, item) => sum + item.netEarnings, 0);

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.payoutBatch.create({
        data: {
          batchRef,
          settlementDate: yesterday,
          totalAmount,
          providerCount: unsettled.length,
          status: 'GENERATED',
          items: {
            create: unsettled.map((u) => ({
              providerId: u.providerId,
              netAmount: u.netEarnings,
              bankAccountRef: u.provider.bankAccount ? `${u.provider.bankAccount.bankName} - ${u.provider.bankAccount.accountNumber}` : 'Account Pending',
              status: 'PENDING',
            })),
          },
        },
        include: { items: true },
      });

      // Mark earnings as settled
      await tx.providerEarning.updateMany({
        where: { id: { in: unsettled.map((u) => u.id) } },
        data: { isSettled: true, settledAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'PAYOUT_BATCH_GENERATED',
          entityType: 'PayoutBatch',
          entityId: b.id,
          details: JSON.stringify({ batchRef, totalAmount, count: unsettled.length }),
        },
      });

      return b;
    });

    return batch;
  }

  static async markPayoutPaid(itemId: string, bankTxRef: string, adminUserId: string) {
    const item = await prisma.payoutItem.update({
      where: { id: itemId },
      data: {
        status: 'PAID',
        bankTxRef,
        paidAt: new Date(),
      },
      include: { provider: { include: { user: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PAYOUT_ITEM_PAID',
        entityType: 'PayoutItem',
        entityId: itemId,
        details: JSON.stringify({ bankTxRef, netAmount: item.netAmount }),
      },
    });

    return item;
  }

  /**
   * A-14 Support & Disputes Management
   */
  static async getSupportTickets(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  static async resolveSupportTicket(ticketId: string, resolution: string, adminUserId: string) {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolution,
      },
      include: { user: true },
    });

    await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: adminUserId,
        senderRole: 'ADMIN',
        message: `Resolution: ${resolution}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'SUPPORT_TICKET_RESOLVED',
        entityType: 'SupportTicket',
        entityId: ticketId,
        details: JSON.stringify({ resolution }),
      },
    });

    return ticket;
  }
}

