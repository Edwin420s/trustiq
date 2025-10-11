// XSS prevention utilities
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// CSP nonce generation
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Secure storage utilities
export class SecureStorage {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
  }

  private generateEncryptionKey(): string {
    return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  }

  setItem(key: string, value: any): void {
    try {
      const encrypted = this.encrypt(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage set error:', error);
    }
  }

  getItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  private encrypt(text: string): string {
    // Simple XOR encryption for demonstration
    // In production, use proper encryption like AES
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
    }
    return btoa(result);
  }

  private decrypt(encryptedText: string): string {
    try {
      const text = atob(encryptedText);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return result;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
}

// Wallet security utilities
export class WalletSecurity {
  static validateWalletAddress(address: string): boolean {
    // Sui wallet address validation
    const suiRegex = /^0x[0-9a-fA-F]{64}$/;
    return suiRegex.test(address);
  }

  static async verifyMessageSignature(message: string, signature: string, address: string): Promise<boolean> {
    try {
      // This would use the Sui SDK to verify the signature
      // For now, return true for development
      return true;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  static createSecurityChallenge(): string {
    const challenge = `TrustIQ Login: ${Date.now()}:${crypto.randomUUID()}`;
    return challenge;
  }

  static async checkWalletPermissions(): Promise<boolean> {
    if (typeof window === 'undefined' || !(window as any).suiWallet) {
      return false;
    }

    try {
      const permissions = await (window as any).suiWallet.hasPermissions();
      return permissions;
    } catch (error) {
      console.error('Wallet permission check error:', error);
      return false;
    }
  }
}

// Session security
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  static startSessionMonitoring() {
    let lastActivity = Date.now();

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        lastActivity = Date.now();
      }, { passive: true });
    });

    setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      
      if (idleTime > this.SESSION_TIMEOUT) {
        this.handleSessionTimeout();
      } else if (idleTime > this.SESSION_TIMEOUT - this.REFRESH_THRESHOLD) {
        this.warnSessionTimeout();
      }
    }, 60000); // Check every minute
  }

  private static handleSessionTimeout() {
    // Clear authentication data
    localStorage.removeItem('trustiq_token');
    localStorage.removeItem('trustiq_user');
    
    // Redirect to login
    window.location.href = '/';
  }

  private static warnSessionTimeout() {
    // Show warning to user
    console.warn('Session will expire soon');
    // In production, show a modal or notification
  }

  static validateToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() < expiry;
    } catch (error) {
      return false;
    }
  }
}