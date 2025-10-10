import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromHEX } from '@mysten/sui.js/utils';

export class SuiService {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private registryId: string;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl('testnet') });
    this.keypair = Ed25519Keypair.fromSecretKey(
      fromHEX(process.env.DEPLOYER_PRIVATE_KEY!)
    );
    
    const deployment = JSON.parse(
      require('fs').readFileSync(
        require('path').join(__dirname, '../deployment.json'), 
        'utf-8'
      )
    );
    
    this.packageId = deployment.packageId;
    this.registryId = deployment.registryId;
  }

  async createTrustProfile(userAddress: string, did: string, metadataCid: string): Promise<string> {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::trust_registry::create_trust_profile`,
      arguments: [
        tx.object(this.registryId),
        tx.pure(userAddress),
        tx.pure(did),
        tx.pure(metadataCid),
      ],
    });

    const result = await this.client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.keypair,
    });

    return result.digest;
  }

  async updateTrustScore(userAddress: string, newScore: number, metadataCid: string): Promise<string> {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::trust_registry::update_trust_score`,
      arguments: [
        tx.object(this.registryId),
        tx.pure(userAddress),
        tx.pure(newScore),
        tx.pure(metadataCid),
      ],
    });

    const result = await this.client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.keypair,
    });

    return result.digest;
  }

  async addVerifiedAccount(
    userAddress: string, 
    provider: string, 
    username: string, 
    proofHash: string,
    accountId: string
  ): Promise<string> {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::trust_registry::add_verified_account`,
      arguments: [
        tx.object(this.registryId),
        tx.pure(userAddress),
        tx.pure(provider),
        tx.pure(username),
        tx.pure(Array.from(Buffer.from(proofHash, 'hex'))),
        tx.pure(accountId),
      ],
    });

    const result = await this.client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.keypair,
    });

    return result.digest;
  }

  async getTrustProfile(userAddress: string): Promise<any> {
    try {
      const registry = await this.client.getObject({
        id: this.registryId,
        options: { showContent: true },
      });

      // In a real implementation, you would call a view function
      // This is a simplified version
      return {
        trustScore: 50, // Default
        verifiedAccounts: [],
      };
    } catch (error) {
      console.error('Error fetching trust profile:', error);
      return null;
    }
  }

  async registerVerifier(verifierAddress: string): Promise<string> {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::trust_registry::register_verifier`,
      arguments: [
        tx.object(this.registryId),
        tx.pure(verifierAddress),
      ],
    });

    const result = await this.client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.keypair,
    });

    return result.digest;
  }
}