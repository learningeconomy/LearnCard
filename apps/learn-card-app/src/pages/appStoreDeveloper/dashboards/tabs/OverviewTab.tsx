import React from 'react';
import {
    Key,
    Code,
    Award,
    FileText,
    Shield,
    ExternalLink,
    Layout,
    ChevronDown,
} from 'lucide-react';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import type { DashboardConfig, DashboardStats, CredentialTemplate } from '../types';
import { openExternalLink } from 'src/helpers/externalLinkHelpers';
import { IssuanceList } from 'src/components/issuances/IssuanceList';

interface OverviewTabProps {
    integration: LCNIntegration;
    config: DashboardConfig;
    stats: DashboardStats;
    templates: CredentialTemplate[];
    appListings?: AppStoreListing[];
    selectedListingId?: string;
    onListingFilterChange?: (listingId: string | undefined) => void;
    onNavigate: (tabId: string) => void;
    refreshKey?: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    integration,
    config,
    stats,
    templates,
    appListings,
    selectedListingId,
    onListingFilterChange,
    onNavigate,
    refreshKey,
}) => {
    // Use the dashboard-level filter if provided, otherwise use local state
    const listingFilter = selectedListingId === undefined ? 'ALL' : selectedListingId || 'ALL';
    const setListingFilter = (value: string) => {
        if (onListingFilterChange) {
            onListingFilterChange(value === 'ALL' ? undefined : value);
        }
    };

    const quickActions = [];

    if (config.showApiTokens) {
        quickActions.push({
            id: 'tokens',
            icon: Key,
            iconColor: 'text-cyan-600',
            title: 'Manage API Tokens',
            description: `${stats.activeTokens} active tokens`,
            hoverColor: 'hover:border-cyan-300 hover:bg-cyan-50',
        });
    }

    if (config.showTemplates) {
        quickActions.push({
            id: 'templates',
            icon: Award,
            iconColor: 'text-violet-600',
            title: 'Manage Templates',
            description: `${stats.templateCount || 0} credential templates`,
            hoverColor: 'hover:border-violet-300 hover:bg-violet-50',
        });
    }

    if (config.showEmbedCode) {
        quickActions.push({
            id: 'embed-code',
            icon: Code,
            iconColor: 'text-pink-600',
            title: 'Get Embed Code',
            description: 'Copy code for your website',
            hoverColor: 'hover:border-pink-300 hover:bg-pink-50',
        });
    }

    if (config.showContracts) {
        quickActions.push({
            id: 'contracts',
            icon: FileText,
            iconColor: 'text-emerald-600',
            title: 'Manage Contracts',
            description: `${stats.activeContracts || 0} active contracts`,
            hoverColor: 'hover:border-emerald-300 hover:bg-emerald-50',
        });
    }

    if (config.showSigningAuthority) {
        quickActions.push({
            id: 'signing',
            icon: Shield,
            iconColor: 'text-emerald-600',
            title: 'Signing Authority',
            description: 'Configure credential signing',
            hoverColor: 'hover:border-emerald-300 hover:bg-emerald-50',
        });
    }

    // Always add documentation link
    const docsUrl = getDocsUrl(integration.guideType);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Common tasks for managing your integration
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.slice(0, 2).map(action => (
                        <button
                            key={action.id}
                            onClick={() => onNavigate(action.id)}
                            className={`p-4 border border-gray-200 rounded-xl ${action.hoverColor} transition-colors text-left group`}
                        >
                            <action.icon className={`w-8 h-8 ${action.iconColor} mb-3`} />
                            <h3 className="font-medium text-gray-800 group-hover:text-gray-900">
                                {action.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                        </button>
                    ))}

                    <button
                        onClick={() => openExternalLink(docsUrl)}
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <ExternalLink className="w-8 h-8 text-cyan-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">
                            Documentation
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Learn how to integrate</p>
                    </button>
                </div>
            </div>

            <div>
                {/* App Listing Filter header row - only show if multiple apps exist */}
                {appListings && appListings.length > 1 && (
                    <div className="flex items-center justify-end mb-3">
                        <div className="relative">
                            <select
                                value={listingFilter}
                                onChange={e => setListingFilter(e.target.value)}
                                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-[5px] text-sm
                                           text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500
                                           focus:border-transparent cursor-pointer transition-colors max-w-[180px]"
                            >
                                <option value="ALL">All Apps</option>
                                {appListings.map(listing => (
                                    <option key={listing.listing_id} value={listing.listing_id}>
                                        {listing.display_name}
                                    </option>
                                ))}
                            </select>
                            <Layout className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                )}

                <IssuanceList
                    title="Recent Activity"
                    surface="issuer-dashboard"
                    integrationId={integration.id}
                    integrationName={integration.name}
                    listingId={selectedListingId}
                    templates={templates}
                    appListings={appListings}
                    showFilter
                    showExport
                    refreshKey={refreshKey}
                />
            </div>
        </div>
    );
};

function getDocsUrl(guideType?: string): string {
    switch (guideType) {
        case 'issue-credentials':
            return 'https://docs.learncard.com/how-to-guides/send-credentials';
        case 'embed-claim':
            return 'https://github.com/learningeconomy/LearnCard/tree/main/packages/learn-card-embed-sdk';
        case 'embed-app':
            return 'https://docs.learncard.com/sdks/partner-connect';
        case 'consent-flow':
            return 'https://docs.learncard.com/core-concepts/consent-and-permissions/consentflow-overview';
        default:
            return 'https://docs.learncard.com';
    }
}
