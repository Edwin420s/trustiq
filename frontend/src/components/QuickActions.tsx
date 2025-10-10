import React from 'react';
import { Link } from 'react-router-dom';
import { useTrustScore } from '../hooks/useTrustScore';

export function QuickActions() {
  const { recalculateTrustScore, isRecalculating, mintBadge, isMinting } = useTrustScore();

  const actions = [
    {
      title: 'Recalculate Score',
      description: 'Update your trust score with latest data',
      icon: '🔄',
      action: recalculateTrustScore,
      loading: isRecalculating,
      color: 'bg-blue-500',
    },
    {
      title: 'Mint Badge',
      description: 'Mint your trust score as an on-chain NFT',
      icon: '🪙',
      action: mintBadge,
      loading: isMinting,
      color: 'bg-purple-500',
    },
    {
      title: 'Verify Accounts',
      description: 'Connect more accounts to improve your score',
      icon: '✅',
      link: '/verification',
      color: 'bg-green-500',
    },
    {
      title: 'View Profile',
      description: 'See your complete trust profile',
      icon: '👤',
      link: '/profile',
      color: 'bg-cyan-500',
    },
  ];

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <div
            key={index}
            className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl">{action.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{action.title}</h3>
                <p className="text-slate-400 text-sm">{action.description}</p>
              </div>
            </div>
            <div className="mt-3">
              {action.link ? (
                <Link
                  to={action.link}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded text-sm font-medium text-center block transition-colors"
                >
                  Go
                </Link>
              ) : (
                <button
                  onClick={action.action}
                  disabled={action.loading}
                  className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded text-sm font-medium transition-colors"
                >
                  {action.loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Run'
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}