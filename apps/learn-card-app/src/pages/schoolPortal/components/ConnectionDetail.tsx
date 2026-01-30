import React, { useState } from 'react';
import { ChevronLeft, Calendar, Award, Loader2, Clock, RefreshCw, CheckCircle } from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import { edlinkApi } from '../api/client';
import type { LMSConnection } from '../types';
import type { EdlinkCompletionsResponse } from '@learncard/types';

interface ConnectionDetailProps {
    connection: LMSConnection;
    onBack: () => void;
    onStatusChange?: (connectionId: string, newStatus: LMSConnection['status']) => void;
}

export const ConnectionDetail: React.FC<ConnectionDetailProps> = ({
    connection,
    onBack,
    onStatusChange,
}) => {
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [completionData, setCompletionData] = useState<EdlinkCompletionsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset state when connection changes
    React.useEffect(() => {
        setCompletionData(null);
        setError(null);
    }, [connection.id]);

    const connectedDate = new Date(connection.connectedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const isPendingApproval = connection.status === 'PENDING_APPROVAL';

    // Check if integration is approved (still needs direct check for status)
    const handleCheckStatus = async () => {
        setIsCheckingStatus(true);
        try {
            // Try to fetch completions - if it works, integration is approved
            await edlinkApi.edlink.getCompletions.query({ connectionId: connection.id });
            onStatusChange?.(connection.id, 'CONNECTED');
        } catch {
            console.log('Integration still pending approval');
        } finally {
            setIsCheckingStatus(false);
        }
    };

    // Fetch completion data from backend
    const handleFetchCompletions = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await edlinkApi.edlink.getCompletions.query({ connectionId: connection.id });
            setCompletionData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch completions');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                            {connection.provider === 'canvas' ? 'C' : connection.provider === 'google' ? 'G' : 'L'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-800 truncate">
                            {connection.institutionName}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500">{connection.providerName}</span>
                            <StatusBadge status={connection.status} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Connection Info */}
                <section>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Connection Info</h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Connected</p>
                                <p className="text-sm text-gray-700">{connectedDate}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pending Approval */}
                {isPendingApproval && (
                    <section>
                        <div className="bg-white rounded-xl border border-amber-200 p-4 text-center">
                            <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700 mb-1">Awaiting Approval</p>
                            <p className="text-xs text-gray-500 mb-3">
                                Approve this integration in Ed.link Dashboard
                            </p>
                            <button
                                onClick={handleCheckStatus}
                                disabled={isCheckingStatus}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cyan-600 border border-cyan-300 rounded-lg hover:bg-cyan-50 disabled:opacity-50"
                            >
                                {isCheckingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Check Status
                            </button>
                        </div>
                    </section>
                )}

                {/* Fetch Completions */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Assignment Completions</h3>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-3">
                                Fetch who completed what assignments (returned submissions).
                            </p>

                            <button
                                onClick={handleFetchCompletions}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {isLoading ? 'Fetching...' : 'Fetch Completions'}
                            </button>

                            {error && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {completionData && (
                                <div className="mt-4 space-y-4">
                                    {/* Summary */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-blue-700">{completionData.summary.classes}</p>
                                            <p className="text-xs text-blue-500">Classes</p>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-purple-700">{completionData.summary.courseCompletions}</p>
                                            <p className="text-xs text-purple-500">Courses</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-emerald-700">{completionData.summary.assignmentCompletions}</p>
                                            <p className="text-xs text-emerald-500">Assignments</p>
                                        </div>
                                    </div>

                                    {/* Course Completions */}
                                    {completionData.courseCompletions.length > 0 && (
                                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                            <p className="text-sm font-medium text-purple-700 mb-2">
                                                Course Completions ({completionData.courseCompletions.length})
                                            </p>
                                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                                {completionData.courseCompletions.map((c, i) => (
                                                    <div key={i} className="text-xs bg-white p-2 rounded">
                                                        <span className="font-medium">{c.personName}</span>
                                                        {c.personEmail && <span className="text-gray-400 ml-1">({c.personEmail})</span>}
                                                        <span className="text-gray-400 mx-1">→</span>
                                                        <span>{c.className}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assignment Completions */}
                                    {completionData.assignmentCompletions.length > 0 ? (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <p className="text-sm font-medium text-emerald-700 mb-2">
                                                Assignment Completions
                                            </p>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {completionData.assignmentCompletions.map((c, i) => (
                                                    <div key={i} className="text-xs bg-white p-2 rounded">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <span className="font-medium text-emerald-700">{c.personName}</span>
                                                                {c.personEmail && <span className="text-gray-400 ml-1">({c.personEmail})</span>}
                                                            </div>
                                                            {c.grade !== null && <span className="text-emerald-600">{c.grade}pts</span>}
                                                        </div>
                                                        <div className="text-gray-500 mt-0.5">
                                                            {c.assignmentTitle} • {c.className}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-sm text-gray-500">No completed assignments found.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Credentials Placeholder */}
                <section>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Credentials</h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                        <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Credential issuance coming soon</p>
                    </div>
                </section>
            </div>
        </div>
    );
};
