import jwt from 'jsonwebtoken';
import { env } from '@trustiq/shared-config';
import { User } from '@prisma/client';

export function generateJWT(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      walletAddress: user.walletAddress,
      did: user.did 
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function verifyJWT(token: string): any {
  return jwt.verify(token, env.JWT_SECRET);
}

export async function verifySignature(walletAddress: string, signature: string, message: string): Promise<boolean> {
  // This is a simplified implementation
  // In production, use proper cryptographic verification
  try {
    // For Sui wallet verification
    const { verifyMessage } = await import('@mysten/sui.js/verify');
    const isValid = await verifyMessage(message, signature, walletAddress);
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}