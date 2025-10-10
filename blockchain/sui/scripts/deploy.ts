import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

class SuiDeployer {
  private readonly packagePath: string;
  private readonly network: string;
  private keypair: Ed25519Keypair;
  private client: SuiClient;

  constructor(network: string = 'testnet') {
    this.packagePath = join(process.cwd(), 'blockchain', 'sui');
    this.network = network;
    this.client = new SuiClient({ url: getFullnodeUrl(network) });
    this.keypair = Ed25519Keypair.fromSecretKey(
      Buffer.from(process.env.DEPLOYER_PRIVATE_KEY!, 'hex')
    );
  }

  async deploy(): Promise<{ packageId: string; registryId: string }> {
    try {
      console.log('Building Move package...');
      
      execSync('sui move build', { 
        cwd: this.packagePath, 
        stdio: 'inherit' 
      });

      console.log('Publishing package to Sui', this.network);
      
      const { modules, dependencies } = JSON.parse(
        execSync('sui move build --dump-bytecode-as-base64', {
          cwd: this.packagePath,
          encoding: 'utf-8'
        })
      );

      const publishTxn = await this.client.publish({
        sender: this.keypair.getPublicKey().toSuiAddress(),
        modules,
        dependencies,
        gasBudget: 100000000,
      });

      const publishResult = await this.client.waitForTransaction({
        digest: publishTxn.digest,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      if (publishResult.effects?.status.status !== 'success') {
        throw new Error('Publish transaction failed');
      }

      const packageId = publishResult.objectChanges?.find(
        (change) => change.type === 'published'
      )?.packageId;

      const registryId = publishResult.objectChanges?.find(
        (change) => 
          change.type === 'created' && 
          change.objectType?.includes('trust_registry::TrustRegistry')
      )?.objectId;

      if (!packageId || !registryId) {
        throw new Error('Could not extract package or registry ID');
      }

      const deploymentInfo = {
        packageId,
        registryId,
        network: this.network,
        deployedAt: new Date().toISOString(),
        transactionDigest: publishTxn.digest,
      };

      writeFileSync(
        join(this.packagePath, 'deployment.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );

      console.log('Deployment completed successfully');
      console.log('Package ID:', packageId);
      console.log('Registry ID:', registryId);

      return { packageId, registryId };

    } catch (error) {
      console.error('Deployment failed:', error);
      throw error;
    }
  }
}

export { SuiDeployer };