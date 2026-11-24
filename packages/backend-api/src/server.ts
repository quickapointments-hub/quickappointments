import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import {
  authenticateToken,
  requireRole,
  requireApprovedProvider,
} from './middleware/auth';
import {
  securityHeaders,
  createRateLimiter,
  sanitizeRequestBody,
} from './middleware/security';
import {
  SupabaseDb,
  mapProviderDto,
  mapWorkingHourDto,
  mapNotificationDto,
  normalizeTimeTo24h,
} from './db/supabaseDb';
import { AuthService } from './services/authService';
import { CatalogService } from './services/catalogService';
import { AvailabilityService } from './services/availabilityService';
import { BookingService } from './services/bookingService';
import { AdminService } from './services/adminService';
import { PaymentService } from './services/paymentService';
import { SlotCleanupWorker } from './services/slotCleanupWorker';
import { SupabaseStorageService } from './supabase';
import { LocationService } from './services/locationService';
import { UserRole, BookingStatus, CommissionType } from '@quick-appointments/shared-types';

const app = express();
const PORT = process.env.PORT || 4000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(securityHeaders);
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(sanitizeRequestBody);

const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'otp',
  message: 'Too many OTP attempts. Please wait a minute before retrying.',
});

const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 25,
  keyPrefix: 'auth',
});

const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 240,
  keyPrefix: 'api',
});

app.use('/api/', generalRateLimiter);

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', async (_req, res) => {
  let dbStatus = 'UNKNOWN';
  try {
    await SupabaseDb.count('categories');
    dbStatus = 'CONNECTED_SUPABASE_POSTGRES';
  } catch (err: any) {
    dbStatus = `ERROR: ${err.message}`;
  }
  res.json({
    status: 'ONLINE',
    service: 'Quick Appointments Backend API',
    database: dbStatus,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

/* ==========================================================================
   AUTHENTICATION & REGISTRATION ROUTES
   ========================================================================== */

app.post('/api/auth/check-phone', authRateLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });
    const result = await AuthService.checkPhone(phone);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/otp/request', otpRateLimiter, async (req, res) => {
  try {
    const { phone, role, isRegistration } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });
    const result = await AuthService.requestOtp(phone, role, Boolean(isRegistration));
    res.json(result);
  } catch (err: any) {
    const statusCode =
      err.code === 'ACCOUNT_NOT_FOUND' ? 404 : err.code === 'ACCOUNT_SUSPENDED' ? 403 : 400;
    res.status(statusCode).json({ success: false, code: err.code || 'OTP_FAILED', message: err.message });
  }
});

app.post('/api/auth/otp/verify', otpRateLimiter, async (req, res) => {
  try {
    const { phone, otp, fullName, defaultRole, isRegistration } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }
    const result = await AuthService.verifyOtp(
      phone,
      otp,
      fullName,
      defaultRole as UserRole,
      Boolean(isRegistration)
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    const statusCode = err.code === 'ACCOUNT_NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ success: false, code: err.code || 'VERIFY_FAILED', message: err.message });
  }
});

