/**
 * ConnectionsTab - View consent records for a ConsentFlow contract
 *
 * Shows consent data records from getConsentFlowData(), including
 * shared personal data, credential categories, and consent dates.
 */

import React, { useState, useMemo } from 'react';
import {
    Users,
    Calendar,
    Database,
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronUp,
    FileText,
    User,
    Shield,
    AlertCircle,
    Info,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useQuery } from '@tanstack/react-query';

import type { GuideState } from '../../guides/types';
import { CodeOutputPanel } from '../../guides/shared/CodeOutputPanel';

interface ConnectionsTabProps {
    integration: LCNIntegration;
}

interface ConsentRecord {
    credentials: { categories: Record<string, string[]> };
    personal: Record<string, string>;
    date: string;
}

/** Extract a human-readable name from shared personal data fields */
function getConsentRecordDisplayName(personal: Record<string, string>): string | null {
    const nameKeys = ['name', 'full_name', 'fullName', 'displayName', 'display_name'];
    for (const key of nameKeys) {
        if (personal[key]) return personal[key];
    }
    // Fall back to email if no name field
    if (personal.email) return personal.email;
    return null;
}

export const ConnectionsTab: React.FC<ConnectionsTabProps> = ({ integration }) => {
    const { initWallet } = useWallet();
    const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

    const guideState = integration?.guideState as GuideState | undefined;
    const savedConfig = guideState?.config?.consentFlowConfig as {
        contractUri?: string;
    } | undefined;

    const contractUri = savedConfig?.contractUri || '';

    const {
        data: consentData,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ['consentFlowData', contractUri],
        queryFn: async () => {
            if (!contractUri) return null;
            const wallet = await initWallet();
            const result = await wallet.invoke.getConsentFlowData(contractUri, { limit: 50 });
            return result;
        },
        enabled: !!contractUri,
        staleTime: 30_000,
    });

    const records: ConsentRecord[] = useMemo(() => {
        if (!consentData) return [];
        // Handle both paginated { records: [...] } and direct array responses
        if (Array.isArray(consentData)) return consentData;
        if (consentData.records) return consentData.records;
        return [];
    }, [consentData]);

    // No contract configured
    if (!contractUri) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Connected Users</h2>
                    <p className="text-sm text-gray-500">Users who have consented to share data with you</p>
                </div>

                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No contract configured</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                        Complete the Build guide to create a consent flow contract first.
                        Consent records will appear here once users start granting consent.
                    </p>
                </div>
            </div>
        );
    }

    // Loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Connected Users</h2>
                    <p className="text-sm text-gray-500">Users who have consented to share data with you</p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-800 text-sm">Failed to load consent data</p>
                        <p className="text-xs text-red-700 mt-1">
                            {error instanceof Error ? error.message : 'Unknown error'}
                        </p>

                        <button
                            onClick={() => refetch()}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Connected Users</h2>
                    <p className="text-sm text-gray-500">
                        {records.length > 0
                            ? `${records.length} consent record${records.length !== 1 ? 's' : ''}`
                            : 'Users who have consented to share data with you'}
                    </p>
                </div>

                <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Contract info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <FileText className="w-4 h-4 text-gray-500" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Contract URI</p>
                    <code className="text-xs text-gray-700 truncate block">{contractUri}</code>
                </div>
            </div>

            {records.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No consent records yet</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                        Users who grant consent via your redirect flow will appear here.
                        Try the consent flow from the Testing tab first.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {records.map((record, idx) => {
                        const isExpanded = expandedRecord === idx;
                        const personalKeys = Object.keys(record.personal || {});
                        const credCategories = Object.keys(record.credentials?.categories || {});
                        const consentDate = new Date(record.date);

                        return (
                            <div
                                key={`${record.date}-${idx}`}
                                className="border border-gray-200 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedRecord(isExpanded ? null : idx)}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>

                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-gray-800">
                                            {getConsentRecordDisplayName(record.personal || {}) || `Consent Record #${records.length - idx}`}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {consentDate.toLocaleDateString()} {consentDate.toLocaleTimeString()}
                                            </span>

                                            {personalKeys.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Database className="w-3 h-3" />
                                                    {personalKeys.length} field{personalKeys.length !== 1 ? 's' : ''} shared
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                                        {/* Personal Data */}
                                        {personalKeys.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-medium text-gray-600 mb-2">Shared Personal Data</p>

                                                <div className="space-y-1">
                                                    {personalKeys.map(key => (
                                                        <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                            <span className="text-xs text-gray-500 capitalize">
                                                                {key.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-xs text-gray-700 font-mono">
                                                                {record.personal[key]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Credential Categories */}
                                        {credCategories.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 mb-2">Shared Credential Categories</p>

                                                <div className="flex flex-wrap gap-2">
                                                    {credCategories.map(cat => (
                                                        <span
                                                            key={cat}
                                                            className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs"
                                                        >
                                                            {cat} ({(record.credentials.categories[cat] || []).length})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* No data shared */}
                                        {personalKeys.length === 0 && credCategories.length === 0 && (
                                            <p className="mt-3 text-xs text-gray-400 italic">
                                                Consent granted with no additional data shared
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* API Reference */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Query via API</span>
                </div>

                <CodeOutputPanel
                    snippets={{
                        typescript: `const consentData = await learnCard.invoke.getConsentFlowData(
    '${contractUri}',
    { limit: 50 }
);

console.log('Total records:', consentData.records.length);`,
                    }}
                />
            </div>
        </div>
    );
};
