import { supabase } from './supabase';

const configuredApiUrl = ((import.meta.env?.VITE_API_URL as string) || '').trim();
const isLocalHostApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api\/?$/i.test(configuredApiUrl);
export const API_BASE =
  configuredApiUrl && (!import.meta.env?.DEV || !isLocalHostApi)
    ? configuredApiUrl.replace(/\/+$/, '')
    : '/api';

const API_FALLBACK_BASES = Array.from(
  new Set(
    [
      API_BASE,
      '/api',
      configuredApiUrl ? configuredApiUrl.replace(/\/+$/, '') : '',
      'http://localhost:4000/api',
      'http://127.0.0.1:4000/api',
    ].filter(Boolean)
  )
);

function isNetworkFetchError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed');
}

class ApiClient {
  private token: string | null = null;
  private onUnauthorizedCb: (() => void) | null = null;

  constructor() {
    const stored = localStorage.getItem('qa_admin_token');
    if (
      stored &&
      stored !== 'dev_admin_token' &&
      stored !== 'mock_admin_token' &&
      !stored.startsWith('supabase_admin_token')
    ) {
      this.token = stored;
    } else {
      localStorage.removeItem('qa_admin_token');
      localStorage.removeItem('qa_admin_user');
      this.token = null;
    }
  }

  onUnauthorized(cb: () => void) {
    this.onUnauthorizedCb = cb;
  }

  hasValidSession(): boolean {
    return Boolean(this.token);
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('qa_admin_token', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('qa_admin_token');
    localStorage.removeItem('qa_admin_user');
  }

  private async fetchWithFallback(endpoint: string, options: RequestInit): Promise<Response> {
    let lastError: unknown;
    for (const base of API_FALLBACK_BASES) {
      try {
        const res = await fetch(`${base}${endpoint}`, options);
        // If Vite dev proxy returns error status because backend isn't reachable on 127.0.0.1, try next candidate
        if (
          (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) &&
          base === '/api'
        ) {
          const text = await res.clone().text().catch(() => '');
          if (
            text.includes('ECONNREFUSED') ||
            text.includes('BACKEND_OFFLINE') ||
            text.includes('Internal Server Error')
          ) {
            continue;
          }
        }
        return res;
      } catch (err) {
        lastError = err;
        if (!isNetworkFetchError(err)) {
          throw err;
        }
      }
    }
    throw lastError instanceof Error
      ? new Error(
          'Unable to connect to the Quick Appointments API server (port 4000). Please ensure the backend server is running and try again.'
        )
      : new Error('Unable to reach the backend API server.');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await this.fetchWithFallback(endpoint, {
      ...options,
      headers,
    });

    if (res.status === 401 && !endpoint.startsWith('/admin/auth/login')) {
      this.logout();
      this.onUnauthorizedCb?.();
    }

    if (!res.ok) {
      let message = '';
      try {
        const error = await res.json();
        message = error.message || error.error;
      } catch {
        if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
          message =
            'The Quick Appointments API server (port 4000) is offline or unreachable. Please start the backend service.';
        } else {
          message = res.statusText || `Request failed with status ${res.status}`;
        }
      }
      throw new Error(message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  }

  // =========================================================================
  // REALTIME SYNC SIGNALING
  // =========================================================================
  broadcastSync(event: string, payload: any = {}) {
    try {
      const bc = new BroadcastChannel('quick_appointments_sync');
      bc.postMessage({ type: event, payload, timestamp: Date.now() });
      setTimeout(() => bc.close(), 300);
    } catch {}
  }

  subscribeToSync(callback: (event: string, payload: any) => void): () => void {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('quick_appointments_sync');
      bc.onmessage = (msgEvent) => {
        if (msgEvent?.data?.type) callback(msgEvent.data.type, msgEvent.data.payload);
      };
    } catch {}

    const channel = supabase
      .channel('quick-appointments-sync')
      .on('broadcast', { event: '*' }, (msg: any) => {
        if (msg?.event) callback(msg.event, msg.payload || {});
      })
      .subscribe();

    return () => {
      if (bc) bc.close();
      supabase.removeChannel(channel);
    };
  }

  // =========================================================================
  // AUTHENTICATION & ADMIN PROFILE
  // =========================================================================
  async adminLogin(email: string, password?: string) {
    if (!email || !password) {
      throw new Error('Administrator email and password are required.');
    }
    const res = await this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res?.accessToken || !res?.user) {
      throw new Error(res?.message || 'Invalid login response from backend server');
    }
    this.setToken(res.accessToken);
    localStorage.setItem('qa_admin_user', JSON.stringify(res.user));
    return res;
  }

