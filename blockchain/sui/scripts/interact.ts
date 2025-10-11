import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromHEX } from '@mysten/sui.js/utils';
import { readFileSync } from 'fs';
import { join } from 'path';

export class TrustIQInteractor {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private registryId: string;

  constructor(network: string = 'testnet') {
    this.client = new SuiClient({ url: getFullnodeUrl(network) });
    this.keypair = Ed25519Keypair.fromSecretKey(
      fromHEX(process.env.DEPLOYER_PRIVATE_KEY!)
    );
    
    const deployment = JSON.parse(
      readFileSync(join(__dirname, '../deployment.json'), 'utf-8')
    );
    
    this.packageId = deployment.packageId;
    this.registryId = deployment.registryId;
  }

  async getUserTrustProfile(userAddress: string) {
    try {
      const registry = await this.client.getObject({
        id: this.registryId,
        options: { showContent: true },
      });

      // In a real implementation, you would call a view function
      // This is a simplified version that would need the actual view function
      console.log('Registry object:', registry);
      
      return {
        trustScore: 75, // Mock data
        verifiedAccounts: [],
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('Error fetching trust profile:', error);
      return null;
    }
  }

  async batchUpdateScores(updates: Array<{ userAddress: string; score: number; metadataCid: string }>) {
    const tx = new TransactionBlock();
    
    updates.forEach(update => {
      tx.moveCall({
        target: `${this.packageId}::trust_registry::update_trust_score`,
        arguments: [
          tx.object(this.registryId),
          tx.pure(update.userAddress),
          tx.pure(update.score),
          tx.pure(update.metadataCid),
        ],
      });
    });

    const result = await this.client.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: this.keypair,
    });

    return result.digest;
  }

  async getRegistryStats() {
    try {
      const registry = await this.client.getObject({
        id: this.registryId,
        options: { showContent: true },
      });

      // Parse registry data to get stats
      // This would depend on the actual Move struct layout
      return {
        totalUsers: 0, // Would be extracted from registry content
        activeVerifiers: 0,
        lastUpdate: Date.now(),
      };
    } catch (error) {
      console.error('Error fetching registry stats:', error);
      return null;
    }
  }

  async listenForEvents(callback: (event: any) => void) {
    // Subscribe to TrustRegistry events
    this.client.subscribeEvent({
      filter: {
        Package: this.packageId,
      },
      onMessage: (event) => {
        if (event.type.includes('TrustRegistry')) {
          callback(event);
        }
      },
    });
  }

  async verifyUserOwnership(userAddress: string, message: string, signature: string): Promise<boolean> {
    try {
      // Verify that the user owns the address by validating the signature
      const { verifyMessage } = await import('@mysten/sui.js/verify');
      const isValid = await verifyMessage(
        Buffer.from(message).toString('hex'),
        signature,
        userAddress
      );
      return isValid;
    } catch (error) {
      console.error('Ownership verification error:', error);
      return false;
    }
  }
}