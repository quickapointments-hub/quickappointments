import { prisma } from '../prisma';
import { BookingStatus, PaymentMethod, PaymentStatus, NotificationType } from '@quick-appointments/shared-types';

export class BookingService {
  /**
   * Convert slot reservation into confirmed booking
   */
  static async confirmBooking(
    customerId: string,
    reservationToken: string,
    paymentMethod: PaymentMethod = PaymentMethod.CASH_ON_SERVICE,
    notes?: string
  ) {
    // 1. Fetch and validate reservation
    const reservation = await prisma.slotReservation.findUnique({
      where: { id: reservationToken },
      include: {
        service: true,
        provider: {
          include: { user: true },
        },
      },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.customerId !== customerId) {
      throw new Error('Unauthorized reservation token');
    }

    if (reservation.isReleased || new Date(reservation.expiresAt) < new Date()) {
      throw new Error('Reservation has expired. Please select the slot again.');
    }

    // 2. Pricing calculations
    const basePrice = reservation.service.basePrice;
    
    // Check if custom provider rate exists
    const customRate = await prisma.providerServiceRate.findUnique({
      where: {
        providerId_serviceId: {
          providerId: reservation.providerId,
          serviceId: reservation.serviceId,
        },
      },
    });

    const servicePrice = customRate?.customPrice ?? basePrice;
    const taxRate = 0.05; // 5% GST/Service tax
    const taxAmount = Math.round(servicePrice * taxRate);
    const totalAmount = servicePrice + taxAmount;

    // Platform commission lookup (default 10%)
    const commissionSetting = await prisma.commissionSetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    const commissionRate = commissionSetting ? commissionSetting.rate : 10;
    const platformCommission = Math.round((servicePrice * commissionRate) / 100);
    const providerEarnings = totalAmount - platformCommission;

    const bookingRef = `QA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 3. Create Booking & release reservation in single transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Mark reservation released
      await tx.slotReservation.update({
        where: { id: reservation.id },
        data: { isReleased: true },
      });

      // Create Booking record
      const newBooking = await tx.booking.create({
        data: {
          bookingRef,
          customerId,
          providerId: reservation.providerId,
          serviceId: reservation.serviceId,
          date: reservation.date,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          notes,
          servicePrice,
          taxAmount,
          totalAmount,
          platformCommission,
          providerEarnings,
          status: BookingStatus.CONFIRMED,
          paymentStatus: paymentMethod === PaymentMethod.CASH_ON_SERVICE ? PaymentStatus.PAID : PaymentStatus.PAID,
          paymentMethod,
          history: {
            create: {
              status: BookingStatus.CONFIRMED,
              reason: 'Initial booking creation',
            },
          },
          paymentTx: {
            create: {
              amount: totalAmount,
              status: 'SUCCESS',
              gateway: paymentMethod,
              gatewayTxId: `TXN-${Date.now()}`,
            },
          },
        },
        include: {
          service: true,
          provider: {
            include: { user: true },
          },
          customer: {
            include: { user: true },
          },
        },
      });

      // Record provider earning ledger
      await tx.providerEarning.create({
        data: {
          providerId: reservation.providerId,
          bookingId: newBooking.id,
          grossAmount: totalAmount,
          commissionRate,
          platformFee: platformCommission,
          netEarnings: providerEarnings,
          isSettled: false,
        },
      });

      return newBooking;
    });

    // 4. Send In-App Notifications
    // Customer notification
    await prisma.notification.create({
      data: {
        userId: booking.customer.userId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Appointment Confirmed! 🗓️',
        message: `Your booking for ${booking.service.name} on ${booking.date} at ${booking.startTime} is confirmed. Ref: ${booking.bookingRef}`,
        data: JSON.stringify({ bookingId: booking.id }),
      },
    });

    // Provider notification
    await prisma.notification.create({
      data: {
        userId: booking.provider.userId,
        type: NotificationType.BOOKING_CREATED,
        title: 'New Appointment Request! 🔔',
        message: `New booking for ${booking.service.name} on ${booking.date} at ${booking.startTime}. Ref: ${booking.bookingRef}`,
        data: JSON.stringify({ bookingId: booking.id }),
      },
    });

    return booking;
  }

  /**
   * Get bookings for customer
   */
  static async getCustomerBookings(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId },
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: { fullName: true, phone: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get bookings for provider
   */
  static async getProviderBookings(providerId: string, status?: string) {
    const where: any = { providerId };
    if (status) {
      where.status = status;
    }

    return prisma.booking.findMany({
      where,
      include: {
        service: true,
        customer: {
          include: {
            user: {
              select: { fullName: true, phone: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Update booking status (Completed, Cancelled, In Progress)
   */
  static async updateBookingStatus(bookingId: string, newStatus: BookingStatus, reason?: string, changedBy?: string) {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        history: {
          create: {
            status: newStatus,
            reason,
            changedBy,
          },
        },
      },
      include: {
        customer: true,
        provider: true,
        service: true,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: booking.customer.userId,
        type: newStatus === BookingStatus.COMPLETED ? NotificationType.SYSTEM_ALERT : NotificationType.BOOKING_CANCELLED,
        title: `Booking Update: ${newStatus}`,
        message: `Your appointment for ${booking.service.name} status is now ${newStatus}. ${reason ? `(${reason})` : ''}`,
      },
    });

    return booking;
  }
}

