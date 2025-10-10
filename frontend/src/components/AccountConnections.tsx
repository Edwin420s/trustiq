import React from 'react';
import { Link } from 'react-router-dom';
import { LinkedAccount } from '../lib/api';

interface AccountConnectionsProps {
  accounts: LinkedAccount[];
}

export function AccountConnections({ accounts }: AccountConnectionsProps) {
  const verifiedAccounts = accounts.filter(account => account.verified);
  const unverifiedAccounts = accounts.filter(account => !account.verified);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return '💻';
      case 'linkedin':
        return '💼';
      case 'twitter':
        return '🐦';
      case 'upwork':
        return '💼';
      default:
        return '🔗';
    }
  };

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
        <Link
          to="/verification"
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
        >
          Manage
        </Link>
      </div>

      <div className="space-y-3">
        {verifiedAccounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-3 border border-slate-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">{getProviderIcon(account.provider)}</span>
              </div>
              <div>
                <div className="text-white font-medium">
                  {getProviderName(account.provider)}
                </div>
                <div className="text-slate-400 text-sm">@{account.username}</div>
              </div>
            </div>
            <div className="text-green-400 text-xs font-medium">Verified</div>
          </div>
        ))}

        {unverifiedAccounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-3 border border-slate-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">{getProviderIcon(account.provider)}</span>
              </div>
              <div>
                <div className="text-white font-medium">
                  {getProviderName(account.provider)}
                </div>
                <div className="text-slate-400 text-sm">@{account.username}</div>
              </div>
            </div>
            <div className="text-yellow-400 text-xs font-medium">Pending</div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-4">
            <div className="text-slate-400 mb-2">No accounts connected</div>
            <Link
              to="/verification"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              Connect your first account
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex justify-between text-sm text-slate-400">
          <span>Verification Score</span>
          <span className="text-cyan-400 font-medium">
            {verifiedAccounts.length * 25}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
          <div
            className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${verifiedAccounts.length * 25}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}