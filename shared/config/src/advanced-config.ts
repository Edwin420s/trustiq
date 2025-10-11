import { z } from 'zod';

const advancedConfigSchema = z.object({
  // AI/ML Configuration
  AI: z.object({
    MODEL_UPDATE_FREQUENCY: z.number().default(24 * 60 * 60 * 1000), // 24 hours
    TRAINING_BATCH_SIZE: z.number().default(1000),
    PREDICTION_CONFIDENCE_THRESHOLD: z.number().min(0).max(1).default(0.7),
    ANOMALY_DETECTION_SENSITIVITY: z.number().min(0).max(1).default(0.8),
    SENTIMENT_ANALYSIS_ENABLED: z.boolean().default(true),
    BEHAVIOR_ANALYSIS_ENABLED: z.boolean().default(true),
  }),

  // Blockchain Configuration
  BLOCKCHAIN: z.object({
    NETWORK: z.enum(['testnet', 'devnet', 'mainnet']).default('testnet'),
    GAS_BUDGET: z.number().default(100000000),
    TRANSACTION_TIMEOUT: z.number().default(30000),
    MAX_RETRIES: z.number().default(3),
    CONFIRMATION_BLOCKS: z.number().default(2),
    EVENT_PROCESSING_BATCH_SIZE: z.number().default(100),
  }),

  // Cache Configuration
  CACHE: z.object({
    DEFAULT_TTL: z.number().default(3600),
    USER_DATA_TTL: z.number().default(1800),
    ANALYTICS_TTL: z.number().default(900),
    RATE_LIMIT_TTL: z.number().default(900),
    MAX_MEMORY: z.string().default('256mb'),
    CLUSTER_MODE: z.boolean().default(false),
  }),

  // Security Configuration
  SECURITY: z.object({
    PASSWORD_MIN_LENGTH: z.number().default(12),
    PASSWORD_REQUIRE_SPECIAL_CHARS: z.boolean().default(true),
    PASSWORD_REQUIRE_NUMBERS: z.boolean().default(true),
    SESSION_TIMEOUT: z.number().default(30 * 60 * 1000), // 30 minutes
    MAX_LOGIN_ATTEMPTS: z.number().default(5),
    LOCKOUT_DURATION: z.number().default(15 * 60 * 1000), // 15 minutes
    JWT_REFRESH_ENABLED: z.boolean().default(true),
    JWT_REFRESH_TTL: z.number().default(7 * 24 * 60 * 60 * 1000), // 7 days
  }),

  // Rate Limiting Configuration
  RATE_LIMITING: z.object({
    ENABLED: z.boolean().default(true),
    BURST_PROTECTION: z.boolean().default(true),
    ADAPTIVE_LIMITING: z.boolean().default(false),
    IP_WHITELIST: z.array(z.string()).default([]),
    IP_BLACKLIST: z.array(z.string()).default([]),
  }),

  // Monitoring Configuration
  MONITORING: z.object({
    ENABLED: z.boolean().default(true),
    METRICS_INTERVAL: z.number().default(60000), // 1 minute
    ALERTING_ENABLED: z.boolean().default(false),
    PERFORMANCE_THRESHOLDS: z.object({
      RESPONSE_TIME: z.number().default(1000), // 1 second
      ERROR_RATE: z.number().default(0.01), // 1%
      MEMORY_USAGE: z.number().default(0.8), // 80%
    }),
  }),

  // Feature Flags
  FEATURES: z.object({
    WEB3_AUTH: z.boolean().default(true),
    SOCIAL_VERIFICATION: z.boolean().default(true),
    AI_SCORING: z.boolean().default(true),
    BLOCKCHAIN_INTEGRATION: z.boolean().default(true),
    REAL_TIME_UPDATES: z.boolean().default(true),
    ADVANCED_ANALYTICS: z.boolean().default(true),
    MULTI_CHAIN_SUPPORT: z.boolean().default(false),
  }),

  // External Services
  EXTERNAL_SERVICES: z.object({
    GITHUB_API_RATE_LIMIT: z.number().default(5000),
    LINKEDIN_API_RATE_LIMIT: z.number().default(1000),
    IPFS_GATEWAY_URL: z.string().default('https://ipfs.io/ipfs/'),
    SENTRY_DSN: z.string().optional(),
    DATADOG_API_KEY: z.string().optional(),
  }),
});

