export interface SuiTransaction {
  digest: string;
  timestamp: string;
  status: 'success' | 'failure';
  events: SuiEvent[];
}

export interface SuiEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface TrustProfile {
  owner: string;
  did: string;
  trustScore: number;
  verifiedAccounts: VerifiedAccount[];
  metadataCid: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface VerifiedAccount {
  provider: string;
  username: string;
  verifiedAt: number;
  proofHash: string;
  accountId: string;
}

export interface TrustRegistry {
  users: Map<string, TrustProfile>;
  verifiers: string[];
  admin: string;
  userCount: number;
}