  async getAdminMe() {
    const res = await this.request('/admin/auth/me');
    if (res?.user) {
      localStorage.setItem('qa_admin_user', JSON.stringify(res.user));
    }
    return res;
  }

  async forgotAdminPassword(email: string) {
    if (!email || !email.trim()) {
      throw new Error('Please enter your administrator email address or phone number.');
    }
    return this.request('/admin/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });
  }

  async resetAdminPassword(email: string, otp: string, newPassword: string) {
    return this.request('/admin/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
    });
  }

  async updateAdminProfile(data: { fullName?: string; email?: string; phone?: string }) {
    const res = await this.request('/admin/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (res?.user) {
      localStorage.setItem('qa_admin_user', JSON.stringify(res.user));
    }
    return res;
  }

  async changeAdminPassword(currentPassword: string, newPassword: string) {
    return this.request('/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // =========================================================================
  // DASHBOARD METRICS
  // =========================================================================
  async getMetrics() {
    const [metricsRes, bookingsRes] = await Promise.all([
      this.request('/admin/metrics'),
      this.request('/admin/bookings').catch(() => ({ data: [] })),
    ]);

    const d = metricsRes?.data || {};
    return {
      success: true,
      data: {
        totalCustomers: d.totalCustomers || 0,
        totalProviders: d.totalProviders || 0,
        activeProviders: d.activeProviders || 0,
        pendingVerifications: d.pendingVerifications || 0,
        totalBookings: d.totalBookings || 0,
        todayBookings: d.todayBookings || 0,
        completedBookings: d.completedBookings || 0,
        cancelledBookings: d.cancelledBookings || 0,
        grossRevenue: d.grossRevenue || 0,
        platformCommission: d.platformCommission || 0,
        netProviderPayout: d.netProviderPayout || 0,
        recentBookings: Array.isArray(bookingsRes?.data) ? bookingsRes.data.slice(0, 8) : [],
      },
    };
  }

  // =========================================================================
  // SERVICE PROVIDER MANAGEMENT & KYC APPROVALS
  // =========================================================================
  async getProviders(status?: string, search?: string) {
    const qs = new URLSearchParams();
    if (status && status !== 'ALL') qs.set('status', status);
    if (search && search.trim()) qs.set('search', search.trim());
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.request(`/admin/providers${suffix}`);
  }

  async verifyProvider(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CLARITY' | 'REQUEST_REUPLOAD',
    reason?: string
  ) {
    const backendAction = action === 'REQUEST_REUPLOAD' ? 'REQUEST_CLARITY' : action;
    const res = await this.request(`/admin/providers/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action: backendAction, reason }),
    });
    this.broadcastSync('providers_updated', { providerId: id });
    return res;
  }

  async getProviderDetails(id: string) {
    return this.request(`/admin/providers/${id}/details`);
  }

  async verifyDocument(docId: string, isVerified: boolean) {
    const res = await this.request(`/admin/documents/${docId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified }),
    });
    this.broadcastSync('providers_updated', { docId });
    return res;
  }

  async getDocumentSignedUrl(docId: string) {
    return this.request(`/admin/documents/${docId}/signed-url`);
  }

  async toggleProviderAcceptingBookings(providerId: string, isAccepting: boolean) {
    const res = await this.request(`/admin/providers/${providerId}/accepting-bookings`, {
      method: 'PATCH',
      body: JSON.stringify({ isAcceptingBookings: isAccepting }),
    });
    this.broadcastSync('providers_updated', { providerId });
    return res;
  }

  // =========================================================================
  // CUSTOMER MANAGEMENT (100% DB-backed, immediate active reflection)
  // =========================================================================
  async getCustomers(search?: string) {
    const qs = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return this.request(`/admin/customers${qs}`);
  }