export type AdvancedConfig = z.infer<typeof advancedConfigSchema>;

export const advancedConfig: AdvancedConfig = advancedConfigSchema.parse({
  AI: {
    MODEL_UPDATE_FREQUENCY: parseInt(process.env.AI_MODEL_UPDATE_FREQUENCY || '86400000'),
    TRAINING_BATCH_SIZE: parseInt(process.env.AI_TRAINING_BATCH_SIZE || '1000'),
    PREDICTION_CONFIDENCE_THRESHOLD: parseFloat(process.env.AI_PREDICTION_CONFIDENCE_THRESHOLD || '0.7'),
    ANOMALY_DETECTION_SENSITIVITY: parseFloat(process.env.AI_ANOMALY_DETECTION_SENSITIVITY || '0.8'),
    SENTIMENT_ANALYSIS_ENABLED: process.env.AI_SENTIMENT_ANALYSIS_ENABLED !== 'false',
    BEHAVIOR_ANALYSIS_ENABLED: process.env.AI_BEHAVIOR_ANALYSIS_ENABLED !== 'false',
  },
  BLOCKCHAIN: {
    NETWORK: (process.env.BLOCKCHAIN_NETWORK as any) || 'testnet',
    GAS_BUDGET: parseInt(process.env.BLOCKCHAIN_GAS_BUDGET || '100000000'),
    TRANSACTION_TIMEOUT: parseInt(process.env.BLOCKCHAIN_TRANSACTION_TIMEOUT || '30000'),
    MAX_RETRIES: parseInt(process.env.BLOCKCHAIN_MAX_RETRIES || '3'),
    CONFIRMATION_BLOCKS: parseInt(process.env.BLOCKCHAIN_CONFIRMATION_BLOCKS || '2'),
    EVENT_PROCESSING_BATCH_SIZE: parseInt(process.env.BLOCKCHAIN_EVENT_PROCESSING_BATCH_SIZE || '100'),
  },
  CACHE: {
    DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'),
    USER_DATA_TTL: parseInt(process.env.CACHE_USER_DATA_TTL || '1800'),
    ANALYTICS_TTL: parseInt(process.env.CACHE_ANALYTICS_TTL || '900'),
    RATE_LIMIT_TTL: parseInt(process.env.CACHE_RATE_LIMIT_TTL || '900'),
    MAX_MEMORY: process.env.CACHE_MAX_MEMORY || '256mb',
    CLUSTER_MODE: process.env.CACHE_CLUSTER_MODE === 'true',
  },
  SECURITY: {
    PASSWORD_MIN_LENGTH: parseInt(process.env.SECURITY_PASSWORD_MIN_LENGTH || '12'),
    PASSWORD_REQUIRE_SPECIAL_CHARS: process.env.SECURITY_PASSWORD_REQUIRE_SPECIAL_CHARS !== 'false',
    PASSWORD_REQUIRE_NUMBERS: process.env.SECURITY_PASSWORD_REQUIRE_NUMBERS !== 'false',
    SESSION_TIMEOUT: parseInt(process.env.SECURITY_SESSION_TIMEOUT || '1800000'),
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.SECURITY_MAX_LOGIN_ATTEMPTS || '5'),
    LOCKOUT_DURATION: parseInt(process.env.SECURITY_LOCKOUT_DURATION || '900000'),
    JWT_REFRESH_ENABLED: process.env.SECURITY_JWT_REFRESH_ENABLED !== 'false',
    JWT_REFRESH_TTL: parseInt(process.env.SECURITY_JWT_REFRESH_TTL || '604800000'),
  },
  RATE_LIMITING: {
    ENABLED: process.env.RATE_LIMITING_ENABLED !== 'false',
    BURST_PROTECTION: process.env.RATE_LIMITING_BURST_PROTECTION !== 'false',
    ADAPTIVE_LIMITING: process.env.RATE_LIMITING_ADAPTIVE_LIMITING === 'true',
    IP_WHITELIST: process.env.RATE_LIMITING_IP_WHITELIST?.split(',') || [],
    IP_BLACKLIST: process.env.RATE_LIMITING_IP_BLACKLIST?.split(',') || [],
  },
  MONITORING: {
    ENABLED: process.env.MONITORING_ENABLED !== 'false',
    METRICS_INTERVAL: parseInt(process.env.MONITORING_METRICS_INTERVAL || '60000'),
    ALERTING_ENABLED: process.env.MONITORING_ALERTING_ENABLED === 'true',
    PERFORMANCE_THRESHOLDS: {
      RESPONSE_TIME: parseInt(process.env.MONITORING_RESPONSE_TIME_THRESHOLD || '1000'),
      ERROR_RATE: parseFloat(process.env.MONITORING_ERROR_RATE_THRESHOLD || '0.01'),
      MEMORY_USAGE: parseFloat(process.env.MONITORING_MEMORY_USAGE_THRESHOLD || '0.8'),
    },
  },
  FEATURES: {
    WEB3_AUTH: process.env.FEATURE_WEB3_AUTH !== 'false',
    SOCIAL_VERIFICATION: process.env.FEATURE_SOCIAL_VERIFICATION !== 'false',
    AI_SCORING: process.env.FEATURE_AI_SCORING !== 'false',
    BLOCKCHAIN_INTEGRATION: process.env.FEATURE_BLOCKCHAIN_INTEGRATION !== 'false',
    REAL_TIME_UPDATES: process.env.FEATURE_REAL_TIME_UPDATES !== 'false',
    ADVANCED_ANALYTICS: process.env.FEATURE_ADVANCED_ANALYTICS !== 'false',
    MULTI_CHAIN_SUPPORT: process.env.FEATURE_MULTI_CHAIN_SUPPORT === 'true',
  },
  EXTERNAL_SERVICES: {
    GITHUB_API_RATE_LIMIT: parseInt(process.env.GITHUB_API_RATE_LIMIT || '5000'),
    LINKEDIN_API_RATE_LIMIT: parseInt(process.env.LINKEDIN_API_RATE_LIMIT || '1000'),
    IPFS_GATEWAY_URL: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/',
    SENTRY_DSN: process.env.SENTRY_DSN,
    DATADOG_API_KEY: process.env.DATADOG_API_KEY,
  },
});

