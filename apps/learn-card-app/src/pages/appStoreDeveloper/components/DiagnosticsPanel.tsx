import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Activity, Clock, ChevronDown, ChevronUp } from 'lucide-react';

import type { AppPermission } from '../types';
import { PERMISSION_OPTIONS } from '../types';

// Map postMessage actions to permissions
export const ACTION_TO_PERMISSION: Record<string, AppPermission> = {
    REQUEST_IDENTITY: 'request_identity',
    REQUEST_CONSENT: 'request_consent',
    SEND_CREDENTIAL: 'send_credential',
    ASK_CREDENTIAL_SPECIFIC: 'credential_by_id',
    ASK_CREDENTIAL_SEARCH: 'credential_search',
    LAUNCH_FEATURE: 'launch_feature',
    INITIATE_TEMPLATE_ISSUE: 'template_issuance',
};

export interface DiagnosticEvent {
    id: string;
    timestamp: Date;
    action: string;
    payload?: unknown;
    response?: unknown;
    permission: AppPermission | null;
    authorized: boolean;
    status: 'pending' | 'success' | 'error';
    errorMessage?: string;
}

interface DiagnosticsPanelProps {
    events: DiagnosticEvent[];
    requestedPermissions: AppPermission[];
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
    events,
    requestedPermissions,
    isExpanded = true,
    onToggleExpand,
}) => {
    const getPermissionLabel = (permission: AppPermission | null): string => {
        if (!permission) return 'Unknown';
        return PERMISSION_OPTIONS.find(p => p.value === permission)?.label || permission;
    };

    const unauthorizedCount = events.filter(e => !e.authorized && e.permission).length;
    const successCount = events.filter(e => e.status === 'success').length;
    const errorCount = events.filter(e => e.status === 'error').length;

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    return (
        <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <button
                onClick={onToggleExpand}
                className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium">Partner Connect Diagnostics</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            {successCount}
                        </span>

                        {errorCount > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                                <XCircle className="w-3 h-3" />
                                {errorCount}
                            </span>
                        )}

                        {unauthorizedCount > 0 && (
                            <span className="flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                {unauthorizedCount}
                            </span>
                        )}
                    </div>

                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </button>

            {isExpanded && (
                <>
                    {/* Requested Permissions */}
                    <div className="px-3 py-2 border-b border-gray-700">
                        <div className="text-xs text-gray-400 mb-1.5">Requested Permissions:</div>
                        <div className="flex flex-wrap gap-1.5">
                            {requestedPermissions.length === 0 ? (
                                <span className="text-xs text-gray-500 italic">None requested</span>
                            ) : (
                                requestedPermissions.map(permission => (
                                    <span
                                        key={permission}
                                        className="px-2 py-0.5 bg-cyan-900/50 text-cyan-300 rounded text-xs"
                                    >
                                        {getPermissionLabel(permission)}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="flex-1 overflow-y-auto max-h-[300px]">
                        {events.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                Waiting for partner app calls...
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {events.map(event => (
                                    <div
                                        key={event.id}
                                        className={`p-2 text-xs ${
                                            !event.authorized && event.permission
                                                ? 'bg-amber-900/20'
                                                : event.status === 'error'
                                                ? 'bg-red-900/20'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {event.status === 'pending' ? (
                                                    <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                                ) : event.status === 'success' ? (
                                                    event.authorized || !event.permission ? (
                                                        <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                                    ) : (
                                                        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                                    )
                                                ) : (
                                                    <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                                                )}

                                                <span className="font-mono text-cyan-300 truncate">
                                                    {event.action}
                                                </span>
                                            </div>

                                            <span className="text-gray-500 flex-shrink-0">
                                                {formatTime(event.timestamp)}
                                            </span>
                                        </div>

                                        {event.permission && (
                                            <div className="mt-1 ml-5 flex items-center gap-2">
                                                <span className="text-gray-400">Permission:</span>
                                                <span
                                                    className={`px-1.5 py-0.5 rounded ${
                                                        event.authorized
                                                            ? 'bg-emerald-900/50 text-emerald-300'
                                                            : 'bg-amber-900/50 text-amber-300'
                                                    }`}
                                                >
                                                    {getPermissionLabel(event.permission)}
                                                    {!event.authorized && ' (not requested!)'}
                                                </span>
                                            </div>
                                        )}

                                        {event.errorMessage && (
                                            <div className="mt-1 ml-5 text-red-400">
                                                Error: {event.errorMessage}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {unauthorizedCount > 0 && (
                        <div className="px-3 py-2 bg-amber-900/30 border-t border-amber-700/50">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-200">
                                    <strong>Warning:</strong> This app made {unauthorizedCount} call(s) using
                                    permissions it did not request. Users may be shown additional consent
                                    prompts or calls may fail.
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DiagnosticsPanel;
