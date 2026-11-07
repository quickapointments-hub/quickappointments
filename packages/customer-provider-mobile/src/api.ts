export const API_BASE = 'http://localhost:4000/api';

class MobileApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('qa_mobile_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('qa_mobile_token', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('qa_mobile_token');
    localStorage.removeItem('qa_mobile_user');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `Request failed with status ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn(`Mobile API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth
  async requestOtp(phone: string, role: string = 'CUSTOMER') {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role }),
    });
  }

  async verifyOtp(phone: string, otp: string, fullName?: string, defaultRole?: string) {
    const res = await this.request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, fullName, defaultRole }),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  async switchRole(targetRole: 'CUSTOMER' | 'PROVIDER') {
    const res = await this.request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Catalog
  async getCategories() {
    return this.request('/catalog/categories');
  }

  async getServices(categoryId?: string, query?: string) {
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (query) params.append('query', query);
    return this.request(`/catalog/services?${params.toString()}`);
  }

  async getServiceDetails(serviceId: string) {
    return this.request(`/catalog/services/${serviceId}`);
  }

  // Providers & Slots
  async getProviders(city?: string) {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.request(`/providers${query}`);
  }

  async getProviderSlots(providerId: string, date: string, duration?: number) {
    const query = new URLSearchParams({ date });
    if (duration) query.append('duration', duration.toString());
    return this.request(`/providers/${providerId}/slots?${query.toString()}`);
  }

  // Booking & Temporary Concurrency Lock
  async reserveSlot(providerId: string, serviceId: string, date: string, startTime: string) {
    return this.request('/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify({ providerId, serviceId, date, startTime }),
    });
  }

  async confirmBooking(reservationToken: string, paymentMethod: string = 'CASH_ON_SERVICE', notes?: string) {
    return this.request('/bookings/confirm', {
      method: 'POST',
      body: JSON.stringify({ reservationToken, paymentMethod, notes }),
    });
  }

  async getCustomerBookings() {
    return this.request('/bookings/customer');
  }

  async getProviderBookings(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/bookings/provider${query}`);
  }

  async updateBookingStatus(bookingId: string, status: string, reason?: string) {
    return this.request(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  // Provider Cockpit
  async getProviderEarnings() {
    return this.request('/provider/earnings');
  }

  async onboardProvider(payload: any) {
    return this.request('/provider/onboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getNotifications() {
    return this.request('/notifications');
  }
}

export const mobileApi = new MobileApiClient();

