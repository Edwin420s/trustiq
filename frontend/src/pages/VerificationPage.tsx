import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TrustIQApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function VerificationPage() {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<'github' | 'linkedin' | null>(null);

  const { data: linkedAccounts } = useQuery({
    queryKey: ['linkedAccounts', user?.id],
    queryFn: () => TrustIQApi.getLinkedAccounts(user!.id),
    enabled: !!user,
  });

  const linkAccountMutation = useMutation({
    mutationFn: (provider: 'github' | 'linkedin') => TrustIQApi.linkAccount(provider),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success('Account linked successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to link account');
    },
  });

  const unlinkAccountMutation = useMutation({
    mutationFn: (accountId: string) => TrustIQApi.unlinkAccount(accountId),
    onSuccess: () => {
      toast.success('Account unlinked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlink account');
    },
  });

  const handleLinkAccount = (provider: 'github' | 'linkedin') => {
    linkAccountMutation.mutate(provider);
  };

  const handleUnlinkAccount = (accountId: string) => {
    unlinkAccountMutation.mutate(accountId);
  };

  const verifiedAccounts = linkedAccounts?.filter(account => account.verified) || [];
  const unverifiedAccounts = linkedAccounts?.filter(account => !account.verified) || [];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Account Verification</h1>
          <p className="text-slate-400 mt-2">
            Connect and verify your accounts to build your TrustIQ score
          </p>
        </div>

        {/* Available Platforms */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Connect Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                provider: 'github' as const,
                name: 'GitHub',
                description: 'Connect your GitHub account to verify your open-source contributions',
                icon: '💻',
              },
              {
                provider: 'linkedin' as const,
                name: 'LinkedIn',
                description: 'Connect your LinkedIn profile to verify professional experience',
                icon: '💼',
              },
            ].map((platform) => {
              const isConnected = linkedAccounts?.some(
                account => account.provider === platform.provider && account.verified
              );

              return (
                <div
                  key={platform.provider}
                  className="border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{platform.icon}</div>
                    <div>
                      <h3 className="text-white font-medium">{platform.name}</h3>
                      <p className="text-slate-400 text-sm">{platform.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => isConnected ? null : handleLinkAccount(platform.provider)}
                    disabled={isConnected || linkAccountMutation.isLoading}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isConnected
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-cyan-600 text-white hover:bg-cyan-700'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Connected Accounts</h2>
          
          {verifiedAccounts.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No verified accounts yet. Connect your accounts above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {verifiedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {account.provider === 'github' ? 'GH' : 'LI'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium capitalize">{account.provider}</h3>
                      <p className="text-slate-400 text-sm">@{account.username}</p>
                      <p className="text-green-400 text-xs">
                        Verified {new Date(account.verificationDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlinkAccount(account.id)}
                    disabled={unlinkAccountMutation.isLoading}
                    className="px-3 py-1 text-red-400 border border-red-400 rounded-md text-sm hover:bg-red-400 hover:text-white transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Verification Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-slate-700 rounded-lg">
              <div className="text-2xl text-cyan-400 font-bold mb-2">
                {verifiedAccounts.length}
              </div>
              <div className="text-slate-400 text-sm">Verified Accounts</div>
            </div>
            <div className="text-center p-4 border border-slate-700 rounded-lg">
              <div className="text-2xl text-cyan-400 font-bold mb-2">
                {verifiedAccounts.length * 25}%
              </div>
              <div className="text-slate-400 text-sm">Profile Completeness</div>
            </div>
            <div className="text-center p-4 border border-slate-700 rounded-lg">
              <div className="text-2xl text-cyan-400 font-bold mb-2">
                {verifiedAccounts.length >= 2 ? 'Good' : 'Basic'}
              </div>
              <div className="text-slate-400 text-sm">Trust Level</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}