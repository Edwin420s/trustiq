import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extendedTrustIQApi } from '../lib/api-extended';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => extendedTrustIQApi.getAdminStats(),
    enabled: !!user,
  });

  const { data: userAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['userAnalytics'],
    queryFn: () => extendedTrustIQApi.getUserAnalytics(),
    enabled: !!user && activeTab === 'analytics',
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => extendedTrustIQApi.getSystemHealth(),
    enabled: !!user && activeTab === 'system',
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const platformUsageData = userAnalytics?.platformUsage ? 
    Object.entries(userAnalytics.platformUsage).map(([platform, count]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: count
    })) : [];

  const userGrowthData = userAnalytics?.userGrowth?.map(day => ({
    date: new Date(day.createdAt).toLocaleDateString(),
    users: day._count.id
  })) || [];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-2">
            Platform administration and monitoring
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {['overview', 'analytics', 'users', 'system', 'audit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-cyan-400 mb-2">
                  {adminStats?.users?.total || 0}
                </div>
                <div className="text-slate-400 text-sm">Total Users</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {adminStats?.scores?._count?.id || 0}
                </div>
                <div className="text-slate-400 text-sm">Trust Scores</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {Math.round(adminStats?.scores?._avg?.score || 0)}
                </div>
                <div className="text-slate-400 text-sm">Avg Score</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="text-2xl font-bold text-yellow-400 mb-2">
                  {adminStats?.accounts?.reduce((acc: number, curr: any) => acc + curr._count.id, 0) || 0}
                </div>
                <div className="text-slate-400 text-sm">Linked Accounts</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {/* This would show recent user registrations, score updates, etc. */}
                <div className="text-slate-400 text-center py-8">
                  Recent activity data would be displayed here
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Growth Chart */}
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#374151' }}
                          />
                          <Bar dataKey="users" fill="#06B6D4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Platform Usage Chart */}
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Platform Usage</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformUsageData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {platformUsageData.map((entry, index) => (
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
                </div>

                {/* Verification Metrics */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Verification Metrics</h3>
                  {userAnalytics?.verificationMetrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border border-slate-700 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                          {userAnalytics.verificationMetrics.totalAccounts}
                        </div>
                        <div className="text-slate-400 text-sm">Total Accounts</div>
                      </div>
                      <div className="text-center p-4 border border-slate-700 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {userAnalytics.verificationMetrics.verifiedAccounts}
                        </div>
                        <div className="text-slate-400 text-sm">Verified</div>
                      </div>
                      <div className="text-center p-4 border border-slate-700 rounded-lg">
                        <div className="text-2xl font-bold text-cyan-400">
                          {userAnalytics.verificationMetrics.verificationRate.toFixed(1)}%
                        </div>
                        <div className="text-slate-400 text-sm">Verification Rate</div>
                      </div>
                      <div className="text-center p-4 border border-slate-700 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {userAnalytics.verificationMetrics.unverifiedAccounts}
                        </div>
                        <div className="text-slate-400 text-sm">Unverified</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {healthLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                  {systemHealth && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Database</span>
                        <span className={`font-medium ${
                          systemHealth.database.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {systemHealth.database.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Cache</span>
                        <span className={`font-medium ${
                          systemHealth.cache.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {systemHealth.cache.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Blockchain</span>
                        <span className={`font-medium ${
                          systemHealth.blockchain.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {systemHealth.blockchain.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Uptime</span>
                        <span className="text-white font-medium">
                          {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                  {systemHealth && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">User Count</span>
                        <span className="text-white font-medium">{systemHealth.userCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Score Count</span>
                        <span className="text-white font-medium">{systemHealth.scoreCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Account Count</span>
                        <span className="text-white font-medium">{systemHealth.accountCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Recent Updates (24h)</span>
                        <span className="text-white font-medium">{systemHealth.recentScores}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
            <div className="text-slate-400 text-center py-8">
              User management interface would be displayed here
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Audit Logs</h3>
            <div className="text-slate-400 text-center py-8">
              Audit log interface would be displayed here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}