import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Blockchain
  SUI_RPC_URL: z.string().url(),
  SUI_FAUCET_URL: z.string().url().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().min(1),
  
  // API Keys
  GITHUB_API_KEY: z.string().min(1),
  LINKEDIN_API_KEY: z.string().min(1),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // IPFS
  IPFS_API_URL: z.string().url(),
  IPFS_API_KEY: z.string().min(1),
  
  // AWS
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('us-east-1'),
  
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);