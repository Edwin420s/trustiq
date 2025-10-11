import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { extendedTrustIQApi } from '../lib/api-extended';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => extendedTrustIQApi.getAnalytics(),
    enabled: !!user,
  });

  const { data: scoreDistribution } = useQuery({
    queryKey: ['scoreDistribution'],
    queryFn: () => extendedTrustIQApi.getTrustScoreDistribution(),
    enabled: !!user,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => extendedTrustIQApi.getSystemHealth(),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const platformUsageData = analytics?.platformUsage ? 
    Object.entries(analytics.platformUsage).map(([platform, count]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: count
    })) : [];

  const scoreDistributionData = scoreDistribution ? [
    { name: 'Excellent (90-100)', value: scoreDistribution.excellent },
    { name: 'Good (75-89)', value: scoreDistribution.good },
    { name: 'Average (60-74)', value: scoreDistribution.average },
    { name: 'Poor (40-59)', value: scoreDistribution.poor },
    { name: 'Very Poor (0-39)', value: scoreDistribution.veryPoor },
  ] : [];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-2">
            Comprehensive insights into TrustIQ platform performance
          </p>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-2xl font-bold text-cyan-400 mb-2">
              {systemHealth?.userCount || 0}
            </div>
            <div className="text-slate-400 text-sm">Total Users</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {systemHealth?.scoreCount || 0}
            </div>
            <div className="text-slate-400 text-sm">Trust Scores</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {systemHealth?.accountCount || 0}
            </div>
            <div className="text-slate-400 text-sm">Linked Accounts</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {systemHealth?.recentScores || 0}
            </div>
            <div className="text-slate-400 text-sm">Recent Updates</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Usage Chart */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Platform Usage</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#374151' }}
                    itemStyle={{ color: '#F1F5F9' }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Trust Score Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {scoreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#374151' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Verification Metrics */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Verification Metrics</h3>
            {analytics?.verificationMetrics && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Accounts</span>
                  <span className="text-white font-medium">
                    {analytics.verificationMetrics.totalAccounts}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verified Accounts</span>
                  <span className="text-green-400 font-medium">
                    {analytics.verificationMetrics.verifiedAccounts}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verification Rate</span>
                  <span className="text-cyan-400 font-medium">
                    {analytics.verificationMetrics.verificationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full"
                    style={{ width: `${analytics.verificationMetrics.verificationRate}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* System Performance */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
            {systemHealth && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg Scores per User</span>
                  <span className="text-white font-medium">
                    {systemHealth.averageScoresPerUser.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg Accounts per User</span>
                  <span className="text-white font-medium">
                    {systemHealth.averageAccountsPerUser.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-green-400 font-medium">
                    {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Update</span>
                  <span className="text-slate-400 text-sm">
                    {new Date(systemHealth.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}