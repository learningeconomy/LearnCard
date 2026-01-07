import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Award,
    CheckCircle2,
    Clock,
    Users,
    Calendar,
    RefreshCw,
    Loader2,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';

import { CredentialTemplate } from '../types';
import { IntegrationStats } from './types';

interface AnalyticsSectionProps {
    stats: IntegrationStats;
    templates: CredentialTemplate[];
}

interface TemplateAnalytics {
    templateId: string;
    templateName: string;
    issued: number;
    claimed: number;
    pending: number;
    claimRate: number;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
    stats,
    templates,
}) => {
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [isLoading, setIsLoading] = useState(false);
    const [templateAnalytics, setTemplateAnalytics] = useState<TemplateAnalytics[]>([]);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    const loadAnalytics = useCallback(async () => {
        setIsLoading(true);

        try {
            // Generate mock analytics for each template
            // In production, this would fetch real data from the API
            const analytics: TemplateAnalytics[] = templates.map(template => {
                const issued = Math.floor(Math.random() * 100) + 10;
                const claimed = Math.floor(issued * (0.5 + Math.random() * 0.4));
                const pending = issued - claimed;
                const claimRate = issued > 0 ? (claimed / issued) * 100 : 0;

                return {
                    templateId: template.id,
                    templateName: template.name,
                    issued,
                    claimed,
                    pending,
                    claimRate,
                };
            });

            setTemplateAnalytics(analytics);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setIsLoading(false);
        }
    }, [templates]);

    useEffect(() => {
        if (templates.length > 0) {
            loadAnalytics();
        }
    }, [templates, timeRange]);

    const timeRanges = [
        { id: '7d', label: '7 Days' },
        { id: '30d', label: '30 Days' },
        { id: '90d', label: '90 Days' },
        { id: 'all', label: 'All Time' },
    ];

    const totalIssued = templateAnalytics.reduce((sum, t) => sum + t.issued, 0);
    const totalClaimed = templateAnalytics.reduce((sum, t) => sum + t.claimed, 0);
    const totalPending = templateAnalytics.reduce((sum, t) => sum + t.pending, 0);
    const overallClaimRate = totalIssued > 0 ? (totalClaimed / totalIssued) * 100 : 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
                    <p className="text-sm text-gray-500">Track your credential issuance and engagement</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {timeRanges.map(range => (
                            <button
                                key={range.id}
                                onClick={() => setTimeRange(range.id as typeof timeRange)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    timeRange === range.id
                                        ? 'bg-white text-gray-800 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={loadAnalytics}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-cyan-600" />
                        <span className="text-sm font-medium text-cyan-700">Total Issued</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalIssued || totalIssued}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-cyan-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>+12% from last period</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Claimed</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalClaimed || totalClaimed}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>+8% from last period</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.pendingClaims || totalPending}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <TrendingDown className="w-3 h-3" />
                        <span>-5% from last period</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-violet-600" />
                        <span className="text-sm font-medium text-violet-700">Claim Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{(stats.claimRate || overallClaimRate).toFixed(1)}%</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-violet-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>+3% from last period</span>
                    </div>
                </div>
            </div>

            {/* Template Breakdown */}
            <div className="space-y-4">
                <h3 className="font-medium text-gray-700">By Template</h3>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                    </div>
                ) : templateAnalytics.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No template data available</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {templateAnalytics.map(template => (
                            <div key={template.templateId} className="bg-white border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                            <Award className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{template.templateName}</p>
                                            <p className="text-xs text-gray-500">{template.issued} issued</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-800">{template.claimRate.toFixed(0)}%</p>
                                        <p className="text-xs text-gray-500">claim rate</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${template.claimRate}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        {template.claimed} claimed
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-500" />
                                        {template.pending} pending
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Activity Timeline (placeholder) */}
            <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Recent Activity</h3>

                <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-1">Activity Timeline Coming Soon</p>
                    <p className="text-sm text-gray-500">
                        View detailed issuance and claim activity over time
                    </p>
                </div>
            </div>
        </div>
    );
};
