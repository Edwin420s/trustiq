export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    walletAddress: string;
    did: string;
    trustScore: number;
  };
  token: string;
}

export interface TrustScoreResponse {
  score: number;
  breakdown: {
    consistency: number;
    skillDepth: number;
    peerValidation: number;
    engagementQuality: number;
    anomalyFactor: number;
  };
  insights: string[];
  calculatedAt: string;
}

export interface VerificationResponse {
  did: string;
  trustScore: number;
  verifiedAccounts: Array<{
    provider: string;
    username: string;
    verifiedAt: string;
  }>;
  verificationTimestamp: string;
  verifiedBy: string;
}

export interface BlockchainTransaction {
  transactionHash: string;
  status: 'pending' | 'success' | 'failed';
  type: 'mint' | 'update' | 'verify';
  timestamp: string;
}