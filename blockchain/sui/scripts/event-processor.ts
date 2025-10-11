import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromHEX } from '@mysten/sui.js/utils';
import { readFileSync } from 'fs';
import { join } from 'path';
import { WebSocketService } from '../../backend/api/src/services/websocket-service';

export class BlockchainEventProcessor {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private registryId: string;
  private wsService?: WebSocketService;
  private eventHandlers: Map<string, Function> = new Map();

  constructor(network: string = 'testnet', wsService?: WebSocketService) {
    this.client = new SuiClient({ url: getFullnodeUrl(network) });
    this.keypair = Ed25519Keypair.fromSecretKey(
      fromHEX(process.env.DEPLOYER_PRIVATE_KEY!)
    );
    this.wsService = wsService;
    
    const deployment = JSON.parse(
      readFileSync(join(__dirname, '../deployment.json'), 'utf-8')
    );
    
    this.packageId = deployment.packageId;
    this.registryId = deployment.registryId;
    
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Trust score update events
    this.eventHandlers.set('TrustScoreUpdated', this.handleTrustScoreUpdate.bind(this));
    
    // Account verification events
    this.eventHandlers.set('AccountVerified', this.handleAccountVerified.bind(this));
    
    // Badge minting events
    this.eventHandlers.set('TrustBadgeMinted', this.handleBadgeMinted.bind(this));
    
    // Oracle events
    this.eventHandlers.set('ScoreUpdateSigned', this.handleScoreUpdateSigned.bind(this));
  }

  async startEventListening() {
    console.log('Starting blockchain event listener...');
    
    try {
      await this.client.subscribeEvent({
        filter: {
          Package: this.packageId,
        },
        onMessage: (event) => {
          this.processEvent(event);
        },
      });

      console.log('Blockchain event listener started successfully');
    } catch (error) {
      console.error('Failed to start event listener:', error);
      // Retry after delay
      setTimeout(() => this.startEventListening(), 5000);
    }
  }

  private async processEvent(event: any) {
    try {
      const eventType = event.type.split('::').pop();
      const handler = this.eventHandlers.get(eventType);

      if (handler) {
        await handler(event);
      } else {
        console.log(`No handler for event type: ${eventType}`);
      }

      // Log event for analytics
      await this.logEvent(event);
      
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  private async handleTrustScoreUpdate(event: any) {
    console.log('Processing TrustScoreUpdated event:', event);
    
    const { user, old_score, new_score, metadata_cid } = event.parsedJson;
    
    // Update user trust score in database
    await this.updateUserTrustScore(user, new_score, metadata_cid);
    
    // Send real-time update via WebSocket
    if (this.wsService) {
      this.wsService.sendTrustScoreUpdate(user, old_score, new_score);
    }
    
    // Trigger additional processing
    await this.triggerPostScoreUpdate(user, new_score);
  }

  private async handleAccountVerified(event: any) {
    console.log('Processing AccountVerified event:', event);
    
    const { user, provider, username } = event.parsedJson;
    
    // Update account verification status in database
    await this.updateAccountVerification(user, provider, username);
    
    // Send real-time notification
    if (this.wsService) {
      this.wsService.sendAccountVerified(user, provider);
    }
  }

  private async handleBadgeMinted(event: any) {
    console.log('Processing TrustBadgeMinted event:', event);
    
    const { owner, badge_type, trust_score, metadata_url } = event.parsedJson;
    
    // Update user badge in database
    await this.updateUserBadge(owner, badge_type, trust_score, metadata_url);
    
    // Send real-time notification
    if (this.wsService) {
      this.wsService.sendBadgeMinted(owner, badge_type, event.id.txDigest);
    }
  }

  private async handleScoreUpdateSigned(event: any) {
    console.log('Processing ScoreUpdateSigned event:', event);
    
    const { user, score, verifier, timestamp } = event.parsedJson;
    
    // Process oracle-signed score update
    await this.processOracleScoreUpdate(user, score, verifier, timestamp);
  }

  private async updateUserTrustScore(userAddress: string, score: number, metadataCid: string) {
    // Implementation would update the database
    // This is a simplified version
    console.log(`Updating trust score for ${userAddress}: ${score}`);
    
    // In production, you would:
    // 1. Find user by wallet address
    // 2. Update trust score in database
    // 3. Store metadata CID
    // 4. Create audit log entry
  }

  private async updateAccountVerification(userAddress: string, provider: string, username: string) {
    console.log(`Verifying ${provider} account for ${userAddress}: ${username}`);
    
    // Implementation would update account verification status
  }

  private async updateUserBadge(userAddress: string, badgeType: string, score: number, metadataUrl: string) {
    console.log(`Minting ${badgeType} badge for ${userAddress} with score ${score}`);
    
    // Implementation would update user badges
  }

  private async processOracleScoreUpdate(userAddress: string, score: number, verifier: string, timestamp: number) {
    console.log(`Processing oracle score update for ${userAddress} from ${verifier}`);
    
    // Implementation would process oracle-signed updates
    // This could include:
    // - Verifying the oracle signature
    // - Checking consensus across multiple oracles
    // - Updating the final trust score
  }

  private async triggerPostScoreUpdate(userAddress: string, newScore: number) {
    // Trigger additional processing after score update
    // This could include:
    // - Recalculating related metrics
    // - Sending notifications
    // - Updating analytics
    
    console.log(`Triggering post-update processing for ${userAddress}`);
  }

  private async logEvent(event: any) {
    // Log event for analytics and auditing
    const eventLog = {
      type: event.type,
      transaction: event.id.txDigest,
      sender: event.sender,
      timestamp: new Date().toISOString(),
      parsedData: event.parsedJson,
    };
    
    console.log('Event logged:', eventLog);
    
    // In production, you would store this in a database
    // await this.storeEventInDatabase(eventLog);
  }

  // Manual event triggering for testing
  async triggerTestEvent(eventType: string, data: any) {
    const mockEvent = {
      type: `${this.packageId}::trust_registry::${eventType}`,
      parsedJson: data,
      id: { txDigest: 'test_' + Date.now() },
      sender: this.keypair.getPublicKey().toSuiAddress(),
    };
    
    await this.processEvent(mockEvent);
  }

  // Event replay functionality
  async replayEvents(startTime: number, endTime: number) {
    console.log(`Replaying events from ${new Date(startTime)} to ${new Date(endTime)}`);
    
    try {
      const events = await this.client.queryEvents({
        query: {
          Package: this.packageId,
        },
        order: 'ascending',
      });
      
      for (const event of events.data) {
        const eventTime = new Date(event.timestampMs!).getTime();
        
        if (eventTime >= startTime && eventTime <= endTime) {
          await this.processEvent(event);
        }
      }
      
      console.log('Event replay completed');
    } catch (error) {
      console.error('Error during event replay:', error);
    }
  }

  // Get event statistics
  async getEventStats() {
    try {
      const events = await this.client.queryEvents({
        query: {
          Package: this.packageId,
        },
        limit: 1000,
      });
      
      const stats = {
        totalEvents: events.data.length,
        eventsByType: new Map<string, number>(),
        recentEvents: events.data.slice(0, 10),
      };
      
      events.data.forEach(event => {
        const eventType = event.type.split('::').pop()!;
        stats.eventsByType.set(eventType, (stats.eventsByType.get(eventType) || 0) + 1);
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting event stats:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.client.getLatestCheckpointSequenceNumber();
      return {
        status: 'healthy',
        network: 'connected',
        eventListener: 'active',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        network: 'disconnected',
        eventListener: 'inactive',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}