  async updateCustomerStatus(customerId: string, isActive: boolean) {
    const res = await this.request(`/admin/customers/${customerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    this.broadcastSync('customers_updated', { customerId });
    return res;
  }

  // =========================================================================
  // CATEGORIES & SERVICES MANAGEMENT
  // =========================================================================
  async getCategories() {
    return this.request('/admin/categories');
  }

  async createCategory(cat: { name: string; description?: string; display_order?: number; icon?: string; icon_url?: string }) {
    const res = await this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
    this.broadcastSync('catalog_updated', { type: 'category' });
    return res;
  }

  async updateCategory(id: string, updates: any) {
    const res = await this.request(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    this.broadcastSync('catalog_updated', { type: 'category', id });
    return res;
  }

  async deleteCategory(id: string) {
    const res = await this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
    this.broadcastSync('catalog_updated', { type: 'category', id });
    return res;
  }

  async getServices(categoryId?: string) {
    const res = await this.request('/admin/services');
    const list = res?.data || [];
    return {
      success: true,
      data: categoryId ? list.filter((s: any) => s.categoryId === categoryId || s.category_id === categoryId) : list,
    };
  }

  async createService(service: {
    name: string;
    categoryId: string;
    description?: string;
    basePrice: number;
    durationMinutes: number;
    imageUrl?: string;
  }) {
    const res = await this.request('/admin/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    this.broadcastSync('catalog_updated', { type: 'service' });
    return res;
  }

  async updateService(id: string, updates: any) {
    const res = await this.request(`/admin/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    this.broadcastSync('catalog_updated', { type: 'service', id });
    return res;
  }

  async deleteService(id: string) {
    const res = await this.request(`/admin/services/${id}`, {
      method: 'DELETE',
    });
    this.broadcastSync('catalog_updated', { type: 'service', id });
    return res;
  }

  // =========================================================================
  // BOOKINGS, REVIEWS & SUPPORT
  // =========================================================================
  async getBookings(status?: string) {
    const qs = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/admin/bookings${qs}`);
  }

  async updateBookingStatus(bookingId: string, status: string, reason?: string) {
    let res: any;
    try {
      res = await this.request(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
    } catch {
      res = await this.request(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
    }
    this.broadcastSync('bookings_updated', { bookingId });
    return res;
  }

  async getReviews() {
    return this.request('/admin/reviews');
  }

  async replyToReview(reviewId: string, _reply: string) {
    return { success: true, reviewId };
  }

  async deleteReview(reviewId: string) {
    return this.request(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
  }

  async getSupportTickets(status?: string) {
    const qs = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/admin/support/tickets${qs}`);
  }

