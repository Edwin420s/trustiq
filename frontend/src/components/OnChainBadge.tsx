import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { TrustIQApi } from '../lib/api';
import toast from 'react-hot-toast';

interface OnChainBadgeProps {
  score: number;
  did: string;
}

export function OnChainBadge({ score, did }: OnChainBadgeProps) {
  const mintBadgeMutation = useMutation({
    mutationFn: () => TrustIQApi.mintBadge(),
    onSuccess: (data) => {
      toast.success('Badge minted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mint badge');
    },
  });

  const getBadgeLevel = (score: number) => {
    if (score >= 90) return 'Diamond';
    if (score >= 80) return 'Platinum';
    if (score >= 70) return 'Gold';
    if (score >= 60) return 'Silver';
    return 'Bronze';
  };

  const getBadgeColor = (score: number) => {
    if (score >= 90) return 'from-purple-500 to-pink-500';
    if (score >= 80) return 'from-cyan-500 to-blue-500';
    if (score >= 70) return 'from-yellow-500 to-orange-500';
    if (score >= 60) return 'from-gray-400 to-gray-600';
    return 'from-amber-700 to-amber-900';
  };

  const badgeLevel = getBadgeLevel(score);
  const badgeColor = getBadgeColor(score);

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-4">On-Chain Badge</h2>
      
      <div className="text-center mb-6">
        <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${badgeColor} flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold text-2xl">{score}</span>
        </div>
        <div className="text-white font-semibold text-lg">{badgeLevel} Tier</div>
        <div className="text-slate-400 text-sm">Trust Score: {score}</div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">DID</span>
          <span className="text-white font-mono text-xs truncate ml-2" title={did}>
            {did.slice(0, 16)}...
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Status</span>
          <span className="text-green-400">On-Chain</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Type</span>
          <span className="text-cyan-400">Soulbound</span>
        </div>
      </div>

      <button
        onClick={() => mintBadgeMutation.mutate()}
        disabled={mintBadgeMutation.isLoading}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
      >
        {mintBadgeMutation.isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Minting...
          </>
        ) : (
          'Mint Trust Badge'
        )}
      </button>

      <p className="text-slate-400 text-xs text-center mt-3">
        Mint a soulbound NFT badge to showcase your trust score on-chain
      </p>
    </div>
  );
}