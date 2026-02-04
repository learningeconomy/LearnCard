import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Award, Loader2, Clock, RefreshCw, CheckCircle, ToggleLeft, ToggleRight, AlertCircle, Trash2 } from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import { edlinkApi } from '../api/client';
import type { LMSConnection } from '../types';
import type { EdlinkCompletionsResponse, EdlinkIssuedCredential } from '@learncard/types';

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

    // Auto-issuance state
    const [autoIssueEnabled, setAutoIssueEnabled] = useState(connection.autoIssueCredentials ?? false);
    const [isTogglingAutoIssue, setIsTogglingAutoIssue] = useState(false);
    const [autoIssueError, setAutoIssueError] = useState<string | null>(null);

    // Issued credentials state
    const [issuedCredentials, setIssuedCredentials] = useState<EdlinkIssuedCredential[]>([]);
    const [issuedCount, setIssuedCount] = useState(0);
    const [isLoadingIssued, setIsLoadingIssued] = useState(false);

    // Reset state when connection changes
    useEffect(() => {
        setCompletionData(null);
        setError(null);
        setAutoIssueEnabled(connection.autoIssueCredentials ?? false);
        setAutoIssueError(null);
        setIssuedCredentials([]);
        setIssuedCount(0);
    }, [connection.id, connection.autoIssueCredentials]);

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

    // Toggle auto-issuance
    const handleToggleAutoIssue = async () => {
        setIsTogglingAutoIssue(true);
        setAutoIssueError(null);

        try {
            await edlinkApi.edlink.toggleAutoIssue.mutate({
                connectionId: connection.id,
                enabled: !autoIssueEnabled,
            });
            setAutoIssueEnabled(!autoIssueEnabled);
        } catch (err) {
            setAutoIssueError(err instanceof Error ? err.message : 'Failed to toggle auto-issuance');
        } finally {
            setIsTogglingAutoIssue(false);
        }
    };

    // Fetch issued credentials
    const handleFetchIssuedCredentials = async () => {
        setIsLoadingIssued(true);

        try {
            const data = await edlinkApi.edlink.getIssuedCredentials.query({
                connectionId: connection.id,
                limit: 50,
            });
            setIssuedCredentials(data.records);
            setIssuedCount(data.count);
        } catch (err) {
            console.error('Failed to fetch issued credentials:', err);
        } finally {
            setIsLoadingIssued(false);
        }
    };

    // Delete a single issued credential (for dev/debugging)
    const handleDeleteIssuedCredential = async (credentialId: string) => {
        try {
            await edlinkApi.edlink.deleteIssuedCredential.mutate({ id: credentialId });
            // Remove from local state
            setIssuedCredentials(prev => prev.filter(c => c.id !== credentialId));
            setIssuedCount(prev => prev - 1);
        } catch (err) {
            console.error('Failed to delete issued credential:', err);
        }
    };

    // Delete all issued credentials for this connection (for dev/debugging)
    const handleDeleteAllIssuedCredentials = async () => {
        if (!confirm('Delete all issued credential records? This will allow re-issuance.')) {
            return;
        }
        try {
            await edlinkApi.edlink.deleteAllIssuedCredentials.mutate({ connectionId: connection.id });
            setIssuedCredentials([]);
            setIssuedCount(0);
        } catch (err) {
            console.error('Failed to delete all issued credentials:', err);
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

                {/* Auto-Issuance Settings */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Automatic Credential Issuance</h3>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                            <p className="text-xs text-gray-500">
                                When enabled, credentials are automatically issued to students who complete assignments.
                            </p>

                            {/* Auto-Issue Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Auto-Issue Enabled</span>
                                    <p className="text-xs text-gray-500">
                                        {autoIssueEnabled ? 'Polling every 5 minutes' : 'Disabled'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleAutoIssue}
                                    disabled={isTogglingAutoIssue}
                                    className="p-1 disabled:opacity-50"
                                >
                                    {isTogglingAutoIssue ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                    ) : autoIssueEnabled ? (
                                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {autoIssueError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600">{autoIssueError}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Issued Credentials */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Issued Credentials</h3>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <button
                                onClick={handleFetchIssuedCredentials}
                                disabled={isLoadingIssued}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-600 border border-cyan-300 rounded-lg hover:bg-cyan-50 disabled:opacity-50 mb-3"
                            >
                                {isLoadingIssued ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                {isLoadingIssued ? 'Loading...' : 'Load Issued Credentials'}
                            </button>

                            {issuedCredentials.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500">
                                            Showing {issuedCredentials.length} of {issuedCount} issued credentials
                                        </p>
                                        <button
                                            onClick={handleDeleteAllIssuedCredentials}
                                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                            title="Clear all records to allow re-issuance"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="space-y-1 max-h-64 overflow-y-auto">
                                        {issuedCredentials.map(cred => (
                                            <div
                                                key={cred.id}
                                                className={`text-xs p-2 rounded ${
                                                    cred.status === 'ISSUED'
                                                        ? 'bg-emerald-50'
                                                        : cred.status === 'FAILED'
                                                        ? 'bg-red-50'
                                                        : 'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-medium">{cred.studentName}</span>
                                                        <span className="text-gray-400 ml-1">({cred.studentEmail})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-xs ${
                                                                cred.status === 'ISSUED'
                                                                    ? 'bg-emerald-200 text-emerald-700'
                                                                    : cred.status === 'FAILED'
                                                                    ? 'bg-red-200 text-red-700'
                                                                    : 'bg-gray-200 text-gray-700'
                                                            }`}
                                                        >
                                                            {cred.status}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteIssuedCredential(cred.id)}
                                                            className="text-gray-400 hover:text-red-500 p-0.5"
                                                            title="Delete record to allow re-issuance"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-gray-500 mt-0.5">
                                                    {cred.assignmentTitle} • {cred.className}
                                                </div>
                                                {cred.errorMessage && (
                                                    <div className="text-red-500 mt-0.5">{cred.errorMessage}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No credentials issued yet</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
