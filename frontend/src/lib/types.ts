export interface User {
  id: string;
  walletAddress: string;
  did: string;
  trustScore: number;
  createdAt?: string;
}

export interface LinkedAccount {
  id: string;
  provider: 'github' | 'linkedin' | 'twitter' | 'upwork';
  username: string;
  verified: boolean;
  verificationDate?: string;
  metadata: Record<string, any>;
}

export interface TrustScore {
  id: string;
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

export interface UserProfile {
  id: string;
  walletAddress: string;
  did: string;
  trustScore: number;
  scoreBreakdown: TrustScore['breakdown'];
  insights: string[];
  linkedAccounts: LinkedAccount[];
  createdAt: string;
}