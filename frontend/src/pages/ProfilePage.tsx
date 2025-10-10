import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { TrustIQApi } from '../lib/api';

export function ProfilePage() {
  const { user } = useAuth();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => TrustIQApi.getUserProfile(user!.id),
    enabled: !!user,
  });

  const { data: scoreHistory } = useQuery({
    queryKey: ['scoreHistory', user?.id],
    queryFn: () => TrustIQApi.getScoreHistory(user!.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Your Profile</h1>
          <p className="text-slate-400 mt-2">
            Manage your TrustIQ identity and settings
          </p>
        </div>

        {/* Profile Overview */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Identity Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Wallet Address</label>
              <div className="text-white font-mono bg-slate-900 px-3 py-2 rounded border border-slate-700">
                {user?.walletAddress}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">DID</label>
              <div className="text-white font-mono bg-slate-900 px-3 py-2 rounded border border-slate-700 text-sm">
                {user?.did}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Member Since</label>
              <div className="text-white">
                {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Current Trust Score</label>
              <div className="text-cyan-400 font-bold text-xl">
                {userProfile?.trustScore || 50}
              </div>
            </div>
          </div>
        </div>

        {/* Score History */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Trust Score History</h2>
          {scoreHistory && scoreHistory.length > 0 ? (
            <div className="space-y-3">
              {scoreHistory.slice(0, 10).map((score, index) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between p-3 border border-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-cyan-400 font-bold">{score.score}</span>
                    </div>
                    <div>
                      <div className="text-white">
                        Calculated {new Date(score.calculatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {score.insights?.[0] || 'No insights available'}
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {new Date(score.calculatedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              No score history available yet.
            </p>
          )}
        </div>

        {/* Linked Accounts */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Linked Accounts</h2>
          {userProfile?.linkedAccounts && userProfile.linkedAccounts.length > 0 ? (
            <div className="space-y-3">
              {userProfile.linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      account.verified ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      <span className="text-white font-bold text-sm capitalize">
                        {account.provider.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium capitalize">{account.provider}</h3>
                      <p className="text-slate-400">@{account.username}</p>
                      <p className={`text-xs ${
                        account.verified ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {account.verified ? 'Verified' : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {account.verificationDate && 
                      `Verified ${new Date(account.verificationDate).toLocaleDateString()}`
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              No accounts linked yet. Visit the verification page to connect your accounts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}