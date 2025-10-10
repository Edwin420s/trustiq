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
        className="inline-flex items-center px