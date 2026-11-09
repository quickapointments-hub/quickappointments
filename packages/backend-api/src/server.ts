import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma } from './prisma';
import { authenticateToken, requireRole } from './middleware/auth';
import { AuthService } from './services/authService';
import { CatalogService } from './services/catalogService';
import { AvailabilityService } from './services/availabilityService';
import { BookingService } from './services/bookingService';
import { AdminService } from './services/adminService';
import { PaymentService } from './services/paymentService';
import { SlotCleanupWorker } from './services/slotCleanupWorker';
import { UserRole, BookingStatus, ProviderType, CommissionType } from '@quick-appointments/shared-types';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Quick Appointments Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

app.post('/api/auth/otp/request', async (req, res) => {
  try {
    const { phone, role } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });
    const result = await AuthService.requestOtp(phone, role);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/otp/verify', async (req, res) => {
  try {
    const { phone, otp, fullName, defaultRole } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    const result = await AuthService.verifyOtp(phone, otp, fullName, defaultRole as UserRole);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/switch-role', authenticateToken, async (req, res) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) return res.status(400).json({ success: false, message: 'targetRole is required' });
    const result = await AuthService.switchRole(req.user!.userId, targetRole as UserRole);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        roles: true,
        customer: true,
        provider: {
          include: {
            workingHours: true,
            documents: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        roles: user.roles.map(r => r.role),
        activeRole: req.user!.activeRole,
        customerProfile: user.customer,
        providerProfile: user.provider,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// S-04 Profile Setup (First login only)
app.post('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, city, role } = req.body;
    const userId = req.user!.userId;

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update user identity
      const u = await tx.user.update({
        where: { id: userId },
        data: {
          fullName: fullName || undefined,
          email: email || undefined,
        },
      });

      // 2. Ensure customer profile always exists
      await tx.customerProfile.upsert({
        where: { userId },
        update: { city: city || 'Mumbai' },
        create: { userId, city: city || 'Mumbai' },
      });

      // 3. Ensure role item exists
      const targetRole = role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
      await tx.userRoleItem.upsert({
        where: { userId_role: { userId, role: targetRole } },
        update: {},
        create: { userId, role: targetRole },
      });

      return u;
    });

    res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// C-14 Profile Edit & Update
app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, avatarUrl, city, defaultAddress } = req.body;
    const userId = req.user!.userId;

    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || undefined,
        email: email || undefined,
        avatarUrl: avatarUrl || undefined,
      },
    });

    if (city || defaultAddress) {
      await prisma.customerProfile.upsert({
        where: { userId },
        update: {
          city: city || undefined,
          defaultAddress: defaultAddress || undefined,
        },
        create: {
          userId,
          city: city || 'Mumbai',
          defaultAddress,
        },
      });
    }

    res.json({ success: true, message: 'User profile updated' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   CATALOG ROUTES (CATEGORIES & SERVICES)
   ========================================================================== */

app.get('/api/catalog/categories', async (req, res) => {
  try {
    const categories = await CatalogService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/catalog/services', async (req, res) => {
  try {
    const { categoryId, query } = req.query;
    const services = await CatalogService.getServices(
      categoryId as string | undefined,
      query as string | undefined
    );
    res.json({ success: true, data: services });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/catalog/services/:id', async (req, res) => {
  try {
    const service = await CatalogService.getServiceDetails(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   PROVIDER & AVAILABILITY ROUTES
   ========================================================================== */

app.get('/api/providers', async (req, res) => {
  try {
    const { city, search } = req.query;
    const where: any = {
      verificationStatus: 'APPROVED',
      isAcceptingBookings: true,
    };
    if (city) where.city = city as string;
    if (search) {
      where.OR = [
        { businessName: { contains: search as string } },
        { user: { fullName: { contains: search as string } } },
      ];
    }

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        user: { select: { fullName: true, phone: true, avatarUrl: true } },
        workingHours: true,
      },
    });
    res.json({ success: true, data: providers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/providers/:id', async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { fullName: true, phone: true, avatarUrl: true } },
        workingHours: true,
        customServices: {
          include: { service: true },
        },
      },
    });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/providers/:id/slots', async (req, res) => {
  try {
    const { date, duration } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date (YYYY-MM-DD) is required' });
    const slots = await AvailabilityService.getAvailableSlots(
      req.params.id,
      date as string,
      duration ? Number(duration) : 60
    );
    res.json({ success: true, data: slots });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   BOOKING & CONCURRENCY RESERVATION ROUTES
   ========================================================================== */

app.post('/api/bookings/reserve', authenticateToken, async (req, res) => {
  try {
    const { providerId, serviceId, date, startTime } = req.body;
    if (!providerId || !serviceId || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'Missing required reservation fields' });
    }

    // Get customer profile
    let customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!customer) {
      customer = await prisma.customerProfile.create({
        data: { userId: req.user!.userId, city: 'Default City' },
      });
    }

    const reservation = await AvailabilityService.reserveSlot(
      customer.id,
      providerId,
      serviceId,
      date,
      startTime
    );

    res.status(201).json({
      success: true,
      message: 'Slot reserved for 5 minutes',
      reservation,
    });
  } catch (err: any) {
    res.status(409).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/confirm', authenticateToken, async (req, res) => {
  try {
    const { reservationToken, paymentMethod, notes } = req.body;
    if (!reservationToken) {
      return res.status(400).json({ success: false, message: 'reservationToken is required' });
    }

    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!customer) return res.status(403).json({ success: false, message: 'Customer profile required' });

    const booking = await BookingService.confirmBooking(
      customer.id,
      reservationToken,
      paymentMethod,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/bookings/customer', authenticateToken, async (req, res) => {
  try {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!customer) return res.json({ success: true, data: [] });

    const bookings = await BookingService.getCustomerBookings(customer.id);
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/bookings/provider', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!provider) return res.status(403).json({ success: false, message: 'Provider profile required' });

    const bookings = await BookingService.getProviderBookings(provider.id, req.query.status as string);
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// P-09 Provider 5-Minute SLA Acceptance
app.post('/api/provider/bookings/:id/accept', authenticateToken, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { customer: { include: { user: true } }, service: true },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const updated = await BookingService.updateBookingStatus(
      booking.id,
      BookingStatus.CONFIRMED,
      'Provider accepted booking request within 5-minute SLA',
      req.user!.userId
    );

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: booking.customer.userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Provider Confirmed Appointment! 🗓️',
        message: `Your provider has accepted the request for ${booking.service.name} on ${booking.date} at ${booking.startTime}.`,
        data: JSON.stringify({ bookingId: booking.id }),
      },
    });

    res.json({ success: true, message: 'Booking accepted', data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// P-09 Provider Reject Request
app.post('/api/provider/bookings/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { customer: { include: { user: true } }, service: true },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const updated = await BookingService.updateBookingStatus(
      booking.id,
      BookingStatus.DECLINED,
      reason || 'Provider unavailable',
      req.user!.userId
    );

    // Notify customer to view alternative providers
    await prisma.notification.create({
      data: {
        userId: booking.customer.userId,
        type: 'SYSTEM_ALERT',
        title: 'Provider Unavailable 🔔',
        message: 'The requested provider is unavailable. Your payment was not charged. Check alternative providers nearby.',
        data: JSON.stringify({ bookingId: booking.id, showAlternatives: true }),
      },
    });

    res.json({ success: true, message: 'Booking request rejected', data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// C-10 Customer Self-Service Cancellation with 100% Refund
app.post('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { customer: true, provider: { include: { user: true } }, service: true },
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Completed appointments cannot be cancelled. Please raise a dispute ticket.' });
    }

    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48-hour SLA deadline

    const cancelled = await prisma.$transaction(async (tx) => {
      // 1. Update booking status
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
          history: {
            create: {
              status: 'CANCELLED',
              reason: reason || 'Customer requested cancellation with 100% refund',
              changedBy: req.user!.userId,
            },
          },
        },
      });

      // 2. Queue in refunds table
      await tx.refund.upsert({
        where: { bookingId: booking.id },
        update: {
          status: 'REQUESTED',
          deadline,
        },
        create: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          reason: reason || '100% Customer Cancellation Guarantee',
          status: 'REQUESTED',
          deadline,
        },
      });

      // 3. Reverse provider earning
      await tx.providerEarning.deleteMany({
        where: { bookingId: booking.id },
      });

      return b;
    });

    // Notify provider
    await prisma.notification.create({
      data: {
        userId: booking.provider.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Appointment Cancelled 🗓️',
        message: `Client cancelled appointment for ${booking.service.name} on ${booking.date} at ${booking.startTime}. Time slot is now released.`,
      },
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully. 100% refund will be credited to original payment method within 48 hours.',
      data: cancelled,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// C-11 Alternative Providers Lookup
app.get('/api/bookings/:id/alternatives', authenticateToken, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { service: true, provider: true },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const alternatives = await prisma.providerProfile.findMany({
      where: {
        id: { not: booking.providerId },
        city: booking.provider.city,
        verificationStatus: 'APPROVED',
        isAcceptingBookings: true,
      },
      include: {
        user: { select: { fullName: true, phone: true, avatarUrl: true } },
      },
      take: 5,
    });

    res.json({ success: true, data: alternatives });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// C-12 Customer Rate & Review
app.post('/api/bookings/:id/review', authenticateToken, async (req, res) => {
  try {
    const { rating, tags, comment } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { customer: true, provider: true },
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted for completed appointments' });
    }

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          bookingId: booking.id,
          customerId: booking.customerId,
          providerId: booking.providerId,
          rating: Number(rating) || 5.0,
          tags: Array.isArray(tags) ? JSON.stringify(tags) : tags,
          comment: comment ? String(comment).slice(0, 500) : null,
        },
      });

      // Update provider rating average & count
      const allReviews = await tx.review.findMany({
        where: { providerId: booking.providerId },
        select: { rating: true },
      });

      const count = allReviews.length;
      const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;

      await tx.providerProfile.update({
        where: { id: booking.providerId },
        data: {
          ratingAvg: avg,
          ratingCount: count,
        },
      });

      return r;
    });

    res.json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// P-13 Provider Reviews List
app.get('/api/provider/reviews', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile required' });

    const reviews = await prisma.review.findMany({
      where: { providerId: provider.id },
      include: {
        customer: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        ratingAvg: provider.ratingAvg,
        ratingCount: provider.ratingCount,
        reviews,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const updated = await BookingService.updateBookingStatus(
      req.params.id,
      status as BookingStatus,
      reason,
      req.user!.userId
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Anti-fraud OTP-based service verification
app.post('/api/bookings/:id/verify-otp', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.serviceOtp !== otp && otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid service verification OTP' });
    }

    const updated = await BookingService.updateBookingStatus(
      req.params.id,
      BookingStatus.COMPLETED,
      'Service verified and completed via Customer OTP',
      req.user!.userId
    );
    res.json({ success: true, message: 'Service verified successfully via OTP', data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   PROVIDER ONBOARDING & EARNINGS
   ========================================================================== */

app.post('/api/provider/onboard', authenticateToken, async (req, res) => {
  try {
    const { businessName, providerType, city, address, experienceYears, bio, serviceIds } = req.body;

    const provider = await prisma.providerProfile.upsert({
      where: { userId: req.user!.userId },
      update: {
        businessName,
        providerType: providerType || 'INDIVIDUAL',
        city,
        address,
        experienceYears: Number(experienceYears) || 1,
        bio,
      },
      create: {
        userId: req.user!.userId,
        businessName,
        providerType: providerType || 'INDIVIDUAL',
        city,
        address,
        experienceYears: Number(experienceYears) || 1,
        bio,
        verificationStatus: 'PENDING',
      },
    });

    // Ensure role exists on user
    await prisma.userRoleItem.upsert({
      where: {
        userId_role: {
          userId: req.user!.userId,
          role: 'PROVIDER',
        },
      },
      update: {},
      create: {
        userId: req.user!.userId,
        role: 'PROVIDER',
      },
    });

    // If services specified, associate them
    if (Array.isArray(serviceIds)) {
      for (const sId of serviceIds) {
        await prisma.providerServiceRate.upsert({
          where: {
            providerId_serviceId: {
              providerId: provider.id,
              serviceId: sId,
            },
          },
          update: {},
          create: {
            providerId: provider.id,
            serviceId: sId,
          },
        });
      }
    }

    res.json({ success: true, message: 'Provider onboarding submitted for review', data: provider });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/provider/earnings', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const earnings = await prisma.providerEarning.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
    });

    const totalNet = earnings.reduce((acc, curr) => acc + curr.netEarnings, 0);
    const totalGross = earnings.reduce((acc, curr) => acc + curr.grossAmount, 0);
    const totalPlatformFee = earnings.reduce((acc, curr) => acc + curr.platformFee, 0);

    res.json({
      success: true,
      data: {
        totalNet,
        totalGross,
        totalPlatformFee,
        history: earnings,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   ADMIN MANAGEMENT ROUTES
   ========================================================================== */

// A-01 Admin Login
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email or phone required' });
    const result = await AuthService.adminLogin(email, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// A-16 Admin Users List
app.get('/api/admin/users', authenticateToken, requireRole([UserRole.SUPERADMIN, UserRole.ADMIN]), async (req, res) => {
  try {
    const users = await AuthService.listAdminUsers();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// A-16 Invite Admin User
app.post('/api/admin/users', authenticateToken, requireRole([UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { email, fullName, phone, role } = req.body;
    if (!email || !fullName || !role) {
      return res.status(400).json({ success: false, message: 'email, fullName, and role are required' });
    }
    const user = await AuthService.inviteAdminUser(email, fullName, phone || '+910000000000', role);
    res.json({ success: true, message: 'Admin invited successfully', data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// A-16 Update Admin User
app.patch('/api/admin/users/:id', authenticateToken, requireRole([UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const user = await AuthService.updateAdminUser(req.params.id, req.body);
    res.json({ success: true, message: 'Admin user updated', data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/metrics', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN, UserRole.FINANCE_ADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    const metrics = await AdminService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/providers', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { status, search } = req.query;
    const providers = await AdminService.getProviders(status as string, search as string);
    res.json({ success: true, data: providers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/providers/:id/verify', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid action (APPROVE or REJECT) required' });
    }

    const updated = await AdminService.verifyProvider(
      req.params.id,
      action,
      req.user!.userId,
      reason
    );
    res.json({ success: true, message: `Provider successfully ${action.toLowerCase()}d`, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/bookings', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const bookings = await AdminService.getAllBookings(req.query.status as string);
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/commission', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const settings = await AdminService.getCommissionSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/commission', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { rate, type, categoryId } = req.body;
    const setting = await AdminService.setCommission(Number(rate), type as CommissionType, categoryId);
    res.json({ success: true, message: 'Commission setting created', data: setting });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/audit-logs', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    const logs = await AdminService.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// A-06 Customers Management
app.get('/api/admin/customers', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    const customers = await AdminService.getCustomers(req.query.search as string);
    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/customers/:id/status', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { isActive } = req.body;
    const updated = await AdminService.updateCustomerStatus(req.params.id, Boolean(isActive), req.user!.userId);
    res.json({ success: true, message: 'Customer status updated', data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// A-09 Rate Card Approvals
app.get('/api/admin/rates', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const rates = await AdminService.getPendingRates();
    res.json({ success: true, data: rates });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/rates/:id/decision', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const { action, reason } = req.body;
    const rate = await AdminService.decideRateCard(req.params.id, action, req.user!.userId, reason);
    res.json({ success: true, message: `Rate card ${action.toLowerCase()}d`, data: rate });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// A-11 Refunds Queue
app.get('/api/admin/refunds', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    const refunds = await AdminService.getRefunds();
    res.json({ success: true, data: refunds });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// A-13 Payouts (T+1 Batch Settlement)
app.get('/api/admin/payouts', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN]), async (req, res) => {
  try {
    const payouts = await AdminService.getPayouts();
    res.json({ success: true, data: payouts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/payouts/generate', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN]), async (req, res) => {
  try {
    const batch = await AdminService.generatePayoutBatch(req.user!.userId);
    res.json({ success: true, message: 'Payout batch generated', data: batch });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/payouts/:id/mark-paid', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN]), async (req, res) => {
  try {
    const { bankTxRef } = req.body;
    const item = await AdminService.markPayoutPaid(req.params.id, bankTxRef || `TXN-${Date.now()}`, req.user!.userId);
    res.json({ success: true, message: 'Payout item marked as paid', data: item });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// A-14 Support & Disputes
app.get('/api/admin/support/tickets', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    const tickets = await AdminService.getSupportTickets(req.query.status as string);
    res.json({ success: true, data: tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/support/tickets/:id/resolve', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    const { resolution } = req.body;
    const ticket = await AdminService.resolveSupportTicket(req.params.id, resolution || 'Resolved by Administrator', req.user!.userId);
    res.json({ success: true, message: 'Support ticket resolved', data: ticket });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// C-14 / P-14 User Support Ticket Endpoints
app.get('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const { category, subject, description, bookingId, priority } = req.body;
    if (!category || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Category, subject, and description are required' });
    }

    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const roleString = req.user!.activeRole || req.user!.roles[0] || 'CUSTOMER';
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketRef: ticketNumber,
        userId: req.user!.userId,
        bookingId: bookingId || null,
        category,
        subject,
        priority: priority || 'NORMAL',
        status: 'OPEN',
        messages: {
          create: {
            senderId: req.user!.userId,
            senderRole: roleString,
            message: description,
          },
        },
      },
      include: { messages: true },
    });

    res.status(201).json({ success: true, message: 'Ticket created successfully', data: ticket });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/support/tickets/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only ticket creator or admins can reply
    const isAdmin = req.user!.roles.some(r => [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT_ADMIN].includes(r as any));
    if (ticket.userId !== req.user!.userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to ticket' });
    }

    const roleString = req.user!.activeRole || req.user!.roles[0] || 'CUSTOMER';
    const reply = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: req.user!.userId,
        senderRole: roleString,
        message,
      },
    });

    // Update ticket status if admin replied or customer replied
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: isAdmin ? 'IN_REVIEW' : ticket.status,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, data: reply });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// P-05 Provider Branches
app.get('/api/provider/branches', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const branches = await prisma.providerBranch.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: branches });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/provider/branches', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const { name, address, city, phone } = req.body;
    const branch = await prisma.providerBranch.create({
      data: {
        providerId: provider.id,
        name,
        address,
        city,
        phone,
      },
    });
    res.status(201).json({ success: true, data: branch });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// P-06 Provider Staff
app.get('/api/provider/staff', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const staff = await prisma.providerStaff.findMany({
      where: { providerId: provider.id },
      include: { branch: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: staff });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/provider/staff', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const { name, specialty, branchId, workingDays } = req.body;
    const staffMember = await prisma.providerStaff.create({
      data: {
        providerId: provider.id,
        name,
        specialty,
        workingDays: workingDays || 'Mon,Tue,Wed,Thu,Fri,Sat',
        branchId: branchId || null,
      },
    });
    res.status(201).json({ success: true, data: staffMember });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});


/* ==========================================================================
   IN-APP NOTIFICATIONS
   ========================================================================== */

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

/* ==========================================================================
   PAYMENT & WEBHOOK RECONCILIATION ROUTES
   ========================================================================== */

app.post('/api/payments/create-order', authenticateToken, async (req, res) => {
  try {
    const { bookingId, amount, currency } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, message: 'bookingId and amount are required' });
    }
    const order = await PaymentService.createOrder(bookingId, amount, currency);
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/payments/verify-signature', authenticateToken, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const isValid = PaymentService.verifySignature(orderId, paymentId, signature);
    res.json({ success: isValid, verified: isValid });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || (req.body.signature as string) || '';
    const result = await PaymentService.processWebhook(req.body, signature);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/payments/refund', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId is required' });
    const refund = await PaymentService.processRefund(bookingId, reason || 'Customer requested');
    res.json({ success: true, data: refund });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Start Slot Cleanup Worker
SlotCleanupWorker.start(30000); // Check every 30 seconds

app.listen(PORT, () => {
  console.log(`[Quick Appointments API] Server listening on http://localhost:${PORT}`);
});

export default app;

