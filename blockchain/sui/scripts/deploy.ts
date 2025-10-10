import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

class SuiDeployer {
  private readonly packagePath: string;
  private readonly network: string;

  constructor(network: string = 'testnet') {
    this.packagePath = join(process.cwd(), 'blockchain', 'sui');
    this.network = network;
  }

  async deploy(): Promise<void> {
    try {
      console.log('📦 Building Move package...');
      
      // Build the package
      execSync('sui move build', { 
        cwd: this.packagePath, 
        stdio: 'inherit' 
      });

      console.log('🚀 Publishing package...');
      
      // Publish the package
      const publishOutput = execSync('sui client publish --gas-budget 100000000', {
        cwd: this.packagePath,
        encoding: 'utf-8'
      });

      console.log('📄 Processing deployment output...');
      
      // Extract package ID and object IDs from output
      const { packageId, registryId } = this.extractObjectIds(publishOutput);
      
      // Save deployment info
      const deploymentInfo = {
        packageId,
        registryId,
        network: this.network,
        deployedAt: new Date().toISOString()
      };

      writeFileSync(
        join(this.packagePath, 'deployment.json'),
        JSON.stringify(deploymentInfo, null, 2)
      );

      console.log('✅ Deployment completed successfully!');
      console.log('📊 Deployment Info:', deploymentInfo);

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  private extractObjectIds(publishOutput: string): { packageId: string; registryId: string } {
    const lines = publishOutput.split('\n');
    let packageId = '';
    let registryId = '';

    for (const line of lines) {
      if (line.includes('Package ID:')) {
        packageId = line.split('Package ID:')[1].trim();
      }
      if (line.includes('Created Object:')) {
        const objectLine = line.split('Created Object:')[1].trim();
        const objectId = objectLine.split(' ')[0];
        // The first created object is the TrustRegistry
        if (!registryId) {
          registryId = objectId;
        }
      }
    }

    if (!packageId || !registryId) {
      throw new Error('Could not extract package or object IDs from deployment output');
    }

    return { packageId, registryId };
  }
}

// Deploy if run directly
if (require.main === module) {
  const deployer = new SuiDeployer();
  deployer.deploy().catch(console.error);
}

export { SuiDeployer };