import React from 'react';

interface TrustInsightsProps {
  insights: string[];
}

export function TrustInsights({ insights }: TrustInsightsProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Trust Insights</h2>
        <div className="text-slate-400 text-center py-4">
          No insights available yet. Connect more accounts to get personalized recommendations.
        </div>
      </div>
    );
  }

  const getInsightIcon = (insight: string) => {
    if (insight.toLowerCase().includes('excellent') || insight.toLowerCase().includes('strong')) {
      return '✅';
    } else if (insight.toLowerCase().includes('low') || insight.toLowerCase().includes('improve')) {
      return '💡';
    } else if (insight.toLowerCase().includes('warning') || insight.toLowerCase().includes('unusual')) {
      return '⚠️';
    }
    return '📊';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-4">Trust Insights</h2>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 border border-slate-700 rounded-lg"
          >
            <div className="text-lg mt-0.5">{getInsightIcon(insight)}</div>
            <div className="text-slate-300 text-sm leading-relaxed">{insight}</div>
          </div>
        ))}
      </div>
    </div>
  );
}