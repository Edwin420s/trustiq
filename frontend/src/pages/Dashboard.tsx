import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrustScoreCard } from '../components/TrustScoreCard';
import { AccountConnections } from '../components/AccountConnections';
import { TrustInsights } from '../components/TrustInsights';
import { OnChainBadge } from '../components/OnChainBadge';
import { useAuth } from '../contexts/AuthContext';
import { TrustIQApi } from '../lib/api';

export function Dashboard() {
  const { user } = useAuth();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => TrustIQApi.getUserProfile(user!.id),
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.walletAddress.slice(0, 8)}...
          </h1>
          <p className="text-slate-400 mt-2">
            Your decentralized reputation dashboard
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <TrustScoreCard 
              score={userProfile?.trustScore || 50}
              breakdown={userProfile?.scoreBreakdown}
            />
            
            <TrustInsights insights={userProfile?.insights || []} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <AccountConnections 
              accounts={userProfile?.linkedAccounts || []}
            />
            
            <OnChainBadge 
              score={userProfile?.trustScore || 50}
              did={userProfile?.did}
            />
          </div>
        </div>
      </div>
    </div>
  );
}