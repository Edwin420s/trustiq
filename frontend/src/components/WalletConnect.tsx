import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function WalletConnect() {
  const { login } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);

      // Check if Sui wallet is available
      if (typeof window === 'undefined' || !(window as any).suiWallet) {
        toast.error('Sui wallet not found. Please install a Sui wallet extension.');
        return;
      }

      const suiWallet = (window as any).suiWallet;
      
      // Request account access
      const accounts = await suiWallet.requestPermissions();
      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found. Please ensure your wallet is unlocked.');
        return;
      }

      const walletAddress = accounts[0];
      
      // Create sign message
      const message = `TrustIQ Login: ${Date.now()}`;
      
      // Sign message
      const signature = await suiWallet.signMessage({
        message: Buffer.from(message).toString('hex'),
      });

      // Login with signed message
      await login(walletAddress, signature.signature, message);
      
      toast.success('Wallet connected successfully');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleConnectWallet}
        disabled={isConnecting}
        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>
      <p className="text-slate-400 mt-4 text-sm">
        Connect your Sui wallet to get started with TrustIQ
      </p>
    </div>
  );
}