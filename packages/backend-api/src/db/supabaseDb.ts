import { UserRole } from '@quick-appointments/shared-types';

export class SupabaseDbError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message);
    this.name = 'SupabaseDbError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeTimeTo24h(raw?: string | null, fallback = '09:00'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().toUpperCase();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const mer = ampmMatch[3];
    if (mer === 'PM' && h < 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    if (Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  const plainMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (plainMatch) {
    const h = parseInt(plainMatch[1], 10);
    const m = parseInt(plainMatch[2], 10);
    if (Number.isFinite(h) && Number.isFinite(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return fallback;
}

export function normalizePhone10(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function encodeFilterVal(val: string | number | boolean): string {
  return encodeURIComponent(String(val));
}

export class SupabaseDb {
  static get url(): string {
    const val = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    if (!val) {
      throw new SupabaseDbError('SUPABASE_URL is not configured in environment.', 500, 'ENV_MISSING');
    }
    return val;
  }

  static get serviceRoleKey(): string {
    const val = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!val) {
      throw new SupabaseDbError(
        'SUPABASE_SERVICE_ROLE_KEY is required on Backend API for authoritative database access.',
        500,
        'ENV_MISSING'
      );
    }
    return val;
  }

  private static headers(extra: Record<string, string> = {}): Record<string, string> {
    const key = this.serviceRoleKey;
    return {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  static async rest<T = any>(pathWithQuery: string, init: RequestInit = {}): Promise<{ data: T; count: number | null }> {
    const url = `${this.url}/rest/v1/${pathWithQuery.replace(/^\/+/, '')}`;
    const res = await fetch(url, {
      ...init,
      headers: this.headers((init.headers as Record<string, string>) || {}),
    });

    const text = await res.text();
    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const msg = parsed?.message || parsed?.error || res.statusText || 'Supabase request failed';
      throw new SupabaseDbError(msg, res.status, parsed?.code, parsed);
    }

    let totalCount: number | null = null;
    const contentRange = res.headers.get('content-range');
    if (contentRange && contentRange.includes('/')) {
      const parts = contentRange.split('/');
      const rawTotal = parseInt(parts[1], 10);
      if (Number.isFinite(rawTotal)) totalCount = rawTotal;
    }

    return { data: parsed as T, count: totalCount };
  }

  static async select<T = any>(table: string, queryString = 'select=*'): Promise<T[]> {
    const { data } = await this.rest<T[]>(`${table}?${queryString}`);
    return Array.isArray(data) ? data : [];
  }

  static async selectOne<T = any>(table: string, queryString = 'select=*&limit=1'): Promise<T | null> {
    const hasLimit = /(^|&)limit=/.test(queryString);
    const finalQuery = hasLimit ? queryString : `${queryString}&limit=1`;
    const rows = await this.select<T>(table, finalQuery);
    return rows[0] || null;
  }

  static async count(table: string, filterQuery = ''): Promise<number> {
    const qs = filterQuery ? `select=id&${filterQuery}` : 'select=id';
    const { count } = await this.rest<any[]>(`${table}?${qs}&limit=1`, {
      method: 'GET',
      headers: { Prefer: 'count=exact' },
    });
    return count ?? 0;
  }

  static async insert<T = any>(table: string, rows: Record<string, any> | Record<string, any>[]): Promise<T[]> {
    const { data } = await this.rest<T[]>(table, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(rows),
    });
    return Array.isArray(data) ? data : [data];
  }

  static async insertOne<T = any>(table: string, row: Record<string, any>): Promise<T> {
    const rows = await this.insert<T>(table, row);
    if (!rows[0]) throw new SupabaseDbError(`Insert into ${table} returned empty row`, 500);
    return rows[0];
  }

  static async upsert<T = any>(
    table: string,
    rows: Record<string, any> | Record<string, any>[],
    onConflict: string
  ): Promise<T[]> {
    const { data } = await this.rest<T[]>(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(rows),
    });
    return Array.isArray(data) ? data : [data];
  }

  static async update<T = any>(
    table: string,
    filterQuery: string,
    patch: Record<string, any>
  ): Promise<T[]> {
    const { data } = await this.rest<T[]>(`${table}?${filterQuery}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  static async updateOne<T = any>(
    table: string,
    id: string,
    patch: Record<string, any>
  ): Promise<T | null> {
    const rows = await this.update<T>(table, `id=eq.${encodeFilterVal(id)}`, patch);
    return rows[0] || null;
  }

  static async remove(table: string, filterQuery: string): Promise<any[]> {
    const { data } = await this.rest<any[]>(`${table}?${filterQuery}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    });
    return Array.isArray(data) ? data : [];
  }

  static async rpc<T = any>(fnName: string, params: Record<string, any> = {}): Promise<T> {
    const { data } = await this.rest<T>(`rpc/${fnName}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data;
  }

  // ===========================================================================
  // SUPABASE STORAGE (Authoritative File Uploads & Signed Admin Previews)
  // ===========================================================================
  static async uploadFile(
    bucket: 'kyc-documents' | 'service-images' | 'avatars',
    objectPath: string,
    input: { buffer?: Buffer; dataUrl?: string; contentType?: string }
  ): Promise<{ storagePath: string; publicUrl: string | null }> {
    let buffer: Buffer;
    let mimeType = input.contentType || 'application/octet-stream';

    if (input.buffer) {
      buffer = input.buffer;
    } else if (input.dataUrl && input.dataUrl.startsWith('data:')) {
      const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        throw new SupabaseDbError('Invalid base64 data URL for file upload', 400, 'INVALID_FILE');
      }
      mimeType = match[1];
      buffer = Buffer.from(match[2], 'base64');
    } else {
      throw new SupabaseDbError('Upload requires either binary file buffer or base64 dataUrl', 400, 'INVALID_FILE');
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      throw new SupabaseDbError(`Unsupported file type: ${mimeType}. Allowed: JPG, PNG, WEBP, PDF.`, 400, 'INVALID_MIME');
    }
    if (buffer.length === 0 || buffer.length > 6 * 1024 * 1024) {
      throw new SupabaseDbError('File must be non-empty and under 6MB.', 400, 'FILE_TOO_LARGE');
    }

    const cleanPath = objectPath.replace(/^\/+/, '');
    const uploadUrl = `${this.url}/storage/v1/object/${bucket}/${cleanPath}`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new SupabaseDbError(`Storage upload failed (${res.status}): ${errBody}`, res.status, 'STORAGE_UPLOAD_FAILED');
    }

    const storagePath = `${bucket}/${cleanPath}`;
    const publicUrl =
      bucket === 'kyc-documents'
        ? null
        : `${this.url}/storage/v1/object/public/${bucket}/${cleanPath}`;

    return { storagePath, publicUrl };
  }

  static async createSignedUrl(fileUrlOrPath: string, expiresInSeconds = 3600): Promise<string> {
    if (!fileUrlOrPath) return '';
    if (fileUrlOrPath.startsWith('data:') || fileUrlOrPath.startsWith('http://') && !fileUrlOrPath.includes('/storage/v1/')) {
      return fileUrlOrPath;
    }

    let bucket = '';
    let objectPath = '';

    if (fileUrlOrPath.startsWith('kyc-documents/')) {
      bucket = 'kyc-documents';
      objectPath = fileUrlOrPath.slice('kyc-documents/'.length);
    } else if (fileUrlOrPath.includes('/storage/v1/object/')) {
      const m = fileUrlOrPath.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(\?.*)?$/);
      if (m) {
        bucket = m[1];
        objectPath = m[2];
      }
    }

    if (!bucket || !objectPath || bucket !== 'kyc-documents') {
      return fileUrlOrPath;
    }

    const res = await fetch(`${this.url}/storage/v1/object/sign/${bucket}/${objectPath}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!res.ok) {
      return fileUrlOrPath;
    }

    const data: any = await res.json().catch(() => ({}));
    if (data?.signedURL) {
      return `${this.url}/storage/v1${data.signedURL}`;
    }
    return fileUrlOrPath;
  }

  // ===========================================================================
  // REALTIME BROADCAST (Authorized Backend -> Realtime Invalidation Signal)
  // ===========================================================================
  static broadcastSync(event: string, payload: Record<string, any> = {}): void {
    try {
      const url = `${this.url}/realtime/v1/api/broadcast`;
      fetch(url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          messages: [
            {
              topic: 'quick-appointments-sync',
              event,
              payload: { ...payload, timestamp: Date.now() },
            },
          ],
        }),
      }).catch(() => {});
    } catch {
      // Non-blocking best-effort broadcast
    }
  }
}

