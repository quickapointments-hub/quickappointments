import { z } from 'zod';
import { ProviderType, PaymentMethod, BookingStatus } from './enums';

export const RequestOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
});

export const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  fullName: z.string().min(2).optional(),
});

export const ProviderOnboardingSchema = z.object({
  providerType: z.nativeEnum(ProviderType),
  businessName: z.string().min(2).optional(),
  tagline: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  experienceYears: z.number().min(0).max(50),
  city: z.string().min(2),
  address: z.string().min(5),
  serviceRadiusKm: z.number().min(1).max(100).default(20),
  categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
});

export const ReserveSlotSchema = z.object({
  providerId: z.string().uuid().or(z.string().min(1)),
  serviceId: z.string().uuid().or(z.string().min(1)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
});

export const ConfirmBookingSchema = z.object({
  reservationToken: z.string().min(1),
  notes: z.string().max(300).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH_ON_SERVICE),
  couponCode: z.string().optional(),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  reason: z.string().max(300).optional(),
});

export const WorkingHourUpdateSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean(),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
});

export const CommissionSettingSchema = z.object({
  type: z.enum(['PERCENTAGE', 'FIXED']),
  rate: z.number().positive(),
  categoryId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  effectiveFrom: z.string().optional(),
});

