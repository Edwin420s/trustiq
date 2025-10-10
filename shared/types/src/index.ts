export interface UserProfile {
  id: string;
  did: string;
  walletAddress: string;
  trustScore: number;
  verifiedAccounts: LinkedAccount[];
  credentials: VerifiableCredential[];
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
}

export interface TrustScore {
  userId: string;
  score: number;
  breakdown: {
    consistency: number;
    skillDepth: number;
    peerValidation: number;
    engagementQuality: number;
  };
  insights: string[];
  calculatedAt: Date;
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
}