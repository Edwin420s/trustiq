import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrustScoreCard } from '../components/TrustScoreCard';
import { AccountConnections } from '../components/AccountConnections';
import { TrustInsights } from '../components/TrustInsights';
import { OnChainBadge } from '../components/OnChainBadge';
import { QuickActions } from '../components/QuickActions';
import { TrustMetrics } from '../components/TrustMetrics';
import { VerificationStatus } from '../components/VerificationStatus';
import { ScoreHistoryChart } from '../components/ScoreHistoryChart';
import { useAuth } from '../contexts/AuthContext';
import { useTrustScore } from '../hooks/useTrustScore';
import { useAccounts } from '../hooks/useAccounts';
import { extendedTrustIQApi } from '../lib/api-extended';

export function EnhancedDashboard() {
  const { user } = useAuth();
  const { trustScore, scoreHistory, isLoading: scoreLoading } = useTrustScore();
  const { accounts, isLoading: accountsLoading } = useAccounts();

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => extendedTrustIQApi.getAnalytics(),
    enabled: !!user,
  });

  const isLoading = scoreLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const verifiedAccounts = accounts?.filter(account => account.verified) || [];
  const totalPossibleAccounts = 4; // GitHub, LinkedIn, Twitter, Upwork

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            TrustIQ Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Manage your decentralized reputation and trust profile
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <TrustScoreCard 
              score={trustScore?.score || 50}
              breakdown={trustScore?.breakdown}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VerificationStatus
                verifiedAccounts={verifiedAccounts.length}
                totalPossibleAccounts={totalPossibleAccounts}
                trustScore={trustScore?.score || 50}
              />
              <QuickActions />
            </div>

            <ScoreHistoryChart data={scoreHistory || []} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <AccountConnections accounts={accounts || []} />
            <OnChainBadge 
              score={trustScore?.score || 50}
              did={user?.did || ''}
            />
            <TrustMetrics breakdown={trustScore?.breakdown} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrustInsights insights={trustScore?.insights || []} />
          
          {/* System Stats */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Blockchain Network</span>
                <span className="text-green-400 font-medium">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">AI Engine</span>
                <span className="text-green-400 font-medium">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Data Sync</span>
                <span className="text-green-400 font-medium">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Last Update</span>
                <span className="text-white font-medium">
                  {trustScore?.calculatedAt 
                    ? new Date(trustScore.calculatedAt).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}