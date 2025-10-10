import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface TrustScoreCardProps {
  score: number;
  breakdown?: {
    consistency: number;
    skillDepth: number;
    peerValidation: number;
    engagementQuality: number;
  };
}

export function TrustScoreCard({ score, breakdown }: TrustScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">TrustIQ Score</h2>
      
      <div className="flex items-center justify-between">
        <div className="w-32 h-32">
          <CircularProgressbar
            value={score}
            text={`${Math.round(score)}`}
            styles={buildStyles({
              textSize: '24px',
              pathColor: getScoreColor(score),
              textColor: '#FFFFFF',
              trailColor: '#374151',
            })}
          />
        </div>

        {breakdown && (
          <div className="flex-1 ml-8 space-y-3">
            <ScoreBreakdownItem 
              label="Consistency" 
              value={breakdown.consistency} 
            />
            <ScoreBreakdownItem 
              label="Skill Depth" 
              value={breakdown.skillDepth} 
            />
            <ScoreBreakdownItem 
              label="Peer Validation" 
              value={breakdown.peerValidation} 
            />
            <ScoreBreakdownItem 
              label="Engagement Quality" 
              value={breakdown.engagementQuality} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBreakdownItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-slate-700 rounded-full h-2">
          <div 
            className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-white text-sm font-medium w-8">
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
}