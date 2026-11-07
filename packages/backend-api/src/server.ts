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
      message: 'Slot reserved for 10 minutes',
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

app.get('/api/admin/metrics', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
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

app.get('/api/admin/audit-logs', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const logs = await AdminService.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
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