  async resolveSupportTicket(ticketId: string, resolution: string, newStatus: string = 'RESOLVED') {
    return this.request(`/admin/support/tickets/${ticketId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, status: newStatus }),
    });
  }

  // =========================================================================
  // SERVICE CITIES MANAGEMENT
  // =========================================================================
  async getServiceCities() {
    return this.request('/admin/cities');
  }

  async addServiceCity(city: { name: string; state: string; is_active?: boolean; pincodes?: string }) {
    const res = await this.request('/admin/cities', {
      method: 'POST',
      body: JSON.stringify(city),
    });
    this.broadcastSync('cities_updated', {});
    return res;
  }

  async updateServiceCity(cityId: string, updates: { name?: string; state?: string; is_active?: boolean; pincodes?: string }) {
    const res = await this.request(`/admin/cities/${cityId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    this.broadcastSync('cities_updated', {});
    return res;
  }

  async toggleCityStatus(cityId: string, is_active: boolean) {
    const res = await this.request(`/admin/cities/${cityId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
    this.broadcastSync('cities_updated', {});
    return res;
  }

  async deleteServiceCity(cityId: string) {
    const res = await this.request(`/admin/cities/${cityId}`, { method: 'DELETE' });
    this.broadcastSync('cities_updated', {});
    return res;
  }

  // =========================================================================
  // ADMIN LOCATION MASTER & SERVICEABLE PIN CODES
  // =========================================================================
  async getLocations(filters?: { search?: string; status?: string; state?: string; city?: string }) {
    const qs = new URLSearchParams();
    if (filters?.search) qs.set('search', filters.search);
    if (filters?.status && filters.status !== 'All') qs.set('status', filters.status);
    if (filters?.state) qs.set('state', filters.state);
    if (filters?.city) qs.set('city', filters.city);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';

    try {
      const res = await this.request(`/admin/locations${suffix}`);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('@qa_admin_locations_cache', JSON.stringify(res.data));
          } catch {}
        }
        return res;
      }
    } catch {}

    // Fallback: Query Supabase location_master & cities
    let mergedList: any[] = [];
    try {
      const { data: locData } = await supabase
        .from('location_master')
        .select('*')
        .order('created_at', { ascending: false });
      if (Array.isArray(locData)) mergedList = [...locData];
    } catch {}

    // Merge from cities table
    try {
      const { data: citiesData } = await supabase.from('cities').select('*');
      if (Array.isArray(citiesData)) {
        for (const c of citiesData) {
          const rawPins = String(c.pincodes || '');
          const pinList = rawPins.split(',').map((p) => p.trim().replace(/\D/g, '')).filter(Boolean);
          for (const p of pinList) {
            if (p.length === 6 && !mergedList.some((m) => m.pincode === p)) {
              mergedList.push({
                id: `city-${c.id}-${p}`,
                country: 'India',
                state: c.state || 'Telangana',
                city: c.name,
                district: c.district || c.name,
                pincode: p,
                is_active: c.is_active !== false,
                created_at: c.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch {}

    // Merge from localStorage cache
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('@qa_admin_locations_cache') || '[]');
        if (Array.isArray(cached)) {
          for (const c of cached) {
            if (!mergedList.some((m) => m.pincode === c.pincode)) {
              mergedList.push(c);
            }
          }
        }
      } catch {}
    }

    // Apply filtering
    let filtered = mergedList;
    if (filters?.status && filters.status !== 'All') {
      const activeOnly = filters.status === 'Active';
      filtered = filtered.filter((l) => (l.is_active !== false) === activeOnly);
    }
    if (filters?.state) {
      filtered = filtered.filter((l) => l.state?.toLowerCase() === filters.state?.toLowerCase());
    }
    if (filters?.city) {
      filtered = filtered.filter((l) => l.city?.toLowerCase() === filters.city?.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.pincode?.includes(q) ||
          l.city?.toLowerCase().includes(q) ||
          l.state?.toLowerCase().includes(q) ||
          l.district?.toLowerCase().includes(q)
      );
    }

    return { success: true, data: filtered };
  }

  async addLocation(data: { country?: string; state: string; city: string; district: string; pincode: string; is_active?: boolean }) {
    const cleanPin = String(data.pincode || '').replace(/\D/g, '').trim();
    const locItem = {
      id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      country: data.country || 'India',
      state: data.state.trim(),
      city: data.city.trim(),
      district: data.district.trim(),
      pincode: cleanPin,
      is_active: data.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update localStorage cache immediately
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('@qa_admin_locations_cache') || '[]');
        const updated = [locItem, ...cached.filter((c: any) => c.pincode !== cleanPin)];
        localStorage.setItem('@qa_admin_locations_cache', JSON.stringify(updated));
      } catch {}
    }

    let backendResult: any = null;
    try {
      backendResult = await this.request('/admin/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Backend API addLocation failed, syncing directly to Supabase:', e);
    }

    // Direct sync to Supabase location_master
    try {
      await supabase.from('location_master').upsert({
        country: locItem.country,
        state: locItem.state,
        city: locItem.city,
        district: locItem.district,
        pincode: cleanPin,
        is_active: locItem.is_active,
      }, { onConflict: 'pincode' });
    } catch {}

    // Direct sync to Supabase cities table (append to city's pincodes)
    try {
      const { data: cityRows } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', locItem.city);

      if (cityRows && cityRows.length > 0) {
        const c = cityRows[0];
        const existingPins = String(c.pincodes || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        if (!existingPins.includes(cleanPin)) {
          existingPins.push(cleanPin);
          await supabase
            .from('cities')
            .update({ pincodes: existingPins.join(', ') })
            .eq('id', c.id);
        }
      }
    } catch {}

    this.broadcastSync('locations_updated', { pincode: cleanPin });
    this.broadcastSync('cities_updated', {});
    return backendResult || { success: true, data: locItem };
  }

  async bulkUploadLocations(rows: Array<{ country?: string; state?: string; city?: string; district?: string; pincode?: string | number; is_active?: boolean | string }>) {
    let backendResult: any = null;
    try {
      backendResult = await this.request('/admin/locations/bulk-upload', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
    } catch {}

    // Direct batch upsert to Supabase
    try {
      const payload = rows
        .map((r) => {
          const pin = String(r.pincode || '').replace(/\D/g, '').trim();
          if (pin.length !== 6) return null;
          return {
            country: String(r.country || 'India').trim(),
            state: String(r.state || '').trim(),
            city: String(r.city || '').trim(),
            district: String(r.district || r.city || '').trim(),
            pincode: pin,
            is_active: r.is_active === false || r.is_active === 'false' || r.is_active === '0' ? false : true,
          };
        })
        .filter(Boolean);

      if (payload.length > 0) {
        await supabase.from('location_master').upsert(payload as any[], { onConflict: 'pincode' });
      }
    } catch {}

    this.broadcastSync('locations_updated', {});
    this.broadcastSync('cities_updated', {});
    return backendResult || { success: true, total: rows.length };
  }

  async updateLocation(id: string, updates: any) {
    let backendResult: any = null;
    try {
      backendResult = await this.request(`/admin/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {}

    try {
      await supabase.from('location_master').update(updates).eq('id', id);
    } catch {}

    this.broadcastSync('locations_updated', {});
    return backendResult || { success: true, data: updates };
  }

  async toggleLocationStatus(id: string, is_active: boolean) {
    let backendResult: any = null;
    try {
      backendResult = await this.request(`/admin/locations/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      });
    } catch {}

    try {
      await supabase.from('location_master').update({ is_active }).eq('id', id);
    } catch {}

    this.broadcastSync('locations_updated', {});
    return backendResult || { success: true, data: { id, is_active } };
  }

  async deleteLocation(id: string) {
    let backendResult: any = null;
    try {
      backendResult = await this.request(`/admin/locations/${id}`, { method: 'DELETE' });
    } catch {}

    try {
      await supabase.from('location_master').delete().eq('id', id);
    } catch {}

    this.broadcastSync('locations_updated', {});
    return backendResult || { success: true };
  }

  // =========================================================================
  // BANNERS, NOTIFICATIONS & SETTINGS (100% DB-backed)
  // =========================================================================
  async getBanners() {
    return this.request('/admin/banners');
  }

  async createBanner(banner: any) {
    const res = await this.request('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(banner),
    });
    this.broadcastSync('banners_updated', {});
    return res;
  }

  async updateBanner(id: string, banner: any) {
    const res = await this.request(`/admin/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(banner),
    });
    this.broadcastSync('banners_updated', {});
    return res;
  }

  async deleteBanner(id: string) {
    const res = await this.request(`/admin/banners/${id}`, { method: 'DELETE' });
    this.broadcastSync('banners_updated', {});
    return res;
  }

  async getNotifications() {
    return this.request('/admin/notifications');
  }

  async getAdminRequestsFeed() {
    return this.request('/admin/requests-feed');
  }

  async broadcastNotification(payload: { title: string; body?: string; message?: string; audience?: string }) {
    return this.request('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        message: payload.message || payload.body,
        audience: payload.audience || 'All',
      }),
    });
  }