// ============================================================================
// CANONICAL ENTITY MAPPERS (PostgreSQL snake_case -> Unified API DTOs)
// ============================================================================

export function mapUserDto(row: any, extras: { roles?: UserRole[]; customer?: any; provider?: any } = {}) {
  if (!row) return null;
  const roleList: UserRole[] =
    extras.roles ||
    (Array.isArray(row.user_roles) ? row.user_roles.map((r: any) => r.role as UserRole) : []);
  return {
    id: row.id,
    phone: row.phone,
    email: row.email || null,
    fullName: row.full_name,
    full_name: row.full_name,
    avatarUrl: row.avatar_url || null,
    avatar_url: row.avatar_url || null,
    isActive: row.is_active !== false,
    is_active: row.is_active !== false,
    roles: roleList,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(extras.customer !== undefined ? { customer: extras.customer, customerProfile: extras.customer } : {}),
    ...(extras.provider !== undefined ? { provider: extras.provider, providerProfile: extras.provider } : {}),
  };
}

export function mapCustomerDto(row: any, userRow?: any, bookingCount?: number) {
  if (!row) return null;
  const userObj = userRow || row.user || null;
  return {
    id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    city: row.city || 'Hyderabad',
    defaultAddress: row.default_address || null,
    default_address: row.default_address || null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    notes: row.notes || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: userObj ? mapUserDto(userObj) : undefined,
    ...(bookingCount !== undefined ? { _count: { bookings: bookingCount }, bookingsCount: bookingCount } : {}),
  };
}

