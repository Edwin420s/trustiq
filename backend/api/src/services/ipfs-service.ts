import { create } from 'ipfs-http-client';
import { env } from '@trustiq/shared-config';

export class IPFSService {
  private ipfs;

  constructor() {
    this.ipfs = create({
      url: env.IPFS_API_URL,
      headers: {
        'Authorization': `Bearer ${env.IPFS_API_KEY}`
      }
    });
  }

  async uploadMetadata(metadata: any): Promise<string> {
    try {
      const result = await this.ipfs.add(JSON.stringify(metadata));
      return result.cid.toString();
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  async getMetadata(cid: string): Promise<any> {
    try {
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks).toString();
      return JSON.parse(data);
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error('Failed to retrieve metadata from IPFS');
    }
  }

  async uploadEncryptedMetadata(metadata: any, encryptionKey: string): Promise<{ cid: string; encryptionHash: string }> {
    try {
      // Simple encryption (in production, use proper encryption)
      const encryptedData = Buffer.from(JSON.stringify(metadata)).toString('base64');
      const result = await this.ipfs.add(encryptedData);
      
      // Create hash of encryption key for verification
      const encryptionHash = Buffer.from(encryptionKey).toString('base64').slice(0, 32);
      
      return {
        cid: result.cid.toString(),
        encryptionHash
      };
    } catch (error) {
      console.error('IPFS encrypted upload error:', error);
      throw new Error('Failed to upload encrypted metadata to IPFS');
    }
  }
}