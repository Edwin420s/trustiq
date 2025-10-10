import React from 'react';

interface TrustMetricsProps {
  breakdown?: {
    consistency: number;
    skillDepth: number;
    peerValidation: number;
    engagementQuality: number;
  };
}

export function TrustMetrics({ breakdown }: TrustMetricsProps) {
  if (!breakdown) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Trust Metrics</h2>
        <div className="text-slate-400 text-center py-4">
          No metrics available yet.
        </div>
      </div>
    );
  }

  const metrics = [
    {
      name: 'Consistency',
      value: breakdown.consistency,
      description: 'Regular activity and contributions across platforms',
      color: 'bg-blue-500',
    },
    {
      name: 'Skill Depth',
      value: breakdown.skillDepth,
      description: 'Depth and variety of demonstrated skills',
      color: 'bg-green-500',
    },
    {
      name: 'Peer Validation',
      value: breakdown.peerValidation,
      description: 'Endorsements and recognition from peers',
      color: 'bg-purple-500',
    },
    {
      name: 'Engagement Quality',
      value: breakdown.engagementQuality,
      description: 'Quality and impact of community engagement',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-4">Trust Metrics</h2>
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">{metric.name}</span>
              <span className="text-cyan-400 font-bold">{Math.round(metric.value)}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${metric.color} transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
              ></div>
            </div>
            <p className="text-slate-400 text-xs">{metric.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}