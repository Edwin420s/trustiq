import React from 'react';
import { Link } from 'react-router-dom';

interface VerificationStatusProps {
  verifiedAccounts: number;
  totalPossibleAccounts: number;
  trustScore: number;
}

export function VerificationStatus({ 
  verifiedAccounts, 
  totalPossibleAccounts, 
  trustScore 
}: VerificationStatusProps) {
  const completionPercentage = (verifiedAccounts / totalPossibleAccounts) * 100;
  
  const getStatusLevel = () => {
    if (verifiedAccounts >= 3) return 'excellent';
    if (verifiedAccounts >= 2) return 'good';
    if (verifiedAccounts >= 1) return 'basic';
    return 'none';
  };

  const getStatusColor = () => {
    switch (getStatusLevel()) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-cyan-400';
      case 'basic':
        return 'text-yellow-400';
      default:
        return 'text-red-400';
    }
  };

  const getStatusMessage = () => {
    switch (getStatusLevel()) {
      case 'excellent':
        return 'Excellent verification status';
      case 'good':
        return 'Good verification status';
      case 'basic':
        return 'Basic verification status';
      default:
        return 'Connect accounts to improve trust score';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Verification Status</h2>
        <Link
          to="/verification"
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
        >
          Manage
        </Link>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Profile Completeness</span>
            <span className="text-white font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 border border-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-cyan-400">{verifiedAccounts}</div>
            <div className="text-slate-400 text-sm">Verified</div>
          </div>
          <div className="p-3 border border-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{totalPossibleAccounts}</div>
            <div className="text-slate-400 text-sm">Available</div>
          </div>
          <div className="p-3 border border-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{trustScore}</div>
            <div className="text-slate-400 text-sm">Score</div>
          </div>
        </div>

        {/* Status Message */}
        <div className={`p-3 rounded-lg border ${getStatusColor().replace('text', 'border')} bg-slate-750`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text', 'bg')}`}></div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </span>
          </div>
          {getStatusLevel() === 'none' && (
            <p className="text-slate-400 text-sm mt-1">
              Connect at least 2 accounts to significantly improve your trust score
            </p>
          )}
        </div>

        {/* Quick Actions */}
        {verifiedAccounts < totalPossibleAccounts && (
          <div className="flex space-x-2">
            <Link
              to="/verification"
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded text-sm font-medium text-center transition-colors"
            >
              Add Accounts
            </Link>
            {verifiedAccounts > 0 && (
              <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
                Recalculate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}