export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
    baseUrl: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  blockchain: {
    suiRpcUrl: string;
    network: 'testnet' | 'devnet' | 'mainnet';
    packageId: string;
    registryId: string;
  };
  features: {
    web3Auth: boolean;
    socialVerification: boolean;
    aiScoring: boolean;
    blockchainIntegration: boolean;
    realTimeUpdates: boolean;
    advancedAnalytics: boolean;
  };
  ui: {
    theme: {
      primary: string;
      secondary: string;
      accent: string;
    };
    enableAnimations: boolean;
  };
}

export const appConfig: AppConfig = {
  app: {
    name: 'TrustIQ',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.MODE as any) || 'development',
    baseUrl: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
    timeout: 30000,
    retries: 3,
  },
  blockchain: {
    suiRpcUrl: import.meta.env.VITE_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    network: 'testnet',
    packageId: import.meta.env.VITE_SUI_PACKAGE_ID || '',
    registryId: import.meta.env.VITE_SUI_REGISTRY_ID || '',
  },
  features: {
    web3Auth: import.meta.env.VITE_FEATURE_WEB3_AUTH !== 'false',
    socialVerification: import.meta.env.VITE_FEATURE_SOCIAL_VERIFICATION !== 'false',
    aiScoring: import.meta.env.VITE_FEATURE_AI_SCORING !== 'false',
    blockchainIntegration: import.meta.env.VITE_FEATURE_BLOCKCHAIN_INTEGRATION !== 'false',
    realTimeUpdates: import.meta.env.VITE_FEATURE_REAL_TIME_UPDATES !== 'false',
    advancedAnalytics: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS !== 'false',
  },
  ui: {
    theme: {
      primary: '#0A192F',
      secondary: '#1E293B',
      accent: '#06B6D4',
    },
    enableAnimations: true,
  },
};

// Feature flag hooks
export const useFeature = (feature: keyof AppConfig['features']) => {
  return appConfig.features[feature];
};

// Environment helpers
export const isProduction = () => appConfig.app.environment === 'production';
export const isDevelopment = () => appConfig.app.environment === 'development';
export const isTest = () => appConfig.app.environment === 'test';

// Configuration validation
export const validateConfig = (): string[] => {
  const errors: string[] = [];

  if (!appConfig.api.baseUrl) {
    errors.push('API base URL is required');
  }

  if (!appConfig.blockchain.suiRpcUrl) {
    errors.push('Sui RPC URL is required');
  }

  return errors;
};