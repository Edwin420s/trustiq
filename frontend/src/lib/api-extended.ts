import { TrustIQApi } from './api';

export class ExtendedTrustIQApi extends TrustIQApi {
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  async getAnalytics() {
    return this.request('/analytics/overview');
  }

  async getUserGrowth(startDate: string, endDate: string) {
    return this.request(`/analytics/user-growth?start=${startDate}&end=${endDate}`);
  }

  async getTrustScoreDistribution() {
    return this.request('/analytics/score-distribution');
  }

  async getSystemHealth() {
    return this.request('/analytics/system-health');
  }

  async exportUserData() {
    return this.request('/users/export-data', {
      method: 'POST',
    });
  }

  async updateUserPreferences(preferences: any) {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getTransactionHistory() {
    return this.request('/blockchain/transactions');
  }

  async getGasEstimate() {
    return this.request('/blockchain/gas-estimate');
  }
}

export const extendedTrustIQApi = new ExtendedTrustIQApi();