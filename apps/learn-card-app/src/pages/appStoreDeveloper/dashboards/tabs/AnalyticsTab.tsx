import React from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Zap,
    CheckCircle2,
    Clock,
    Award,
    Users,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

import type { DashboardStats } from '../types';

interface AnalyticsTabProps {
    stats: DashboardStats;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stats }) => {
    const claimRateColor = stats.claimRate >= 70 ? 'text-emerald-600' : stats.claimRate >= 40 ? 'text-amber-600' : 'text-red-500';
    const claimRateBg = stats.claimRate >= 70 ? 'bg-emerald-500' : stats.claimRate >= 40 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
                <p className="text-sm text-gray-500">Track your integration performance</p>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Claim Rate - Large Card */}
                <div className="md:col-span-1 p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-cyan-100 text-sm font-medium">Claim Rate</span>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="text-5xl font-bold mb-2">{stats.claimRate.toFixed(1)}%</div>

                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(stats.claimRate, 100)}%` }}
                        />
                    </div>

                    <p className="text-cyan-100 text-sm mt-3">of issued credentials have been claimed</p>
                </div>

                {/* Total Issued */}
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 text-sm font-medium">Total Issued</span>
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-violet-600" />
                        </div>
                    </div>

                    <div className="text-4xl font-bold text-gray-900 mb-1">{stats.totalIssued.toLocaleString()}</div>

                    <p className="text-gray-500 text-sm">credentials all time</p>
                </div>

                {/* Total Claimed */}
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 text-sm font-medium">Claimed</span>
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>

                    <div className="text-4xl font-bold text-gray-900 mb-1">{stats.totalClaimed.toLocaleString()}</div>

                    <p className="text-gray-500 text-sm">successfully claimed</p>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-gray-600">Pending</span>
                    </div>

                    <div className="text-2xl font-bold text-gray-900">{stats.pendingClaims.toLocaleString()}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-violet-500" />
                        <span className="text-sm text-gray-600">Templates</span>
                    </div>

                    <div className="text-2xl font-bold text-gray-900">{stats.templateCount}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm text-gray-600">Connections</span>
                    </div>

                    <div className="text-2xl font-bold text-gray-900">{stats.totalConnections}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-pink-500" />
                        <span className="text-sm text-gray-600">Active Tokens</span>
                    </div>

                    <div className="text-2xl font-bold text-gray-900">{stats.activeTokens}</div>
                </div>
            </div>

            {/* Funnel Visualization */}
            <div className="p-6 bg-gray-50 rounded-2xl">
                <h3 className="font-semibold text-gray-800 mb-4">Credential Funnel</h3>

                <div className="space-y-3">
                    {/* Issued */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">Issued</div>
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg overflow-hidden relative">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-lg flex items-center justify-end pr-3"
                                style={{ width: '100%' }}
                            >
                                <span className="text-white font-medium text-sm">{stats.totalIssued}</span>
                            </div>
                        </div>
                    </div>

                    {/* Claimed */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">Claimed</div>
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg overflow-hidden relative">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg flex items-center justify-end pr-3"
                                style={{ width: stats.totalIssued > 0 ? `${(stats.totalClaimed / stats.totalIssued) * 100}%` : '0%' }}
                            >
                                {stats.totalClaimed > 0 && (
                                    <span className="text-white font-medium text-sm">{stats.totalClaimed}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">Pending</div>
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg overflow-hidden relative">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-lg flex items-center justify-end pr-3"
                                style={{ width: stats.totalIssued > 0 ? `${(stats.pendingClaims / stats.totalIssued) * 100}%` : '0%' }}
                            >
                                {stats.pendingClaims > 0 && (
                                    <span className="text-white font-medium text-sm">{stats.pendingClaims}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border border-gray-200 rounded-2xl">
                    <h3 className="font-semibold text-gray-800 mb-4">Performance Insights</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Claim Success Rate</span>
                            <span className={`font-semibold ${claimRateColor}`}>
                                {stats.claimRate >= 70 ? 'Excellent' : stats.claimRate >= 40 ? 'Good' : 'Needs Attention'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Unclaimed Credentials</span>
                            <span className={`font-semibold ${stats.pendingClaims > stats.totalClaimed ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {stats.pendingClaims} pending
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Template Utilization</span>
                            <span className="font-semibold text-gray-800">
                                {stats.templateCount > 0 ? `${stats.templateCount} active` : 'No templates'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border border-gray-200 rounded-2xl">
                    <h3 className="font-semibold text-gray-800 mb-4">Quick Tips</h3>

                    <div className="space-y-3">
                        {stats.claimRate < 50 && (
                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                                <ArrowUpRight className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Improve Claim Rate</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        Send reminder emails to recipients with unclaimed credentials.
                                    </p>
                                </div>
                            </div>
                        )}

                        {stats.templateCount === 0 && (
                            <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-lg">
                                <Award className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-violet-800">Create Templates</p>
                                    <p className="text-xs text-violet-700 mt-1">
                                        Add credential templates to start issuing.
                                    </p>
                                </div>
                            </div>
                        )}

                        {stats.totalIssued === 0 && (
                            <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg">
                                <Zap className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-cyan-800">Start Issuing</p>
                                    <p className="text-xs text-cyan-700 mt-1">
                                        Use the API or embed SDK to issue your first credential.
                                    </p>
                                </div>
                            </div>
                        )}

                        {stats.claimRate >= 70 && stats.totalIssued > 0 && (
                            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-800">Great Performance!</p>
                                    <p className="text-xs text-emerald-700 mt-1">
                                        Your claim rate is excellent. Keep up the good work!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
