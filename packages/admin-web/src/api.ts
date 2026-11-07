export const API_BASE = 'http://localhost:4000/api';

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

  // Audit Logs
  async getAuditLogs() {
    return this.request('/admin/audit-logs');
  }
}

export const api = new ApiClient();