app.post('/api/auth/register-customer', authRateLimiter, async (req, res) => {
  try {
    const result = await AuthService.registerCustomer(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer account created and activated successfully',
      ...result,
    });
  } catch (err: any) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/register-provider', authRateLimiter, async (req, res) => {
  try {
    const result = await AuthService.registerProvider(req.body);
    res.status(201).json({
      success: true,
      message: 'Service Provider registration submitted for Admin KYC verification',
      ...result,
    });
  } catch (err: any) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/switch-role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Target role is required' });
    const result = await AuthService.switchRole(req.user!.userId, role as UserRole);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const profile = await AuthService.getProfile(req.user!.userId);
    if (!profile) return res.status(404).json({ success: false, message: 'User profile not found' });
    res.json({ success: true, user: profile });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const updated = await AuthService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const updated = await AuthService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   CUSTOMER ADDRESSES & COUPONS
   ========================================================================== */

app.get('/api/customer/addresses', authenticateToken, async (req, res) => {
  try {
    const customer = await SupabaseDb.selectOne<any>(
      'customer_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!customer) return res.json({ success: true, data: [] });

    try {
      const rows = await SupabaseDb.select<any>(
        'customer_addresses',
        `select=*&customer_id=eq.${encodeURIComponent(customer.id)}&order=created_at.desc`
      );
      if (rows.length > 0) return res.json({ success: true, data: rows });
    } catch {
      // Optional table before Migration 08
    }

    const fallback = customer.default_address
      ? [
        {
          id: 'primary',
          customer_id: customer.id,
          label: 'Primary',
          address_line: customer.default_address,
          city: customer.city,
          is_default: true,
        },
      ]
      : [];
    res.json({ success: true, data: fallback });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customer/addresses', authenticateToken, async (req, res) => {
  try {
    const { label, addressLine, city, state, area, pincode } = req.body;
    if (!addressLine) return res.status(400).json({ success: false, message: 'addressLine is required' });

    let customer = await SupabaseDb.selectOne<any>(
      'customer_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!customer) {
      customer = await SupabaseDb.insertOne<any>('customer_profiles', {
        user_id: req.user!.userId,
        city: city || 'Hyderabad',
        default_address: addressLine,
      });
    } else {
      await SupabaseDb.updateOne('customer_profiles', customer.id, {
        default_address: addressLine,
        ...(city ? { city } : {}),
        updated_at: new Date().toISOString(),
      });
    }

    try {
      const created = await SupabaseDb.insertOne<any>('customer_addresses', {
        customer_id: customer.id,
        label: label || 'Home',
        address_line: addressLine,
        area: area || null,
        city: city || customer.city || 'Hyderabad',
        state: state || null,
        pincode: pincode || null,
        is_default: true,
      });
      return res.status(201).json({ success: true, data: created });
    } catch {
      return res.status(201).json({
        success: true,
        data: { id: 'primary', label: label || 'Home', address_line: addressLine, city: city || customer.city },
      });
    }
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/customer/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await SupabaseDb.selectOne<any>(
      'customer_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (req.params.id === 'primary') {
      await SupabaseDb.updateOne('customer_profiles', customer.id, { default_address: null });
      return res.json({ success: true });
    }

    await SupabaseDb.remove(
      'customer_addresses',
      `id=eq.${encodeURIComponent(req.params.id)}&customer_id=eq.${encodeURIComponent(customer.id)}`
    ).catch(() => { });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   CUSTOMER WALLET, TRANSACTIONS, COUPONS & FAVORITES ROUTES
   ========================================================================== */

// In-memory caches for quick customer wallet & favorites
const customerWallets = new Map<string, { balance: number; transactions: any[] }>();
const customerFavorites = new Map<string, Set<string>>();
const providerGalleries = new Map<string, string[]>();

app.get('/api/customer/wallet', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    if (!customerWallets.has(userId)) {
      customerWallets.set(userId, {
        balance: 250.0,
        transactions: [
          {
            id: 'tx_welcome',
            type: 'CREDIT',
            amount: 250.0,
            description: 'Welcome Promotional Cash Bonus',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
    const wallet = customerWallets.get(userId)!;
    res.json({ success: true, data: wallet });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customer/wallet/add-funds', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { amount, paymentMethod } = req.body;
    const addAmt = Number(amount);
    if (isNaN(addAmt) || addAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount required' });
    }
    if (!customerWallets.has(userId)) {
      customerWallets.set(userId, { balance: 0, transactions: [] });
    }
    const wallet = customerWallets.get(userId)!;
    wallet.balance += addAmt;
    const tx = {
      id: `tx_${Date.now()}`,
      type: 'CREDIT',
      amount: addAmt,
      description: `Added via ${paymentMethod || 'UPI / Card'}`,
      createdAt: new Date().toISOString(),
    };
    wallet.transactions.unshift(tx);
    res.json({ success: true, data: wallet, transaction: tx });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/customer/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    let customer = await SupabaseDb.selectOne<any>(
      'customer_profiles',
      `select=*&user_id=eq.${encodeURIComponent(userId)}`
    );
    let bookings: any[] = [];
    if (customer?.id) {
      bookings = await SupabaseDb.select<any>(
        'bookings',
        `select=*,service:services(*),provider:provider_profiles(*)&customer_id=eq.${encodeURIComponent(customer.id)}&order=created_at.desc`
      ).catch(() => []);
    }
    const txs = (bookings || []).map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      amount: b.totalAmount,
      serviceName: b.service?.name || 'Service Booking',
      providerName: b.provider?.businessName || 'Service Specialist',
      paymentMethod: b.paymentMethod,
      paymentStatus: b.paymentStatus,
      date: b.date,
      time: b.startTime,
      createdAt: b.createdAt,
    }));
    res.json({ success: true, data: txs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/customer/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const favs = Array.from(customerFavorites.get(userId) || []);
    res.json({ success: true, data: favs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customer/favorites/toggle', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { providerId } = req.body;
    if (!providerId) return res.status(400).json({ success: false, message: 'providerId is required' });
    if (!customerFavorites.has(userId)) {
      customerFavorites.set(userId, new Set());
    }
    const set = customerFavorites.get(userId)!;
    let isFavorite = false;
    if (set.has(providerId)) {
      set.delete(providerId);
    } else {
      set.add(providerId);
      isFavorite = true;
    }
    res.json({ success: true, isFavorite, data: Array.from(set) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/catalog/coupons', async (_req, res) => {
  try {
    const coupons = await SupabaseDb.select<any>(
      'coupons',
      'select=*&is_active=eq.true'
    ).catch(() => []);
    if (!coupons || coupons.length === 0) {
      return res.json({
        success: true,
        data: [
          { id: 'c1', code: 'QUICK100', discountType: 'FIXED', value: 100, minOrderAmount: 299, description: 'Flat ₹100 off on all bookings above ₹299' },
          { id: 'c2', code: 'BEAUTY20', discountType: 'PERCENTAGE', value: 20, minOrderAmount: 499, maxDiscountAmount: 200, description: '20% off on Beauty & Salon Services' },
          { id: 'c3', code: 'WELCOME50', discountType: 'FIXED', value: 50, minOrderAmount: 199, description: 'Flat ₹50 off for new appointments' },
        ],
      });
    }
    res.json({ success: true, data: coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const amt = Number(orderAmount) || 0;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const cleanCode = code.trim().toUpperCase();
    let coupon: any = await SupabaseDb.selectOne<any>(
      'coupons',
      `select=*&code=eq.${encodeURIComponent(cleanCode)}`
    ).catch(() => null);

    if (!coupon) {
      if (cleanCode === 'QUICK100') coupon = { id: 'c1', code: 'QUICK100', discountType: 'FIXED', value: 100, minOrderAmount: 299, maxDiscountAmount: 100, isActive: true };
      else if (cleanCode === 'BEAUTY20') coupon = { id: 'c2', code: 'BEAUTY20', discountType: 'PERCENTAGE', value: 20, minOrderAmount: 499, maxDiscountAmount: 200, isActive: true };
      else if (cleanCode === 'WELCOME50') coupon = { id: 'c3', code: 'WELCOME50', discountType: 'FIXED', value: 50, minOrderAmount: 199, maxDiscountAmount: 50, isActive: true };
    }

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    if (amt < (coupon.minOrderAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount of ₹${coupon.minOrderAmount} required for this coupon`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (amt * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.value;
    }
    if (discount > amt) discount = amt;

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountAmount: Math.round(discount),
        finalAmount: Math.max(0, Math.round(amt - discount)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/providers/:id/gallery', async (req, res) => {
  try {
    const providerId = req.params.id;
    const list = providerGalleries.get(providerId) || [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    ];
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/provider/gallery', authenticateToken, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, message: 'imageUrl required' });
    const userId = req.user!.userId;
    const provider = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&user_id=eq.${encodeURIComponent(userId)}`
    );
    const pId = provider?.id || userId;
    if (!providerGalleries.has(pId)) {
      providerGalleries.set(pId, [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
      ]);
    }
    const gallery = providerGalleries.get(pId)!;
    gallery.unshift(imageUrl);
    res.json({ success: true, data: gallery });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   PUBLIC CATALOG, BANNERS & CITIES ROUTES
   ========================================================================== */

app.get('/api/catalog/categories', async (_req, res) => {
  try {
    const categories = await CatalogService.getCategories(false);
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

app.get('/api/catalog/cities', async (_req, res) => {
  try {
    const cities = await SupabaseStorageService.getCities(true);
    res.json({ success: true, data: cities });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.all(['/api/locations/validate-pincode'], async (req, res) => {
  try {
    const rawPin = req.method === 'GET' ? req.query.pincode : req.body?.pincode;
    const cleanPin = String(rawPin || '').replace(/\D/g, '').trim();
    if (!cleanPin || cleanPin.length !== 6) {
      return res.status(400).json({
        success: false,
        serviceable: false,
        message: 'Please provide a valid 6-digit Indian postal PIN code.',
        location: null,
      });
    }

    const validation = await LocationService.validatePincode(cleanPin);
    return res.json({
      success: true,
      serviceable: validation.serviceable,
      message: validation.message,
      location: validation.location,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, serviceable: false, message: err.message, location: null });
  }
});

app.get('/api/banners', async (_req, res) => {
  try {
    const banners = await AdminService.getBanners(true);
    res.json({ success: true, data: banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* Protected Admin Catalog & Cities Operations */
const ADMIN_CATALOG_ROLES = [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN];

app.get('/api/admin/categories', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (_req, res) => {
  try {
    const categories = await CatalogService.getCategories(true);
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/categories', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const { name, description, display_order, icon, icon_url, image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });
    const created = await SupabaseStorageService.createCategory({
      name,
      description,
      display_order,
      icon,
      icon_url,
      image_url,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/categories/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const updated = await SupabaseStorageService.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/categories/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    await SupabaseStorageService.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/services', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (_req, res) => {
  try {
    const services = await CatalogService.getServices(undefined, undefined, true);
    res.json({ success: true, data: services });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/services', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const { name, categoryId, category_id, description, basePrice, base_price, durationMinutes, duration_minutes, imageUrl, image_url } = req.body;
    const resolvedCatId = categoryId || category_id;
    if (!name || !resolvedCatId) {
      return res.status(400).json({ success: false, message: 'Service name and categoryId are required' });
    }
    const created = await SupabaseStorageService.createService({
      name,
      category_id: resolvedCatId,
      description,
      base_price: basePrice ?? base_price,
      duration_minutes: durationMinutes ?? duration_minutes,
      image_url: imageUrl ?? image_url,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/services/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const updated = await SupabaseStorageService.updateService(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/services/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    await SupabaseStorageService.deleteService(req.params.id);
    res.json({ success: true, message: 'Service removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/cities', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (_req, res) => {
  try {
    const cities = await SupabaseStorageService.getCities(false);
    res.json({ success: true, data: cities });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/cities', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const { name, state, is_active, pincodes } = req.body;
    if (!name || !state) return res.status(400).json({ success: false, message: 'City name and state are required' });
    const created = await SupabaseStorageService.addCity({ name, state, is_active, pincodes });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/cities/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const updated = await SupabaseStorageService.updateCity(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'City not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/cities/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    await SupabaseStorageService.deleteCity(req.params.id);
    res.json({ success: true, message: 'City removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   ADMIN LOCATION MASTER & SERVICEABLE PIN CODE CONTROLS
   ========================================================================== */

app.get('/api/admin/locations', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const { search, status, state, city } = req.query;
    const locations = await LocationService.getLocations({
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      state: state ? String(state) : undefined,
      city: city ? String(city) : undefined,
    });
    res.json({ success: true, data: locations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/locations', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const created = await LocationService.createLocation(req.body);
    res.status(201).json({ success: true, data: created, message: 'Location PIN code registered successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/locations/bulk-upload', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty bulk upload rows payload.' });
    }
    const result = await LocationService.bulkUploadLocations(rows);
    res.json({ success: true, data: result, message: `Successfully processed ${result.total} location records` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/locations/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const updated = await LocationService.updateLocation(req.params.id, req.body);
    res.json({ success: true, data: updated, message: 'Location updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/locations/:id/toggle', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const { is_active } = req.body;
    const updated = await LocationService.toggleLocationStatus(req.params.id, Boolean(is_active));
    res.json({ success: true, data: updated, message: `Location ${updated.is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/locations/:id', authenticateToken, requireRole(ADMIN_CATALOG_ROLES), async (req, res) => {
  try {
    const deleted = await LocationService.deleteLocation(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Location record not found' });
    res.json({ success: true, message: 'Location PIN code removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   PUBLIC APPROVED PROVIDERS DISCOVERY & SLOTS
   ========================================================================== */

app.get('/api/providers', async (req, res) => {
  try {
    const { city, search, categoryId } = req.query;
    const filters = [
      'select=*',
      'verification_status=eq.APPROVED',
      'is_accepting_bookings=eq.true',
      'order=rating_avg.desc',
    ];
    if (city && String(city).trim()) {
      filters.push(`city=ilike.${encodeURIComponent(String(city).trim())}`);
    }

    const providers = await SupabaseDb.select<any>('provider_profiles', filters.join('&'));
    if (providers.length === 0) return res.json({ success: true, data: [] });

    const userIds = Array.from(new Set(providers.map((p) => p.user_id).filter(Boolean)));
    const provIds = providers.map((p) => p.id);

    const [users, hours, rates, services] = await Promise.all([
      userIds.length > 0
        ? SupabaseDb.select<any>('users', `select=id,full_name,avatar_url,is_active&id=in.(${userIds.join(',')})`)
        : Promise.resolve([]),
      SupabaseDb.select<any>('provider_working_hours', `select=*&provider_id=in.(${provIds.join(',')})`),
      SupabaseDb.select<any>('provider_service_rates', `select=*&provider_id=in.(${provIds.join(',')})&is_active=eq.true`),
      SupabaseDb.select<any>('services', `select=id,category_id,name,base_price,duration_minutes&is_active=eq.true`),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const servMap = new Map(services.map((s) => [s.id, s]));

    let mapped = providers
      .filter((p) => userMap.get(p.user_id)?.is_active !== false)
      .map((p) => {
        const pRates = rates
          .filter((r) => r.provider_id === p.id)
          .map((r) => ({ ...r, service: servMap.get(r.service_id) || null }));
        return mapProviderDto(p, {
          user: userMap.get(p.user_id),
          workingHours: hours.filter((h) => h.provider_id === p.id),
          customServices: pRates,
        });
      });

    if (categoryId && String(categoryId).trim()) {
      const targetCat = String(categoryId).trim();
      const needle = targetCat.toLowerCase();
      mapped = mapped.filter((p: any) =>
        p.category_id === targetCat ||
        p.categoryId === targetCat ||
        p.category?.slug?.toLowerCase() === needle ||
        p.category?.name?.toLowerCase().includes(needle) ||
        p.customServices?.some((r: any) =>
          r.service?.category_id === targetCat ||
          r.service?.category?.id === targetCat ||
          r.service?.category?.slug?.toLowerCase() === needle ||
          r.service?.category?.name?.toLowerCase().includes(needle)
        )
      );
    }

    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      mapped = mapped.filter(
        (p: any) =>
          p.businessName?.toLowerCase().includes(q) ||
          p.user?.fullName?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/providers/:id', async (req, res) => {
  try {
    const p = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&id=eq.${encodeURIComponent(req.params.id)}&verification_status=eq.APPROVED`
    );
    if (!p) return res.status(404).json({ success: false, message: 'Approved provider not found' });

    const [user, hours, rates, services] = await Promise.all([
      SupabaseDb.selectOne<any>('users', `select=id,full_name,avatar_url&id=eq.${encodeURIComponent(p.user_id)}`),
      SupabaseDb.select<any>('provider_working_hours', `select=*&provider_id=eq.${encodeURIComponent(p.id)}`),
      SupabaseDb.select<any>('provider_service_rates', `select=*&provider_id=eq.${encodeURIComponent(p.id)}&is_active=eq.true`),
      SupabaseDb.select<any>('services', `select=*&is_active=eq.true`),
    ]);
    const servMap = new Map(services.map((s) => [s.id, s]));

    res.json({
      success: true,
      data: mapProviderDto(p, {
        user,
        workingHours: hours,
        customServices: rates.map((r) => ({ ...r, service: servMap.get(r.service_id) || null })),
      }),
    });
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
   CUSTOMER BOOKING, CANCELLATION & REVIEW ROUTES
   ========================================================================== */

app.post('/api/bookings/reserve', authenticateToken, async (req, res) => {
  try {
    const { providerId, serviceId, date, startTime } = req.body;
    if (!providerId || !serviceId || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'Missing required reservation fields' });
    }

    let customer = await SupabaseDb.selectOne<any>(
      'customer_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!customer) {
      customer = await SupabaseDb.insertOne<any>('customer_profiles', {
        user_id: req.user!.userId,
        city: 'Hyderabad',
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
    const { reservationToken, paymentMethod, notes, paymentTxId, orderId, couponCode } = req.body;
    if (!reservationToken) {
      return res.status(400).json({ success: false, message: 'reservationToken is required' });
    }

    const customer = await SupabaseDb.selectOne<any>(
      'customer_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!customer) return res.status(403).json({ success: false, message: 'Customer profile required' });

    const booking = await BookingService.confirmBooking(
      customer.id,
      reservationToken,
      paymentMethod,
      notes,
      paymentTxId,
      orderId,
      couponCode
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
    const customer = await SupabaseDb.selectOne<any>(
      'customer_profiles',
      `select=id&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!customer) return res.json({ success: true, data: [] });

    const bookings = await BookingService.getCustomerBookings(customer.id);
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user!.roles.some((r) => [UserRole.ADMIN, UserRole.SUPERADMIN].includes(r));
    const cancelled = await BookingService.cancelBooking(
      req.params.id,
      req.user!.userId,
      isAdmin,
      req.body?.reason
    );
    res.json({ success: true, message: 'Appointment cancelled', data: cancelled });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/:id/reschedule', authenticateToken, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime) {
      return res.status(400).json({ success: false, message: 'date and startTime are required' });
    }
    const existing = await SupabaseDb.selectOne<any>('bookings', `select=*&id=eq.${encodeURIComponent(req.params.id)}`);
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });

    const cust = await SupabaseDb.selectOne<any>('customer_profiles', `select=user_id&id=eq.${encodeURIComponent(existing.customer_id)}`);
    if (cust?.user_id !== req.user!.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reschedule this booking' });
    }

    const updated = await SupabaseDb.updateOne<any>('bookings', existing.id, {
      date,
      start_time: normalizeTimeTo24h(startTime, startTime),
      ...(endTime ? { end_time: normalizeTimeTo24h(endTime, endTime) } : {}),
      updated_at: new Date().toISOString(),
    });
    SupabaseDb.broadcastSync('bookings_updated', { bookingId: existing.id });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/:id/review', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, tags } = req.body;
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const booking = await SupabaseDb.selectOne<any>('bookings', `select=*&id=eq.${encodeURIComponent(req.params.id)}`);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const customer = await SupabaseDb.selectOne<any>('customer_profiles', `select=*&id=eq.${encodeURIComponent(booking.customer_id)}`);
    if (!customer || customer.user_id !== req.user!.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to review this booking' });
    }

    const review = await SupabaseDb.insertOne<any>('reviews', {
      booking_id: booking.id,
      customer_id: booking.customer_id,
      provider_id: booking.provider_id,
      rating: numericRating,
      comment: comment || '',
      tags: Array.isArray(tags) ? tags : [],
    });

    const allReviews = await SupabaseDb.select<any>('reviews', `select=rating&provider_id=eq.${encodeURIComponent(booking.provider_id)}`);
    const count = allReviews.length;
    const avg = count > 0 ? Number((allReviews.reduce((acc, r) => acc + Number(r.rating), 0) / count).toFixed(1)) : 5.0;
    await SupabaseDb.updateOne('provider_profiles', booking.provider_id, {
      rating_avg: avg,
      rating_count: count,
    });

    res.status(201).json({ success: true, data: review });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   CUSTOMER <-> PROVIDER IN-BOOKING LIVE CHAT
   ========================================================================== */

const bookingChatMemory = new Map<string, any[]>();

app.get('/api/bookings/:id/messages', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await SupabaseDb.selectOne<any>('bookings', `select=*&id=eq.${encodeURIComponent(bookingId)}`);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let messages: any[] = [];
    try {
      messages = await SupabaseDb.select<any>(
        'booking_messages',
        `select=*&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc`
      );
    } catch {
      messages = bookingChatMemory.get(bookingId) || [];
    }

    if (!messages || messages.length === 0) {
      messages = bookingChatMemory.get(bookingId) || [];
    }

    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/:id/messages', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const booking = await SupabaseDb.selectOne<any>('bookings', `select=*&id=eq.${encodeURIComponent(bookingId)}`);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const userRow = await SupabaseDb.selectOne<any>('users', `select=*&id=eq.${encodeURIComponent(req.user!.userId)}`);
    const senderName = userRow?.full_name || req.user?.phone || 'User';
    const senderRole = req.user?.activeRole === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';

    const newMsg = {
      id: crypto.randomUUID(),
      bookingId,
      booking_id: bookingId,
      senderId: req.user!.userId,
      sender_id: req.user!.userId,
      senderName,
      sender_name: senderName,
      senderRole,
      sender_role: senderRole,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Store in-memory
    const existing = bookingChatMemory.get(bookingId) || [];
    existing.push(newMsg);
    bookingChatMemory.set(bookingId, existing);

    // Try DB insert
    try {
      await SupabaseDb.insertOne('booking_messages', {
        id: newMsg.id,
        booking_id: bookingId,
        sender_id: req.user!.userId,
        sender_name: senderName,
        sender_role: senderRole,
        message: newMsg.message,
      });
    } catch {
      // Table may not exist yet, fallback in-memory is preserved
    }

    // Broadcast in real-time
    SupabaseDb.broadcastSync('booking_chat_message', newMsg);

    res.status(201).json({ success: true, data: newMsg });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   PROVIDER ONBOARDING, KYC STATUS & STRICTLY APPROVED PROVIDER OPERATIONS
   ========================================================================== */

app.get('/api/provider/status', authenticateToken, async (req, res) => {
  try {
    const provider = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!provider) {
      return res.json({ success: true, registered: false, verificationStatus: null });
    }
    const docs = await SupabaseDb.select<any>('provider_documents', `select=*&provider_id=eq.${encodeURIComponent(provider.id)}`);
    res.json({
      success: true,
      registered: true,
      data: mapProviderDto(provider, { documents: docs }),
      verificationStatus: provider.verification_status,
      isAcceptingBookings: provider.verification_status === 'APPROVED' && Boolean(provider.is_accepting_bookings),
      rejectionReason: provider.rejection_reason || null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/provider/documents/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const provider = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const { documentType, documentNumber, fileName, dataUrl } = req.body;
    const file = (req as any).file;
    if (!file && !dataUrl) {
      return res.status(400).json({ success: false, message: 'Document file or dataUrl is required' });
    }

    const ext = (file?.originalname || fileName || 'doc.jpg').split('.').pop() || 'jpg';
    const objectPath = `${provider.id}/${Date.now()}-${(documentType || 'kyc').toLowerCase()}.${ext}`;
    const uploaded = await SupabaseDb.uploadFile('kyc-documents', objectPath, {
      buffer: file?.buffer,
      contentType: file?.mimetype,
      dataUrl,
    });

    const doc = await SupabaseDb.insertOne<any>('provider_documents', {
      provider_id: provider.id,
      document_type: documentType || 'KYC_DOCUMENT',
      document_number: documentNumber || file?.originalname || fileName || 'Uploaded Document',
      file_url: uploaded.storagePath,
      is_verified: false,
    });

    if (provider.verification_status === 'NEEDS_INFO' || provider.verification_status === 'REJECTED') {
      await SupabaseDb.updateOne('provider_profiles', provider.id, {
        verification_status: 'PENDING',
        is_accepting_bookings: false,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      });
    }

    SupabaseDb.broadcastSync('providers_updated', { providerId: provider.id });
    res.status(201).json({ success: true, data: doc });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/provider/onboard', authenticateToken, async (req, res) => {
  try {
    const profile = await AuthService.getProfile(req.user!.userId);
    const result = await AuthService.registerProvider({
      ...req.body,
      userId: req.user!.userId,
      fullName: req.body.fullName || profile?.fullName || 'Service Provider',
      phone: req.body.phone || profile?.phone,
      email: req.body.email || profile?.email,
    });
    res.json({
      success: true,
      message: 'Provider KYC & onboarding submitted for Admin verification',
      data: result.provider,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   PROVIDER CUSTOM SERVICES & MENU MANAGEMENT (Swiggy Partner Style)
   ========================================================================== */

app.get('/api/provider/services', authenticateToken, async (req, res) => {
  try {
    const provider = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!provider) {
      return res.json({ success: true, data: [] });
    }

    const rates = await SupabaseDb.select<any>(
      'provider_service_rates',
      `select=*&provider_id=eq.${encodeURIComponent(provider.id)}&order=created_at.desc`
    );
    if (!rates || rates.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const servIds = Array.from(new Set(rates.map((r: any) => r.service_id).filter(Boolean)));
    const services = servIds.length > 0
      ? await SupabaseDb.select<any>('services', `select=*&id=in.(${servIds.join(',')})`)
      : [];
    const catIds = Array.from(new Set(services.map((s: any) => s.category_id).filter(Boolean)));
    const categories = catIds.length > 0
      ? await SupabaseDb.select<any>('categories', `select=*&id=in.(${catIds.join(',')})`)
      : [];

    const servMap = new Map(services.map((s: any) => [s.id, s]));
    const catMap = new Map(categories.map((c: any) => [c.id, c]));

    const mapped = rates.map((r: any) => {
      const s = servMap.get(r.service_id);
      const cat = s ? catMap.get(s.category_id) : null;
      return {
        id: r.id,
        rateId: r.id,
        serviceId: r.service_id,
        name: s?.name || 'Custom Service',
        description: s?.description || '',
        categoryName: cat?.name || 'General',
        categoryId: s?.category_id || '',
        customPrice: r.custom_price ?? s?.base_price ?? 499,
        basePrice: s?.base_price ?? 499,
        customDuration: r.custom_duration ?? s?.duration_minutes ?? 60,
        durationMinutes: s?.duration_minutes ?? 60,
        imageUrl: s?.image_url || null,
        approvalStatus: r.approval_status || 'PENDING',
        isActive: Boolean(r.is_active),
        createdAt: r.created_at || new Date().toISOString(),
      };
    });

    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/provider/services', authenticateToken, async (req, res) => {
  try {
    const provider = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found. Please register as provider first.' });
    }

    const { categoryId, serviceId, name, description, customPrice, price, customDuration, duration, imageUrl } = req.body;
    const finalPrice = Number(customPrice ?? price);
    const finalDuration = Number(customDuration ?? duration ?? 45);

    if (isNaN(finalPrice) || finalPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid price (₹)' });
    }

    let targetServiceId = serviceId;

    // If no serviceId, create a custom service in catalog under this category
    if (!targetServiceId) {
      if (!categoryId || !name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Service name and category are required' });
      }
      const createdService = await SupabaseStorageService.createService({
        name: name.trim(),
        category_id: categoryId,
        description: description?.trim() || `${name.trim()} offered by ${provider.business_name || 'Specialist'}`,
        base_price: finalPrice,
        duration_minutes: finalDuration,
        image_url: imageUrl || null,
      });
      if (!createdService) {
        return res.status(500).json({ success: false, message: 'Failed to create service entry' });
      }
      targetServiceId = createdService.id;
    }

    // Insert or update ProviderServiceRate in PENDING state (Swiggy partner approval model)
    const existingRate = await SupabaseDb.selectOne<any>(
      'provider_service_rates',
      `select=*&provider_id=eq.${encodeURIComponent(provider.id)}&service_id=eq.${encodeURIComponent(targetServiceId)}`
    );

    let rateRow: any;
    if (existingRate) {
      rateRow = await SupabaseDb.updateOne<any>('provider_service_rates', existingRate.id, {
        custom_price: finalPrice,
        custom_duration: finalDuration,
        approval_status: 'PENDING',
        is_active: false,
        updated_at: new Date().toISOString(),
      });
    } else {
      rateRow = await SupabaseDb.insertOne<any>('provider_service_rates', {
        provider_id: provider.id,
        service_id: targetServiceId,
        custom_price: finalPrice,
        custom_duration: finalDuration,
        approval_status: 'PENDING',
        is_active: false,
      });
    }

    // Notify provider
    await SupabaseDb.insertOne('notifications', {
      user_id: req.user!.userId,
      type: 'SYSTEM_ALERT',
      title: 'Service Submitted for Approval',
      message: `Your service "${name || 'Custom Service'}" (₹${finalPrice}) was submitted to Admin for review. It will become live once approved.`,
      data: { rateId: rateRow.id, status: 'PENDING' },
    }).catch(() => {});

    // Notify Admin & broadcast realtime sync
    SupabaseDb.broadcastSync('rates_updated', { providerId: provider.id, rateId: rateRow.id });
    SupabaseDb.broadcastSync('catalog_updated', { entity: 'rate_card', id: rateRow.id });

    res.status(201).json({
      success: true,
      message: 'Service submitted for Admin approval successfully',
      data: {
        ...rateRow,
        approvalStatus: 'PENDING',
        customPrice: finalPrice,
        customDuration: finalDuration,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/provider/services/:id', authenticateToken, async (req, res) => {
  try {
    const provider = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}`
    );
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    const removed = await SupabaseDb.remove(
      'provider_service_rates',
      `id=eq.${encodeURIComponent(req.params.id)}&provider_id=eq.${encodeURIComponent(provider.id)}`
    );
    SupabaseDb.broadcastSync('rates_updated', { providerId: provider.id, rateId: req.params.id });
    SupabaseDb.broadcastSync('catalog_updated', { entity: 'rate_card', id: req.params.id });

    res.json({ success: true, message: 'Service removed from menu', data: removed });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ALL ROUTES BELOW REQUIRE AN ADMIN-APPROVED PROVIDER ACCOUNT

app.get(
  '/api/provider/dashboard',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const provider = req.providerProfile!;
      const [bookings, earnings, reviews] = await Promise.all([
        BookingService.getProviderBookings(provider.id),
        SupabaseDb.select<any>('provider_earnings', `select=*&provider_id=eq.${encodeURIComponent(provider.id)}`),
        SupabaseDb.select<any>('reviews', `select=rating&provider_id=eq.${encodeURIComponent(provider.id)}`),
      ]);
      const todayStr = new Date().toISOString().split('T')[0];
      res.json({
        success: true,
        data: {
          provider,
          todayCount: bookings.filter((b: any) => b.date === todayStr).length,
          pendingRequests: bookings.filter((b: any) => b.status === 'PENDING' || b.status === 'AWAITING').length,
          completedCount: bookings.filter((b: any) => b.status === 'COMPLETED' || b.status === 'SETTLED').length,
          totalNetEarnings: earnings.reduce((acc, e) => acc + Number(e.net_earnings || 0), 0),
          ratingAvg: provider.ratingAvg,
          reviewsCount: reviews.length,
          recentBookings: bookings.slice(0, 15),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.patch(
  '/api/provider/accepting-bookings',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const { isAcceptingBookings } = req.body;
      const updated = await SupabaseDb.updateOne<any>('provider_profiles', req.providerProfile!.id, {
        is_accepting_bookings: Boolean(isAcceptingBookings),
        updated_at: new Date().toISOString(),
      });
      SupabaseDb.broadcastSync('providers_updated', { providerId: req.providerProfile!.id });
      res.json({ success: true, data: mapProviderDto(updated) });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

app.get(
  ['/api/bookings/provider', '/api/provider/bookings'],
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const bookings = await BookingService.getProviderBookings(
        req.providerProfile!.id,
        req.query.status as string
      );
      res.json({ success: true, data: bookings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.post(
  '/api/provider/bookings/:id/accept',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const booking = await BookingService.getBookingById(req.params.id);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      if (booking.providerId !== req.providerProfile!.id) {
        return res.status(403).json({ success: false, message: 'This booking belongs to another provider.' });
      }

      const updated = await BookingService.updateBookingStatus(
        booking.id,
        BookingStatus.CONFIRMED,
        'Provider accepted booking request',
        req.user!.userId
      );

      if (booking.customer?.userId) {
        await SupabaseDb.insertOne('notifications', {
          user_id: booking.customer.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Provider Confirmed Appointment',
          message: `Your appointment for ${booking.service?.name || 'Service'} on ${booking.date} at ${booking.startTime} is confirmed.`,
          data: { bookingId: booking.id },
        }).catch(() => { });
      }

      res.json({ success: true, message: 'Booking accepted', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

app.post(
  '/api/provider/bookings/:id/reject',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const { reason } = req.body;
      const booking = await BookingService.getBookingById(req.params.id);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      if (booking.providerId !== req.providerProfile!.id) {
        return res.status(403).json({ success: false, message: 'This booking belongs to another provider.' });
      }

      const updated = await BookingService.updateBookingStatus(
        booking.id,
        BookingStatus.DECLINED,
        reason || 'Provider unavailable',
        req.user!.userId
      );

      if (booking.customer?.userId) {
        await SupabaseDb.insertOne('notifications', {
          user_id: booking.customer.userId,
          type: 'SYSTEM_ALERT',
          title: 'Provider Unavailable',
          message: 'The requested provider is unavailable for this slot. Please select another available specialist.',
          data: { bookingId: booking.id },
        }).catch(() => { });
      }

      res.json({ success: true, message: 'Booking rejected', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

app.patch(
  ['/api/admin/bookings/:id/status', '/api/bookings/:id/status'],
  authenticateToken,
  async (req, res) => {
    try {
      const { status, reason } = req.body;
      const booking = await BookingService.getBookingById(req.params.id);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

      const userRoles = (req.user?.roles || []).map((r: any) => String(r).toUpperCase());
      const activeRole = String(req.user?.activeRole || '').toUpperCase();
      const isAdmin =
        userRoles.some((r: string) => ALL_ADMIN_ROLES.some((ar) => ar.toUpperCase() === r)) ||
        ALL_ADMIN_ROLES.some((ar) => ar.toUpperCase() === activeRole) ||
        userRoles.some((r: string) => r.includes('ADMIN')) ||
        activeRole.includes('ADMIN') ||
        req.path.includes('/admin/');

      if (!isAdmin) {
        const provider = await SupabaseDb.selectOne<any>(
          'provider_profiles',
          `select=id,verification_status&user_id=eq.${encodeURIComponent(req.user!.userId)}`
        );
        if (!provider || provider.verification_status !== 'APPROVED' || booking.providerId !== provider.id) {
          return res.status(403).json({
            success: false,
            code: 'PROVIDER_NOT_APPROVED',
            message: 'Only the assigned, Admin-approved provider or an administrator may update booking status.',
          });
        }
      }

      const updated = await BookingService.updateBookingStatus(
        booking.id,
        status as BookingStatus,
        reason,
        req.user!.userId
      );
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('[Update Booking Status Error]', err?.message || err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

app.post(
  '/api/bookings/:id/verify-otp',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const { otp } = req.body;
      if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

      const booking = await BookingService.getBookingById(req.params.id);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      if (booking.providerId !== req.providerProfile!.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Booking belongs to another provider.' });
      }

      if (!booking.serviceOtp || booking.serviceOtp !== String(otp).trim()) {
        return res.status(400).json({ success: false, message: 'Invalid service verification OTP' });
      }

      const updated = await BookingService.updateBookingStatus(
        booking.id,
        BookingStatus.COMPLETED,
        'Service verified and completed via Customer OTP',
        req.user!.userId
      );
      res.json({ success: true, message: 'Service verified and completed successfully', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/provider/availability',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const rows = await SupabaseDb.select<any>(
        'provider_working_hours',
        `select=*&provider_id=eq.${encodeURIComponent(req.providerProfile!.id)}&order=day_of_week.asc`
      );
      res.json({ success: true, data: rows.map(mapWorkingHourDto) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.put(
  '/api/provider/availability',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const { schedule } = req.body;
      if (!Array.isArray(schedule)) {
        return res.status(400).json({ success: false, message: 'schedule array is required' });
      }

      const rows = schedule.map((item: any) => ({
        provider_id: req.providerProfile!.id,
        day_of_week: Number(item.dayOfWeek),
        open_time: normalizeTimeTo24h(item.openTime || item.open, '09:00'),
        close_time: normalizeTimeTo24h(item.closeTime || item.close, '19:00'),
        break_start: item.breakStart ? normalizeTimeTo24h(item.breakStart) : null,
        break_end: item.breakEnd ? normalizeTimeTo24h(item.breakEnd) : null,
        is_closed: Boolean(item.isClosed),
      }));

      const saved = await SupabaseDb.upsert<any>('provider_working_hours', rows, 'provider_id,day_of_week');
      SupabaseDb.broadcastSync('providers_updated', { providerId: req.providerProfile!.id });
      res.json({ success: true, data: saved.map(mapWorkingHourDto) });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/provider/earnings',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const earnings = await SupabaseDb.select<any>(
        'provider_earnings',
        `select=*&provider_id=eq.${encodeURIComponent(req.providerProfile!.id)}&order=created_at.desc`
      );
      const totalNet = earnings.reduce((acc, curr) => acc + Number(curr.net_earnings || 0), 0);
      const totalGross = earnings.reduce((acc, curr) => acc + Number(curr.gross_amount || 0), 0);
      const totalPlatformFee = earnings.reduce((acc, curr) => acc + Number(curr.platform_fee || 0), 0);
      res.json({
        success: true,
        data: {
          totalNet,
          totalGross,
          totalPlatformFee,
          history: earnings.map((e) => ({
            id: e.id,
            bookingId: e.booking_id,
            grossAmount: Number(e.gross_amount || 0),
            platformFee: Number(e.platform_fee || 0),
            netEarnings: Number(e.net_earnings || 0),
            isSettled: Boolean(e.is_settled),
            settledAt: e.settled_at,
            createdAt: e.created_at,
          })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/provider/reviews',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const reviews = await SupabaseDb.select<any>(
        'reviews',
        `select=*&provider_id=eq.${encodeURIComponent(req.providerProfile!.id)}&order=created_at.desc`
      );
      const custIds = Array.from(new Set(reviews.map((r) => r.customer_id).filter(Boolean)));
      const custs = custIds.length > 0 ? await SupabaseDb.select<any>('customer_profiles', `select=id,user_id&id=in.(${custIds.join(',')})`) : [];
      const userIds = Array.from(new Set(custs.map((c) => c.user_id).filter(Boolean)));
      const users = userIds.length > 0 ? await SupabaseDb.select<any>('users', `select=id,full_name,avatar_url&id=in.(${userIds.join(',')})`) : [];
      const userMap = new Map(users.map((u) => [u.id, u]));
      const custMap = new Map(custs.map((c) => [c.id, userMap.get(c.user_id)]));

      res.json({
        success: true,
        data: {
          ratingAvg: req.providerProfile!.ratingAvg,
          ratingCount: req.providerProfile!.ratingCount,
          reviews: reviews.map((r) => ({
            ...r,
            customer: { user: custMap.get(r.customer_id) || { full_name: 'Customer' } },
          })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/provider/branches',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const branches = await SupabaseDb.select<any>(
        'provider_branches',
        `select=*&provider_id=eq.${encodeURIComponent(req.providerProfile!.id)}&order=created_at.asc`
      );
      res.json({ success: true, data: branches });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.post(
  '/api/provider/branches',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const { name, address, city, phone } = req.body;
      if (!name || !address || !city) {
        return res.status(400).json({ success: false, message: 'name, address, and city are required' });
      }
      const branch = await SupabaseDb.insertOne<any>('provider_branches', {
        provider_id: req.providerProfile!.id,
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        phone: phone || null,
      });
      res.status(201).json({ success: true, data: branch });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/provider/staff',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const [staff, branches] = await Promise.all([
        SupabaseDb.select<any>('provider_staff', `select=*&provider_id=eq.${encodeURIComponent(req.providerProfile!.id)}&order=name.asc`),
        SupabaseDb.select<any>('provider_branches', `select=*&provider_id=eq.${encodeURIComponent(req.providerProfile!.id)}`),
      ]);
      const branchMap = new Map(branches.map((b) => [b.id, b]));
      res.json({
        success: true,
        data: staff.map((s) => ({ ...s, branch: branchMap.get(s.branch_id) || null })),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.post(
  '/api/provider/staff',
  authenticateToken,
  requireRole([UserRole.PROVIDER]),
  requireApprovedProvider,
  async (req, res) => {
    try {
      const { name, specialty, branchId, workingDays } = req.body;
      if (!name || !specialty) {
        return res.status(400).json({ success: false, message: 'name and specialty are required' });
      }
      const staffMember = await SupabaseDb.insertOne<any>('provider_staff', {
        provider_id: req.providerProfile!.id,
        name: name.trim(),
        specialty: specialty.trim(),
        working_days: workingDays || 'Mon,Tue,Wed,Thu,Fri,Sat',
        branch_id: branchId || null,
      });
      res.status(201).json({ success: true, data: staffMember });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

/* ==========================================================================
   ADMIN MANAGEMENT ROUTES
   ========================================================================== */

const ALL_ADMIN_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
  UserRole.OPERATIONS_ADMIN,
  UserRole.FINANCE_ADMIN,
  UserRole.SUPPORT_ADMIN,
];

app.post('/api/admin/auth/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/phone and password are required' });
    }
    const result = await AuthService.adminLogin(email, password);
    res.json({
      success: true,
      token: result.accessToken,
      ...result,
    });
  } catch (err: any) {
    console.error('[Admin Login Error]', err?.message || err);
    res.status(401).json({ success: false, message: err.message || 'Invalid administrator credentials' });
  }
});

app.get('/api/admin/auth/me', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (req, res) => {
  try {
    const profile = await AuthService.getProfile(req.user!.userId);
    if (!profile || profile.isActive === false) {
      return res.status(401).json({ success: false, message: 'Administrator session is no longer active' });
    }
    res.json({
      success: true,
      user: {
        ...profile,
        activeRole: req.user!.activeRole || profile.roles?.[0] || UserRole.ADMIN,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/auth/forgot-password', otpRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address or mobile number is required' });
    }
    const result = await AuthService.requestAdminPasswordReset(email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/auth/reset-password', authRateLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email/phone, verification code, and new password are required',
      });
    }
    const result = await AuthService.resetAdminPassword(email, otp, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/auth/profile', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (req, res) => {
  try {
    const updated = await AuthService.updateAdminProfile(req.user!.userId, req.body);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/auth/change-password', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changeAdminPassword(req.user!.userId, currentPassword, newPassword);
    res.json({ success: true, message: 'Administrator password updated successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', authenticateToken, requireRole([UserRole.SUPERADMIN, UserRole.ADMIN]), async (_req, res) => {
  try {
    const users = await AuthService.listAdminUsers();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/users', authenticateToken, requireRole([UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { email, fullName, phone, role, password } = req.body;
    if (!email || !fullName || !role) {
      return res.status(400).json({ success: false, message: 'email, fullName, and role are required' });
    }
    const user = await AuthService.inviteAdminUser(email, fullName, phone || '', role, password);
    res.status(201).json({ success: true, message: 'Admin user created successfully', data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/users/:id', authenticateToken, requireRole([UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const user = await AuthService.updateAdminUser(req.params.id, req.body);
    res.json({ success: true, message: 'Admin user updated', data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/metrics', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const metrics = await AdminService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/providers', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const { status, search } = req.query;
    const providers = await AdminService.getProviders(status as string, search as string);
    res.json({ success: true, data: providers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/providers/:id/details', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const details = await AdminService.getProviderDetails(req.params.id);
    if (!details) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: details });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/providers/:id/verify', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!action || !['APPROVE', 'REJECT', 'REQUEST_CLARITY'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid action (APPROVE, REJECT, REQUEST_CLARITY) required' });
    }
    const updated = await AdminService.verifyProvider(req.params.id, action, req.user!.userId, reason);
    res.json({ success: true, message: `Provider status updated (${action})`, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/providers/:id/accepting-bookings', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const { isAcceptingBookings } = req.body;
    const updated = await AdminService.toggleProviderAcceptingBookings(
      req.params.id,
      Boolean(isAcceptingBookings),
      req.user!.userId
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/documents/:docId/verify', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const { isVerified } = req.body;
    const updated = await AdminService.verifyDocument(req.params.docId, Boolean(isVerified), req.user!.userId);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/documents/:docId/signed-url', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.OPERATIONS_ADMIN]), async (req, res) => {
  try {
    const doc = await SupabaseDb.selectOne<any>('provider_documents', `select=*&id=eq.${encodeURIComponent(req.params.docId)}`);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    const signedUrl = await SupabaseDb.createSignedUrl(doc.file_url, 3600);
    res.json({ success: true, signedUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/notifications', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const list = await AdminService.getBroadcastNotifications();
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/notifications/broadcast', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    const { title, message, body, audience } = req.body;
    const resolvedMessage = message || body;
    if (!title || !resolvedMessage) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const roleFilter =
      audience === 'Customers' ? 'CUSTOMER' : audience === 'Service Providers' ? 'PROVIDER' : null;
    let targetUserIds: string[] = [];

    if (roleFilter) {
      const roles = await SupabaseDb.select<any>('user_roles', `select=user_id&role=eq.${roleFilter}`);
      targetUserIds = Array.from(new Set(roles.map((r) => r.user_id)));
    } else {
      const users = await SupabaseDb.select<any>('users', 'select=id&is_active=eq.true');
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length > 0) {
      await SupabaseDb.insert(
        'notifications',
        targetUserIds.map((uid) => ({
          user_id: uid,
          type: 'SYSTEM_ALERT',
          title,
          message: resolvedMessage,
          data: { audience: audience || 'All', broadcast: true },
        }))
      );
      SupabaseDb.broadcastSync('notifications_updated', { broadcast: true });
    }

    await SupabaseDb.insertOne('audit_logs', {
      user_id: req.user!.userId,
      action: 'NOTIFICATION_BROADCAST_SENT',
      entity_type: 'Notification',
      entity_id: audience || 'All',
      details: JSON.stringify({ title, deliveredCount: targetUserIds.length }),
    }).catch(() => { });

    res.json({ success: true, deliveredCount: targetUserIds.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/bookings', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (req, res) => {
  try {
    const bookings = await AdminService.getAllBookings(req.query.status as string);
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/commission', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN]), async (_req, res) => {
  try {
    const settings = await AdminService.getCommissionSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/commission', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN]), async (req, res) => {
  try {
    const { rate, type, categoryId } = req.body;
    const setting = await AdminService.setCommission(Number(rate), type as CommissionType, categoryId);
    res.json({ success: true, message: 'Commission setting created', data: setting });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/audit-logs', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const logs = await AdminService.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/customers', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (req, res) => {
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

app.get('/api/admin/rates', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
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

app.get('/api/admin/refunds', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const refunds = await AdminService.getRefunds();
    res.json({ success: true, data: refunds });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/payouts', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN]), async (_req, res) => {
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

app.get('/api/admin/support/tickets', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (req, res) => {
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
    const ticket = await AdminService.resolveSupportTicket(
      req.params.id,
      resolution || 'Resolved by Administrator',
      req.user!.userId
    );
    res.json({ success: true, message: 'Support ticket resolved', data: ticket });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin Banners, Settings, Coupons, Reviews
app.get('/api/admin/banners', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const banners = await AdminService.getBanners(false);
    res.json({ success: true, data: banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/banners', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const created = await AdminService.createBanner(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/banners/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const updated = await AdminService.updateBanner(req.params.id, req.body, req.user!.userId);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/banners/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    await AdminService.deleteBanner(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/settings', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const settings = await AdminService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/settings/:key', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const updated = await AdminService.updateSetting(req.params.key, req.body, req.user!.userId);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/coupons', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const coupons = await SupabaseDb.select<any>('coupons', 'select=*&order=created_at.desc');
    res.json({ success: true, data: coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/coupons', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const { code, discount_type, value, min_order_amount, max_discount_amount, usage_limit, expires_at } = req.body;
    const created = await SupabaseDb.insertOne<any>('coupons', {
      code: String(code || '').toUpperCase().trim(),
      discount_type: discount_type || 'PERCENTAGE',
      value: Number(value || 10),
      min_order_amount: Number(min_order_amount || 0),
      max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
      usage_limit: usage_limit ? Number(usage_limit) : null,
      expires_at: expires_at || null,
      is_active: true,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/coupons/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    const updated = await SupabaseDb.updateOne<any>('coupons', req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/coupons/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]), async (req, res) => {
  try {
    await SupabaseDb.remove('coupons', `id=eq.${encodeURIComponent(req.params.id)}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/reviews', authenticateToken, requireRole(ALL_ADMIN_ROLES), async (_req, res) => {
  try {
    const reviews = await SupabaseDb.select<any>('reviews', 'select=*&order=created_at.desc');
    res.json({ success: true, data: reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/reviews/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT_ADMIN]), async (req, res) => {
  try {
    await SupabaseDb.remove('reviews', `id=eq.${encodeURIComponent(req.params.id)}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ==========================================================================
   SUPPORT TICKETS, NOTIFICATIONS & PAYMENTS
   ========================================================================== */

app.get('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await SupabaseDb.select<any>(
      'support_tickets',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}&order=updated_at.desc`
    );
    const ids = tickets.map((t) => t.id);
    const msgs =
      ids.length > 0
        ? await SupabaseDb.select<any>('ticket_messages', `select=*&ticket_id=in.(${ids.join(',')})&order=created_at.asc`).catch(() => [])
        : [];
    res.json({
      success: true,
      data: tickets.map((t) => ({
        ...t,
        ticketRef: t.ticket_ref,
        messages: msgs.filter((m) => m.ticket_id === t.id),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const { bookingId, category, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }
    const ticketRef = `TKT-${Date.now().toString().slice(-6)}`;
    const ticket = await SupabaseDb.insertOne<any>('support_tickets', {
      ticket_ref: ticketRef,
      user_id: req.user!.userId,
      booking_id: bookingId || null,
      category: category || 'GENERAL',
      subject: subject.trim(),
      status: 'OPEN',
      priority: 'MEDIUM',
    });

    await SupabaseDb.insertOne('ticket_messages', {
      ticket_id: ticket.id,
      sender_id: req.user!.userId,
      sender_role: req.user!.activeRole || 'CUSTOMER',
      message: message.trim(),
    }).catch(() => { });

    res.status(201).json({ success: true, data: { ...ticket, ticketRef } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/support/tickets/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    const ticket = await SupabaseDb.selectOne<any>('support_tickets', `select=*&id=eq.${encodeURIComponent(req.params.id)}`);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const isAdmin = req.user!.roles.some((r) => ALL_ADMIN_ROLES.includes(r));
    if (!isAdmin && ticket.user_id !== req.user!.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const reply = await SupabaseDb.insertOne<any>('ticket_messages', {
      ticket_id: ticket.id,
      sender_id: req.user!.userId,
      sender_role: req.user!.activeRole || 'CUSTOMER',
      message: message.trim(),
    });
    res.json({ success: true, data: reply });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await SupabaseDb.select<any>(
      'notifications',
      `select=*&user_id=eq.${encodeURIComponent(req.user!.userId)}&order=created_at.desc&limit=30`
    );
    res.json({ success: true, data: notifications.map(mapNotificationDto) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const updated = await SupabaseDb.update(
      'notifications',
      `id=eq.${encodeURIComponent(req.params.id)}&user_id=eq.${encodeURIComponent(req.user!.userId)}`,
      { is_read: true }
    );
    res.json({ success: true, data: updated[0] ? mapNotificationDto(updated[0]) : null });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/payments/create-order', authenticateToken, async (req, res) => {
  try {
    const { amount, bookingRef } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }
    const order = await PaymentService.createOrder(Number(amount), bookingRef);
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/payments/verify-signature', authenticateToken, async (req, res) => {
  try {
    const { orderId, paymentId, signature, bookingId } = req.body;
    const result = await PaymentService.verifyAndMarkBookingPaid(orderId, paymentId, signature, bookingId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, verified: false, message: err.message });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || (req.body?.signature as string) || '';
    const result = await PaymentService.handleWebhook(req.body, signature);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/payments/refund', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.FINANCE_ADMIN]), async (req, res) => {
  try {
    const { bookingId, reason, amount } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId is required' });
    const refund = await PaymentService.initiateRefund(bookingId, reason, amount ? Number(amount) : undefined);
    res.json({ success: true, data: refund });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

if (process.env.DISABLE_WORKERS !== 'true') {
  SlotCleanupWorker.start(30000);
}

if (require.main === module) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Quick Appointments API] Single-DB Supabase PostgreSQL Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
