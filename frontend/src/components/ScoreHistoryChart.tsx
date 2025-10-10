import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScoreHistory {
  id: string;
  score: number;
  calculatedAt: string;
}

interface ScoreHistoryChartProps {
  data: ScoreHistory[];
}

export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  const chartData = data
    .slice(-30) // Last 30 scores
    .map(item => ({
      date: new Date(item.calculatedAt).toLocaleDateString(),
      score: item.score,
      fullDate: item.calculatedAt,
    }))
    .reverse();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`Score: ${payload[0].value}`}</p>
          <p className="text-slate-400 text-sm">{label}</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Score History</h3>
        <div className="text-slate-400 text-center py-8">
          No score history available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Trust Score History</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#06B6D4"
              strokeWidth={2}
              dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#0EA5E9' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}