export function mapDocumentDto(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    providerId: row.provider_id,
    provider_id: row.provider_id,
    documentType: row.document_type,
    document_type: row.document_type,
    documentNumber: row.document_number,
    document_number: row.document_number,
    fileUrl: row.file_url,
    file_url: row.file_url,
    isVerified: Boolean(row.is_verified),
    is_verified: Boolean(row.is_verified),
    createdAt: row.created_at,
  };
}

export function mapWorkingHourDto(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    providerId: row.provider_id,
    dayOfWeek: Number(row.day_of_week),
    openTime: normalizeTimeTo24h(row.open_time, '09:00'),
    closeTime: normalizeTimeTo24h(row.close_time, '19:00'),
    breakStart: row.break_start ? normalizeTimeTo24h(row.break_start) : null,
    breakEnd: row.break_end ? normalizeTimeTo24h(row.break_end) : null,
    isClosed: Boolean(row.is_closed),
  };
}

export function mapProviderDto(row: any, extras: {
  user?: any;
  documents?: any[];
  workingHours?: any[];
  customServices?: any[];
  bookingCount?: number;
} = {}) {
  if (!row) return null;
  const userSrc = extras.user || row.user;
  const docsSrc = extras.documents || row.documents || [];
  const whSrc = extras.workingHours || row.working_hours || [];
  const ratesSrc = extras.customServices || row.provider_service_rates || [];
  return {
    id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    providerType: row.provider_type || 'INDIVIDUAL',
    provider_type: row.provider_type || 'INDIVIDUAL',
    businessName: row.business_name,
    business_name: row.business_name,
    tagline: row.tagline || null,
    bio: row.bio || null,
    experienceYears: Number(row.experience_years ?? 1),
    experience_years: Number(row.experience_years ?? 1),
    ratingAvg: Number(row.rating_avg ?? 5.0),
    rating_avg: Number(row.rating_avg ?? 5.0),
    ratingCount: Number(row.rating_count ?? 0),
    rating_count: Number(row.rating_count ?? 0),
    verificationStatus: row.verification_status || 'PENDING',
    verification_status: row.verification_status || 'PENDING',
    rejectionReason: row.rejection_reason ?? null,
    rejection_reason: row.rejection_reason ?? null,
    isAcceptingBookings: row.verification_status === 'APPROVED' && Boolean(row.is_accepting_bookings),
    is_accepting_bookings: row.verification_status === 'APPROVED' && Boolean(row.is_accepting_bookings),
    city: row.city || 'Hyderabad',
    address: row.address || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    googleMapsLink: row.google_maps_link || row.googleMapsLink || (Array.isArray(docsSrc) ? docsSrc.find((d: any) => d.document_type === 'GOOGLE_MAPS')?.file_url : null) || null,
    google_maps_link: row.google_maps_link || row.googleMapsLink || (Array.isArray(docsSrc) ? docsSrc.find((d: any) => d.document_type === 'GOOGLE_MAPS')?.file_url : null) || null,
    serviceRadiusKm: Number(row.service_radius_km ?? 10),
    service_radius_km: Number(row.service_radius_km ?? 10),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fullName: userSrc?.full_name || userSrc?.fullName || row.business_name || null,
    phone: userSrc?.phone || row.phone || null,
    email: userSrc?.email || row.email || null,
    user: userSrc ? mapUserDto(userSrc) : undefined,
    documents: Array.isArray(docsSrc) ? docsSrc.map(mapDocumentDto) : [],
    workingHours: Array.isArray(whSrc) ? whSrc.map(mapWorkingHourDto) : [],
    customServices: Array.isArray(ratesSrc) ? ratesSrc : [],
    ...(extras.bookingCount !== undefined ? { _count: { bookings: extras.bookingCount }, bookingsCount: extras.bookingCount } : {}),
  };
}

