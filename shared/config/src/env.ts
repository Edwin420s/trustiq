import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  
  SUI_RPC_URL: z.string().url(),
  SUI_FAUCET_URL: z.string().url().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().min(1),
  
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  LINKEDIN_CLIENT_ID: z.string().min(1),
  LINKEDIN_CLIENT_SECRET: z.string().min(1),
  
  IPFS_API_URL: z.string().url(),
  IPFS_API_KEY: z.string().min(1),
  
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('us-east-1'),
  
  API_PORT: z.string().default('3001'),
  AI_ENGINE_PORT: z.string().default('8000'),
});

export type EnvConfig = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);