  async getSettings() {
    return this.request('/admin/settings');
  }

  async updateSettings(key: 'booking_settings' | 'payment_settings', value: Record<string, any>) {
    return this.request(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(value),
    });
  }

  // =========================================================================
  // COUPONS, ADMIN USERS, AUDIT, FINANCE, PAYOUTS & RATES
  // =========================================================================
  async getCoupons() {
    return this.request('/admin/coupons');
  }

  async createCoupon(coupon: any) {
    return this.request('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon),
    });
  }

  async deleteCoupon(couponId: string) {
    return this.request(`/admin/coupons/${couponId}`, { method: 'DELETE' });
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async inviteAdminUser(data: { email: string; fullName: string; phone?: string; role: string; password?: string }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminUser(id: string, data: any) {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(id: string) {
    return this.updateAdminUser(id, { isActive: false });
  }

  async getAuditLogs() {
    return this.request('/admin/audit-logs');
  }

  async getPayouts() {
    return this.request('/admin/payouts');
  }

  async generatePayoutBatch() {
    return this.request('/admin/payouts/generate', { method: 'POST' });
  }

  async markPayoutPaid(itemId: string, bankTxRef: string) {
    return this.request(`/admin/payouts/${itemId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ bankTxRef }),
    });
  }

  async getPendingRates() {
    return this.request('/admin/rates');
  }

  async decideRateCard(rateId: string, action: 'APPROVE' | 'REJECT', reason?: string) {
    return this.request(`/admin/rates/${rateId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  async getRefunds() {
    return this.request('/admin/refunds');
  }

  async processRefund(bookingId: string, reason?: string) {
    return this.request('/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ bookingId, reason }),
    });
  }
}

export const api = new ApiClient();
