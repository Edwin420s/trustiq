import { User, LinkedAccount, TrustScore } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class TrustIQApi {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async walletLogin(walletAddress: string, signature: string, message: string) {
    return this.request('/auth/wallet/login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, message }),
    });
  }

  async getCurrentUser() {
    return this.request('/users/profile');
  }

  async getUserProfile(userId: string) {
    return this.request(`/users/profile`);
  }

  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    const data = await this.request('/users/profile');
    return data.linkedAccounts || [];
  }

  async linkAccount(provider: 'github' | 'linkedin') {
    return this.request('/auth/oauth/link', {
      method: 'POST',
      body: JSON.stringify({ provider, code: 'dummy-code' }), // In real app, get code from OAuth flow
    });
  }

  async unlinkAccount(accountId: string) {
    return this.request(`/users/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  async getTrustScore(): Promise<TrustScore> {
    const data = await this.request('/trust-score/current');
    return data;
  }

  async recalculateTrustScore() {
    return this.request('/trust-score/recalculate', {
      method: 'POST',
    });
  }

  async getScoreHistory(userId: string): Promise<TrustScore[]> {
    return this.request('/trust-score/history');
  }

  async mintBadge() {
    return this.request('/blockchain/mint-badge', {
      method: 'POST',
    });
  }

  async verifyUser(userId: string, fields?: string[]) {
    return this.request('/verification/request', {
      method: 'POST',
      body: JSON.stringify({ userId, fields }),
    });
  }
}

export const trustIQApi = new TrustIQApi();
export { trustIQApi as TrustIQApi };