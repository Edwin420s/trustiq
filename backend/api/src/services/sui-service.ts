import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromHEX } from '@mysten/sui.js/utils';
import { env } from '@trustiq/shared-config';

/**
 * SuiService
 *
 * Provides thin, well-documented wrappers around TrustIQ Move module entry functions.
 * Methods assume a server-side signer (verifier/admin) key for authorized calls.
 *
 * Required env:
 * - SUI_NETWORK (default: testnet)
 * - SUI_FULLNODE_URL (optional, overrides network)
 * - SUI_ADMIN_PRIVATE_KEY (hex, required for admin/verifier ops)
 * - SUI_PACKAGE_ID (optional; otherwise read from blockchain/sui/deployment.json)
 * - SUI_REGISTRY_ID (optional; otherwise read from blockchain/sui/deployment.json)
 */
export class SuiService {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private registryId: string;

  constructor() {
    const network = env.SUI_NETWORK || 'testnet';
    const url = env.SUI_FULLNODE_URL || getFullnodeUrl(network);

    this.client = new SuiClient({ url });

    if (!env.SUI_ADMIN_PRIVATE_KEY) {
      throw new Error('SUI_ADMIN_PRIVATE_KEY is required for SuiService');
    }

    // Create signer from hex private key
    const secret = fromHEX(env.SUI_ADMIN_PRIVATE_KEY);
    this.keypair = Ed25519Keypair.fromSecretKey(secret);

    const deployment = this.loadDeployment();
    this.packageId = env.SUI_PACKAGE_ID || deployment.packageId;
    this.registryId = env.SUI_REGISTRY_ID || deployment.registryId;

    if (!this.packageId || !this.registryId) {
      throw new Error('Sui deployment identifiers (packageId/registryId) not configured');
    }
  }

  /**
   * Creates a TrustProfile for a given user/wallet.
   * Calls: trust_registry::create_trust_profile(registry, user, did, metadata_cid)
   */
  async createTrustProfile(walletAddress: string, did: string, metadataCid: string): Promise<string> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${this.packageId}::trust_registry::create_trust_profile`,
      arguments: [
        tx.object(this.registryId),
        tx.pure.address(walletAddress),
        tx.pure.string(did),
        tx.pure.string(metadataCid),
      ],
    });

    const result = await this.signAndExecute(tx);
    return result.digest;
  }

  /**
   * Updates a TrustProfile trust score and metadata CID.
   * Calls: trust_registry::update_trust_score(registry, user, new_score, metadata_cid)
   */
  async updateTrustScore(walletAddress: string, score: number, metadataCid: string): Promise<string> {
    const bounded = Math.max(0, Math.min(100, Math.floor(score)));
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${this.packageId}::trust_registry::update_trust_score`,
      arguments: [
        tx.object(this.registryId),
        tx.pure.address(walletAddress),
        tx.pure.u64(bounded),
        tx.pure.string(metadataCid),
      ],
    });

    const result = await this.signAndExecute(tx);
    return result.digest;
  }

  /**
   * Adds a verified account reference to a TrustProfile.
   * Calls: trust_registry::add_verified_account(registry, user, provider, username, proof_hash, account_id)
   */
  async addVerifiedAccount(
    walletAddress: string,
    provider: string,
    username: string,
    proofHex: string,
    accountId: string,
  ): Promise<string> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${this.packageId}::trust_registry::add_verified_account`,
      arguments: [
        tx.object(this.registryId),
        tx.pure.address(walletAddress),
        tx.pure.string(provider),
        tx.pure.string(username),
        // proof_hash: vector<u8>
        tx.pure(Array.from(Buffer.from(proofHex, 'hex'))),
        tx.pure.string(accountId),
      ],
    });

    const result = await this.signAndExecute(tx);
    return result.digest;
  }

  private async signAndExecute(tx: TransactionBlock) {
    tx.setSender(this.keypair.getPublicKey().toSuiAddress());
    const { bytes, signature } = await this.client.signTransactionBlock({
      transactionBlock: tx,
      signer: this.keypair,
    } as any);

    // SDK 0.44 uses signAndExecuteTransactionBlock helper; to avoid version drift, use client.executeTransactionBlock
    const res = await this.client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: [signature],
      options: { showEffects: true, showEvents: true },
    });

    if (res.effects?.status.status !== 'success') {
      throw new Error(`Sui tx failed: ${res.effects?.status.error || 'unknown error'}`);
    }

    return res;
  }

  private loadDeployment(): { packageId: string; registryId: string } {
    try {
      const p = join(process.cwd(), 'blockchain', 'sui', 'deployment.json');
      if (existsSync(p)) {
        const raw = readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        return { packageId: parsed.packageId, registryId: parsed.registryId };
      }
      return { packageId: '', registryId: '' };
    } catch {
      return { packageId: '', registryId: '' };
    }
  }
}

export const suiService = new SuiService();
