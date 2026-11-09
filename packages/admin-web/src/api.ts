export const API_BASE = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('qa_admin_token') || 'dev_admin_token';
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('qa_admin_token', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('qa_admin_token');
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
      console.warn(`API call ${endpoint} error:`, err.message);
      throw err;
    }
  }

  // Auth
  async adminLogin(email: string, password?: string) {
    const res = await this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
      localStorage.setItem('qa_admin_user', JSON.stringify(res.user));
    }
    return res;
  }

  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async inviteAdminUser(data: { email: string; fullName: string; phone?: string; role: string }) {
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

  async loginWithOtp(phone: string, otp: string) {
    const res = await this.request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  // Dashboard Metrics
  async getMetrics() {
    return this.request('/admin/metrics');
  }

  // Provider KYC & Management
  async getProviders(status?: string, search?: string) {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (search) query.append('search', search);
    return this.request(`/admin/providers?${query.toString()}`);
  }

  async verifyProvider(id: string, action: 'APPROVE' | 'REJECT', reason?: string) {
    return this.request(`/admin/providers/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  // Bookings
  async getBookings(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/admin/bookings${query}`);
  }

  // Catalog
  async getCategories() {
    return this.request('/catalog/categories');
  }

  async getServices(categoryId?: string) {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request(`/catalog/services${query}`);
  }

  // Commission & Financials
  async getCommissionSettings() {
    return this.request('/admin/commission');
  }

  async setCommission(rate: number, type: string = 'PERCENTAGE') {
    return this.request('/admin/commission', {
      method: 'POST',
      body: JSON.stringify({ rate, type }),
    });
  }

  // 100% Refund Processor (48-hr SLA)
  async processRefund(bookingId: string, reason?: string) {
    return this.request('/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ bookingId, reason: reason || 'Admin authorized full refund' }),
    });
  }

  // Audit Logs
  async getAuditLogs() {
    return this.request('/admin/audit-logs');
  }

  // Customers (A-06)
  async getCustomers(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/admin/customers${query}`);
  }

  async updateCustomerStatus(id: string, isActive: boolean) {
    return this.request(`/admin/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Rate Card Approvals (A-09)
  async getPendingRates() {
    return this.request('/admin/rates');
  }

  async decideRateCard(id: string, action: 'APPROVE' | 'REJECT', reason?: string) {
    return this.request(`/admin/rates/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  // Refunds (A-11)
  async getRefunds() {
    return this.request('/admin/refunds');
  }

  // Payouts T+1 (A-13)
  async getPayouts() {
    return this.request('/admin/payouts');
  }

  async generatePayoutBatch() {
    return this.request('/admin/payouts/generate', { method: 'POST' });
  }

  async markPayoutPaid(id: string, bankTxRef: string) {
    return this.request(`/admin/payouts/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ bankTxRef }),
    });
  }

  // Support & Disputes (A-14)
  async getSupportTickets(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/admin/support/tickets${query}`);
  }

  async resolveSupportTicket(id: string, resolution: string) {
    return this.request(`/admin/support/tickets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }
}

export const api = new ApiClient();

