import React from 'react';
import {
    Award,
    Palette,
    Plug,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Clock,
    Zap,
    Send,
    TrendingUp,
} from 'lucide-react';

import { CredentialTemplate, BrandingConfig, IntegrationMethod, PartnerProject } from '../types';
import { DashboardTab, IntegrationStats } from './types';

interface DashboardOverviewProps {
    project: PartnerProject;
    branding: BrandingConfig | null;
    templates: CredentialTemplate[];
    integrationMethod: IntegrationMethod | null;
    stats: IntegrationStats;
    onNavigate: (tab: DashboardTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    project,
    branding,
    templates,
    integrationMethod,
    stats,
    onNavigate,
}) => {
    const setupItems = [
        {
            id: 'branding',
            title: 'Branding',
            description: branding?.displayName ? `${branding.displayName}` : 'Configure your issuer profile',
            icon: Palette,
            color: 'bg-violet-100 text-violet-600',
            isComplete: !!branding?.displayName,
            tab: 'branding' as DashboardTab,
        },
        {
            id: 'templates',
            title: 'Credential Templates',
            description: templates.length > 0 ? `${templates.length} template(s) configured` : 'Create credential templates',
            icon: Award,
            color: 'bg-cyan-100 text-cyan-600',
            isComplete: templates.length > 0,
            tab: 'templates' as DashboardTab,
        },
        {
            id: 'integration',
            title: 'Integration',
            description: integrationMethod ? `Using ${integrationMethod.toUpperCase()} integration` : 'Set up your integration method',
            icon: Plug,
            color: 'bg-emerald-100 text-emerald-600',
            isComplete: !!integrationMethod,
            tab: 'integration' as DashboardTab,
        },
    ];

    const allComplete = setupItems.every(item => item.isComplete);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Welcome back!</h2>
                <p className="text-gray-500">
                    Here's an overview of your <span className="font-medium text-gray-700">{project.name}</span> integration.
                </p>
            </div>

            {/* Setup Checklist */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-700">Setup Status</h3>

                    {allComplete ? (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            All set up!
                        </span>
                    ) : (
                        <span className="text-sm text-gray-500">
                            {setupItems.filter(i => i.isComplete).length} of {setupItems.length} complete
                        </span>
                    )}
                </div>

                <div className="grid gap-3">
                    {setupItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.tab)}
                            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                                <item.icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-800">{item.title}</p>

                                    {item.isComplete && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    )}
                                </div>

                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>

                            <ArrowRight className="w-4 h-4 text-gray-400" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Recent Activity</h3>

                {stats.totalIssued > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl">
                            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>

                            <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                    {stats.totalIssued} credentials issued
                                </p>

                                <p className="text-sm text-gray-500">
                                    {stats.claimRate.toFixed(0)}% claim rate • {stats.pendingClaims} pending
                                </p>
                            </div>

                            <button
                                onClick={() => onNavigate('analytics')}
                                className="px-3 py-1.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
                            >
                                View Details
                            </button>
                        </div>

                        {stats.lastIssuedAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                Last issued: {new Date(stats.lastIssuedAt).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Send className="w-6 h-6 text-gray-400" />
                        </div>

                        <p className="text-gray-600 font-medium mb-1">No credentials issued yet</p>

                        <p className="text-sm text-gray-500 mb-4">
                            Start issuing credentials using your integration
                        </p>

                        <button
                            onClick={() => onNavigate('integration')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                        >
                            <Zap className="w-4 h-4" />
                            Get Started
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Quick Actions</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        onClick={() => onNavigate('templates')}
                        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left"
                    >
                        <Award className="w-5 h-5 text-cyan-600" />

                        <div>
                            <p className="font-medium text-gray-800">Add Template</p>
                            <p className="text-xs text-gray-500">Create a new credential type</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onNavigate('integration')}
                        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left"
                    >
                        <Plug className="w-5 h-5 text-emerald-600" />

                        <div>
                            <p className="font-medium text-gray-800">View API Code</p>
                            <p className="text-xs text-gray-500">Get integration code</p>
                        </div>
                    </button>

                    <button
                        onClick={() => onNavigate('analytics')}
                        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors text-left"
                    >
                        <TrendingUp className="w-5 h-5 text-violet-600" />

                        <div>
                            <p className="font-medium text-gray-800">View Analytics</p>
                            <p className="text-xs text-gray-500">Check issuance stats</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
