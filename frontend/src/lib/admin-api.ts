import { TrustIQApi } from './api';

export class AdminApi extends TrustIQApi {
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getUserAnalytics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request(`/admin/users/analytics?${params.toString()}`);
  }

  async getSystemHealth() {
    return this.request('/admin/system/health');
  }

  async getAuditLogs(page: number = 1, limit: number = 50, action?: string, userId?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (action) params.append('action', action);
    if (userId) params.append('userId', userId);
    
    return this.request(`/admin/audit-logs?${params.toString()}`);
  }

  async getApiUsage(startDate?: string, endDate?: string, apiKeyId?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (apiKeyId) params.append('apiKeyId', apiKeyId);
    
    return this.request(`/admin/api-usage?${params.toString()}`);
  }

  async getUsers(page: number = 1, limit: number = 50, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    
    return this.request(`/admin/users?${params.toString()}`);
  }

  async updateUserTier(userId: string, tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE') {
    return this.request(`/admin/users/${userId}/tier`, {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    });
  }

  async startMaintenance(message?: string) {
    return this.request('/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify({ action: 'start', message }),
    });
  }

  async stopMaintenance(message?: string) {
    return this.request('/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify({ action: 'stop', message }),
    });
  }
}

export const adminApi = new AdminApi();