// Configuration validation and utilities
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AdvancedConfig;

  private constructor() {
    this.config = advancedConfig;
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): AdvancedConfig {
    return this.config;
  }

  isFeatureEnabled(feature: keyof AdvancedConfig['FEATURES']): boolean {
    return this.config.FEATURES[feature];
  }

  getAIConfig() {
    return this.config.AI;
  }

  getBlockchainConfig() {
    return this.config.BLOCKCHAIN;
  }

  getSecurityConfig() {
    return this.config.SECURITY;
  }

  updateConfig(newConfig: Partial<AdvancedConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    try {
      advancedConfigSchema.parse(this.config);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }

  // Environment-specific configuration
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  isTesting(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  // Feature toggle methods
  toggleFeature(feature: keyof AdvancedConfig['FEATURES'], enabled: boolean): void {
    this.config.FEATURES[feature] = enabled;
  }

  // Configuration export for debugging
  exportConfig(maskSensitive: boolean = true): any {
    const config = { ...this.config };
    
    if (maskSensitive) {
      // Mask sensitive configuration values
      if (config.EXTERNAL_SERVICES.SENTRY_DSN) {
        config.EXTERNAL_SERVICES.SENTRY_DSN = '***';
      }
      if (config.EXTERNAL_SERVICES.DATADOG_API_KEY) {
        config.EXTERNAL_SERVICES.DATADOG_API_KEY = '***';
      }
    }
    
    return config;
  }
}

export const configManager = ConfigManager.getInstance();