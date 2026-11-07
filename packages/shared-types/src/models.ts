import {
  UserRole,
  ProviderType,
  VerificationStatus,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  CommissionType,
  NotificationType,
} from './enums';

export interface User {
  id: string;
  phone: string;
  email?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  roles: UserRole[];
  activeRole: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  city?: string | null;
  defaultAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  providerType: ProviderType;
  businessName?: string | null;
  tagline?: string | null;
  bio?: string | null;
  experienceYears: number;
  ratingAvg: number;
  ratingCount: number;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  isAcceptingBookings: boolean;
  city: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm: number;
  documents?: ProviderDocument[];
  workingHours?: ProviderWorkingHour[];
  user?: User;
}

export interface ProviderDocument {
  id: string;
  providerId: string;
  documentType: string;
  documentNumber?: string;
  fileUrl: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ProviderWorkingHour {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  openTime: string;  // "09:00"
  closeTime: string; // "18:00"
  isClosed: boolean;
  breakStart?: string | null; // "13:00"
  breakEnd?: string | null;   // "14:00"
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  servicesCount?: number;
}

export interface Service {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  basePrice: number;
  imageUrl?: string | null;
  isActive: boolean;
  ratingAvg?: number;
}

export interface ProviderServiceRate {
  id: string;
  providerId: string;
  serviceId: string;
  customPrice?: number | null;
  customDuration?: number | null;
  isActive: boolean;
  service?: Service;
}

export interface TimeSlot {
  time: string;           // "10:00"
  isAvailable: boolean;
  reason?: string;        // "Booked", "Break", "Past"
  reservationId?: string;
}

export interface SlotReservation {
  id: string;
  providerId: string;
  serviceId: string;
  customerId: string;
  date: string;          // "YYYY-MM-DD"
  startTime: string;     // "10:00"
  endTime: string;       // "11:00"
  expiresAt: string;     // ISO timestamp
  isReleased: boolean;
}

export interface Booking {
  id: string;
  bookingRef: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  status: BookingStatus;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  
  // Financial breakdown
  servicePrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  platformCommission: number;
  providerEarnings: number;
  
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentRef?: string | null;
  
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string | null;
  };
  provider?: {
    id: string;
    businessName?: string | null;
    fullName: string;
    phone: string;
    ratingAvg: number;
    city: string;
    address: string;
  };
  service?: {
    id: string;
    name: string;
    durationMinutes: number;
    imageUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSetting {
  id: string;
  type: CommissionType;
  rate: number; // e.g. 10 (%) or fixed 100
  categoryId?: string | null;
  providerId?: string | null;
  isActive: boolean;
  effectiveFrom: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  totalCustomers: number;
  totalProviders: number;
  activeProviders: number;
  pendingVerifications: number;
  totalBookings: number;
  todayBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  grossRevenue: number;
  platformCommission: number;
  netProviderPayout: number;
}

