import { supabase } from './supabase';

export const API_BASE =
  (import.meta.env?.VITE_API_URL as string) ||
  ((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL as string) ||
  'http://localhost:4000/api';

class MobileApiClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem('qa_mobile_token');
    } catch {}
  }

  setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('qa_mobile_token', token);
    } catch {}
  }

  logout() {
    this.token = null;
    try {
      localStorage.removeItem('qa_mobile_token');
      localStorage.removeItem('qa_mobile_user');
    } catch {}
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      const err: any = new Error(error.message || `Request failed with status ${res.status}`);
      err.code = error.code;
      err.status = res.status;
      throw err;
    }

    return await res.json();
  }

  // =========================================================================
  // REALTIME SYNC SIGNALING
  // =========================================================================
  broadcastSync(event: string, payload: any = {}) {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('quick_appointments_sync');
        bc.postMessage({ type: event, payload, timestamp: Date.now() });
        setTimeout(() => bc.close(), 300);
      } catch {}
    }
  }

  subscribeToSync(callback: (event: string, payload: any) => void): () => void {
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('quick_appointments_sync');
        bc.onmessage = (msgEvent) => {
          if (msgEvent?.data?.type) callback(msgEvent.data.type, msgEvent.data.payload);
        };
      } catch {}
    }

    const sbChannel = supabase
      .channel('quick-appointments-sync')
      .on('broadcast', { event: '*' }, (msg: any) => {
        if (msg?.event) callback(msg.event, msg.payload || {});
      })
      .subscribe();

    return () => {
      if (bc) bc.close();
      supabase.removeChannel(sbChannel);
    };
  }

  // =========================================================================
  // AUTHENTICATION & REGISTRATION (100% Backend API -> Supabase PostgreSQL)
  // =========================================================================
  async checkUserRegistered(phoneOrEmail: string): Promise<{ registered: boolean; user?: any }> {
    const raw = (phoneOrEmail || '').trim();
    if (!raw) return { registered: false };
    const cleanPhone = raw.replace(/\D/g, '');
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    const res = await this.request('/auth/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone: last10 || raw }),
    });
    return {
      registered: Boolean(res?.registered),
      user: res?.existingUser || undefined,
    };
  }

  async registerCustomer(data: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    state?: string;
    area?: string;
    pincode?: string;
  }) {
    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
    const fullAddress = [data.area, data.city, data.state, data.pincode].filter(Boolean).join(', ');

    const res = await this.request('/auth/register-customer', {
      method: 'POST',
      body: JSON.stringify({
        fullName: data.fullName.trim(),
        phone: last10,
        email: data.email?.trim() || undefined,
        city: data.city || 'Hyderabad',
        state: data.state,
        area: data.area,
        pincode: data.pincode,
        address: fullAddress || `${data.city || 'Hyderabad'}, India`,
      }),
    });

    if (res?.accessToken) this.setToken(res.accessToken);
    if (res?.user) {
      try {
        localStorage.setItem('qa_mobile_user', JSON.stringify(res.user));
      } catch {}
    }
    this.broadcastSync('customers_updated', { userId: res?.user?.id });
    return res;
  }

  async registerProvider(data: {
    fullName: string;
    phone: string;
    email: string;
    businessName: string;
    businessType?: string;
    category?: string;
    city: string;
    address?: string;
    about?: string;
    documents?: Array<{ documentType: string; documentNumber?: string; fileUrl: string }>;
    googleMapsLink?: string;
    premisePhotos?: Array<{ fileUrl: string; fileName?: string } | string>;
    workingDays?: string[];
    workingHoursFrom?: string;
    workingHoursTo?: string;
    serviceIds?: string[];
  }) {
    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    const res = await this.request('/auth/register-provider', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        fullName: data.fullName.trim(),
        phone: last10,
        email: data.email?.trim() || undefined,
      }),
    });

    if (res?.accessToken) this.setToken(res.accessToken);
    if (res?.user) {
      try {
        localStorage.setItem('qa_mobile_user', JSON.stringify(res.user));
      } catch {}
    }
    this.broadcastSync('providers_updated', { userId: res?.user?.id });
    return res;
  }

  async requestOtp(phone: string, role: string = 'CUSTOMER', isRegistration = false) {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role, isRegistration }),
    });
  }

  async verifyOtp(phone: string, otp: string, fullName?: string, defaultRole?: string, isRegistration = false) {
    const res = await this.request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, fullName, defaultRole, isRegistration }),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  async switchRole(targetRole: 'CUSTOMER' | 'PROVIDER') {
    const res = await this.request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role: targetRole }),
    });
    if (res.accessToken) this.setToken(res.accessToken);
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data: {
    fullName?: string;
    email?: string;
    city?: string;
    defaultAddress?: string;
    avatarDataUrl?: string;
  }) {
    const res = await this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res?.user) {
      try {
        localStorage.setItem('qa_mobile_user', JSON.stringify(res.user));
      } catch {}
    }
    return res;
  }

  async updateMe(data: any) {
    return this.updateProfile(data);
  }

  // =========================================================================
  // CUSTOMER ADDRESSES
  // =========================================================================
  async getCustomerAddresses() {
    return this.request('/customer/addresses');
  }

  async addCustomerAddress(data: { label?: string; addressLine: string; city?: string; area?: string; state?: string; pincode?: string }) {
    return this.request('/customer/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomerAddress(id: string) {
    return this.request(`/customer/addresses/${id}`, { method: 'DELETE' });
  }

  // =========================================================================
  // CATALOG, BANNERS & CITIES
  // =========================================================================
  async getActiveCities() {
    try {
      return await this.request('/catalog/cities');
    } catch {
      const { data } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      return { success: true, data: data || [] };
    }
  }

  async validatePincode(pincode: string) {
    return this.request('/locations/validate-pincode', {
      method: 'POST',
      body: JSON.stringify({ pincode }),
    });
  }

  async getCategories() {
    try {
      return await this.request('/catalog/categories');
    } catch {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      return { success: true, data: data || [] };
    }
  }

  async getServices(categoryId?: string, query?: string) {
    const qs = new URLSearchParams();
    if (categoryId) qs.set('categoryId', categoryId);
    if (query) qs.set('query', query);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.request(`/catalog/services${suffix}`);
  }

  async getServiceDetails(serviceId: string) {
    return this.request(`/catalog/services/${serviceId}`);
  }

  async getBanners() {
    return this.request('/banners');
  }

  async getOffers() {
    return this.request('/catalog/coupons').catch(async () => {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return { success: true, data: data || [] };
    });
  }

  async validateCoupon(code: string, orderAmount: number) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount }),
    });
  }

  async getCustomerWallet() {
    return this.request('/customer/wallet');
  }

  async addCustomerWalletFunds(amount: number, paymentMethod = 'UPI') {
    return this.request('/customer/wallet/add-funds', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  async getCustomerTransactions() {
    return this.request('/customer/transactions');
  }

  async getCustomerFavorites() {
    return this.request('/customer/favorites');
  }

  async toggleCustomerFavorite(providerId: string) {
    return this.request('/customer/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ providerId }),
    });
  }

  async getProviderGallery(providerId: string) {
    return this.request(`/providers/${providerId}/gallery`);
  }

  async addProviderGalleryImage(imageUrl: string) {
    return this.request('/provider/gallery', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
  }

  async getProviders(city?: string, search?: string, categoryId?: string) {
    const qs = new URLSearchParams();
    if (city) qs.set('city', city);
    if (search) qs.set('search', search);
    if (categoryId) qs.set('categoryId', categoryId);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.request(`/providers${suffix}`);
  }

  async getProviderKycStatus(_userId?: string, _phone?: string) {
    return this.request('/provider/status');
  }

  async getProviderSlots(providerId: string, date: string, duration?: number) {
    const qs = new URLSearchParams({ date });
    if (duration) qs.set('duration', String(duration));
    return this.request(`/providers/${providerId}/slots?${qs.toString()}`);
  }

  // =========================================================================
  // BOOKINGS, PAYMENTS & CONCURRENCY (ZERO MOCK FALLBACKS)
  // =========================================================================
  async reserveSlot(providerId: string, serviceId: string, date: string, startTime: string) {
    return this.request('/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify({ providerId, serviceId, date, startTime }),
    });
  }

  async createPaymentOrder(amount: number, bookingRef?: string) {
    return this.request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, bookingRef }),
    });
  }

  async confirmBooking(
    reservationToken: string,
    paymentMethod: string = 'CASH_ON_SERVICE',
    notes?: string,
    paymentTxId?: string,
    orderId?: string,
    couponCode?: string
  ) {
    const res = await this.request('/bookings/confirm', {
      method: 'POST',
      body: JSON.stringify({
        reservationToken,
        paymentMethod,
        notes,
        paymentTxId,
        orderId,
        couponCode,
      }),
    });
    this.broadcastSync('bookings_updated', { bookingId: res?.data?.id });
    return {
      ...res,
      booking: res?.data,
    };
  }

  async getCustomerBookings() {
    return this.request('/bookings/customer');
  }

  async rescheduleBooking(bookingId: string, date: string, startTime: string, endTime?: string) {
    return this.request(`/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ date, startTime, endTime }),
    });
  }

  async cancelBooking(bookingId: string, reason?: string) {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async submitReview(bookingId: string, rating: number, tags: string[], comment?: string) {
    return this.request(`/bookings/${bookingId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, tags, comment }),
    });
  }

  // =========================================================================
  // PROVIDER OPERATIONS (Strictly gated by Admin APPROVED status)
  // =========================================================================
  async getProviderDashboard() {
    return this.request('/provider/dashboard');
  }

  async getProviderBookings(status?: string) {
    const qs = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/bookings/provider${qs}`);
  }

  async updateBookingStatus(bookingId: string, status: string, reason?: string) {
    return this.request(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async verifyServiceOtp(bookingId: string, otp: string) {
    return this.request(`/bookings/${bookingId}/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async acceptBooking(bookingId: string) {
    return this.request(`/provider/bookings/${bookingId}/accept`, { method: 'POST' });
  }

  async rejectBooking(bookingId: string, reason?: string) {
    return this.request(`/provider/bookings/${bookingId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async toggleProviderAcceptingBookings(isAcceptingBookings: boolean) {
    return this.request('/provider/accepting-bookings', {
      method: 'PATCH',
      body: JSON.stringify({ isAcceptingBookings }),
    });
  }

  async getProviderAvailability() {
    return this.request('/provider/availability');
  }

  async saveProviderAvailability(schedule: any[]) {
    return this.request('/provider/availability', {
      method: 'PUT',
      body: JSON.stringify({ schedule }),
    });
  }

  async getProviderReviews() {
    return this.request('/provider/reviews');
  }

  async getProviderEarnings() {
    return this.request('/provider/earnings');
  }

  async getProviderServices() {
    return this.request('/provider/services');
  }

  async submitProviderService(payload: {
    categoryId: string;
    serviceId?: string;
    name?: string;
    description?: string;
    customPrice: number;
    customDuration?: number;
    imageUrl?: string;
  }) {
    return this.request('/provider/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteProviderService(rateId: string) {
    return this.request(`/provider/services/${rateId}`, {
      method: 'DELETE',
    });
  }

  async onboardProvider(payload: any) {
    return this.request('/provider/onboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async uploadProviderDocumentMultipart(file: File, documentType: string, documentNumber?: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    if (documentNumber) form.append('documentNumber', documentNumber);

    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`${API_BASE}/provider/documents/upload`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || 'Document upload failed');
    }
    return res.json();
  }

  async getProviderBranches() {
    return this.request('/provider/branches');
  }

  async addProviderBranch(data: any) {
    return this.request('/provider/branches', { method: 'POST', body: JSON.stringify(data) });
  }

  async getProviderStaff() {
    return this.request('/provider/staff');
  }

  async addProviderStaff(data: any) {
    return this.request('/provider/staff', { method: 'POST', body: JSON.stringify(data) });
  }

  // =========================================================================
  // SUPPORT TICKETS & NOTIFICATIONS
  // =========================================================================
  async getMyTickets() {
    return this.request('/support/tickets');
  }

  async createSupportTicket(data: { category: string; subject: string; description: string; bookingId?: string }) {
    return this.request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        category: data.category,
        subject: data.subject,
        message: data.description,
        bookingId: data.bookingId,
      }),
    });
  }

  async addTicketReply(ticketId: string, message: string) {
    return this.request(`/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getAlternatives(_bookingId: string) {
    return this.getProviders();
  }

  async getNotifications(_userId?: string) {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }
}

export const mobileApi = new MobileApiClient();