export function extractServiceOtpFromNotes(notes?: string | null): { cleanNotes: string; otp: string | null } {
  if (!notes) return { cleanNotes: '', otp: null };
  const match = notes.match(/\[QA_OTP:(\d{4,6})\]/);
  if (!match) return { cleanNotes: notes, otp: null };
  return {
    cleanNotes: notes.replace(/\s*\[QA_OTP:\d{4,6}\]/g, '').trim(),
    otp: match[1],
  };
}

export function mapBookingDto(row: any, extras: {
  service?: any;
  customer?: any;
  provider?: any;
  statusHistory?: any[];
} = {}) {
  if (!row) return null;
  const { cleanNotes, otp: notesOtp } = extractServiceOtpFromNotes(row.notes);
  return {
    id: row.id,
    bookingRef: row.booking_ref,
    booking_ref: row.booking_ref,
    customerId: row.customer_id,
    customer_id: row.customer_id,
    providerId: row.provider_id,
    provider_id: row.provider_id,
    serviceId: row.service_id,
    service_id: row.service_id,
    status: row.status,
    date: row.date,
    startTime: row.start_time,
    start_time: row.start_time,
    endTime: row.end_time,
    end_time: row.end_time,
    notes: cleanNotes || null,
    servicePrice: Number(row.service_price ?? 0),
    service_price: Number(row.service_price ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
    total_amount: Number(row.total_amount ?? 0),
    platformCommission: Number(row.platform_commission ?? 0),
    platform_commission: Number(row.platform_commission ?? 0),
    providerEarnings: Number(row.provider_earnings ?? 0),
    provider_earnings: Number(row.provider_earnings ?? 0),
    paymentStatus: row.payment_status || 'PENDING',
    payment_status: row.payment_status || 'PENDING',
    paymentMethod: row.payment_method || null,
    payment_method: row.payment_method || null,
    paymentRef: row.payment_ref || null,
    payment_ref: row.payment_ref || null,
    serviceOtp: row.service_otp || notesOtp || null,
    service_otp: row.service_otp || notesOtp || null,
    cancellationReason: row.cancellation_reason || null,
    cancellation_reason: row.cancellation_reason || null,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    serviceName: extras.service?.name || null,
    service_name: extras.service?.name || null,
    customerName: extras.customer?.user?.fullName || extras.customer?.user?.full_name || extras.customer?.fullName || null,
    customer_name: extras.customer?.user?.fullName || extras.customer?.user?.full_name || extras.customer?.fullName || null,
    customerPhone: extras.customer?.user?.phone || null,
    customer_phone: extras.customer?.user?.phone || null,
    providerName: extras.provider?.businessName || extras.provider?.business_name || null,
    provider_name: extras.provider?.businessName || extras.provider?.business_name || null,
    ...(extras.service ? { service: mapServiceDto(extras.service) } : {}),
    ...(extras.customer ? { customer: extras.customer } : {}),
    ...(extras.provider ? { provider: extras.provider } : {}),
    ...(extras.statusHistory ? { statusHistory: extras.statusHistory } : {}),
  };
}

export function mapCategoryDto(row: any, serviceCount?: number) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    iconUrl: row.icon_url || null,
    icon: row.icon_url || null,
    imageUrl: row.image_url || null,
    displayOrder: Number(row.display_order ?? 0),
    display_order: Number(row.display_order ?? 0),
    isActive: row.is_active !== false,
    is_active: row.is_active !== false,
    ...(serviceCount !== undefined ? { _count: { services: serviceCount } } : {}),
  };
}

export function mapServiceDto(row: any, categoryRow?: any) {
  if (!row) return null;
  return {
    id: row.id,
    categoryId: row.category_id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    durationMinutes: Number(row.duration_minutes ?? 60),
    duration_minutes: Number(row.duration_minutes ?? 60),
    basePrice: Number(row.base_price ?? 0),
    base_price: Number(row.base_price ?? 0),
    imageUrl: row.image_url || null,
    image_url: row.image_url || null,
    isActive: row.is_active !== false,
    is_active: row.is_active !== false,
    ...(categoryRow ? { category: mapCategoryDto(categoryRow) } : {}),
  };
}

export function mapNotificationDto(row: any) {
  if (!row) return null;
  let parsedData: any = row.data;
  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData);
    } catch {}
  }
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: parsedData || {},
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export function mapAuditLogDto(row: any, userRow?: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id || null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details || null,
    ipAddress: row.ip_address || null,
    createdAt: row.created_at,
    user: userRow
      ? { id: userRow.id, fullName: userRow.full_name, phone: userRow.phone, email: userRow.email }
      : undefined,
  };
}
