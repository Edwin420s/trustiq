export interface User {
  id: string;
  walletAddress: string;
  did: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkedAccount {
  id: string;
  provider: 'github' | 'linkedin' | 'twitter' | 'upwork';
  username: string;
  verified: boolean;
  verificationDate?: Date;
  metadata: Record<string, any>;
  userId: string;
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
  calculatedAt: Date;
  userId: string;
}

export interface VerifiableCredential {
  id: string;
  type: string;
  issuer: string;
  issuanceDate: Date;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: Date;
    proofValue: string;
    verificationMethod: string;
  };
  userId: string;
}

export interface ApiKey {
  id: string;
  key: string;
  organization: string;
  rateLimit: number;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface TrustAnalysis {
  github?: GitHubAnalysis;
  linkedin?: LinkedInAnalysis;
  onChain?: OnChainAnalysis;
}

export interface GitHubAnalysis {
  commitFrequency: number;
  repoCount: number;
  followerCount: number;
  accountAgeDays: number;
  starCount: number;
  forkCount: number;
  contributionGraph: number[];
}

export interface LinkedInAnalysis {
  connectionCount: number;
  endorsementCount: number;
  experienceYears: number;
  skillCount: number;
  recommendationCount: number;
}

export interface OnChainAnalysis {
  transactionCount: number;
  nftHoldings: number;
  defiActivity: number;
  governanceParticipation: number;
  walletAgeDays: number;
}