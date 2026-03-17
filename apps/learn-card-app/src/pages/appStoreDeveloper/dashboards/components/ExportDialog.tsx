import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Calendar, Filter, Loader2, AlertCircle } from 'lucide-react';

import { useWallet } from 'learn-card-base';

import { CredentialEventType } from '../hooks/useIntegrationActivity';
import { useActivityExport, ExportOptions, ExportState } from '../hooks/useActivityExport';

interface ExportDialogProps {
    integrationId: string;
    integrationName: string;
    initialEventType?: CredentialEventType | '';
    onClose: () => void;
}

const EVENT_TYPE_OPTIONS: { value: CredentialEventType | ''; label: string }[] = [
    { value: '', label: 'All Events' },
    { value: 'CREATED', label: 'Sent' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CLAIMED', label: 'Claimed' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'FAILED', label: 'Failed' },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
    integrationId,
    integrationName,
    initialEventType = '',
    onClose,
}) => {
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;
    const { exportCsv, cancelExport, state } = useActivityExport();

    const [totalRecords, setTotalRecords] = useState<number | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [eventType, setEventType] = useState<CredentialEventType | ''>(initialEventType);

    useEffect(() => {
        let cancelled = false;

        const fetchStats = async () => {
            try {
                setIsLoadingStats(true);
                setStatsError(false);
                const wallet = await initWalletRef.current();
                const stats = await (wallet.invoke as any).getActivityStats?.({
                    integrationId,
                    eventType: eventType || undefined,
                    startDate: startDate ? new Date(startDate).toISOString() : undefined,
                    endDate: endDate
                        ? new Date(endDate + 'T23:59:59.999Z').toISOString()
                        : undefined,
                });
                if (cancelled) return;

                setTotalRecords(stats?.total ?? 0);
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to fetch stats:', err);
                setTotalRecords(null);
                setStatsError(true);
            } finally {
                if (!cancelled) {
                    setIsLoadingStats(false);
                }
            }
        };

        // Debounce filter changes to prevent rapid re-fetching
        const timeoutId = setTimeout(fetchStats, 150);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [integrationId, eventType, startDate, endDate]);

    const handleExport = async () => {
        const options: ExportOptions = {
            integrationId,
            eventType: eventType || undefined,
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined,
        };

        await exportCsv(options, integrationName);

        if (!state.error) {
            onClose();
        }
    };

    const handleCancel = () => {
        if (state.isExporting) {
            cancelExport();
        } else {
            onClose();
        }
    };

    const progressPercent =
        state.progress && state.progress.total > 0
            ? Math.round((state.progress.fetched / state.progress.total) * 100)
            : 0;

    return (
        <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Download CSV</h2>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {state.isExporting ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-xl">
                            <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                            <div className="flex-1">
                                <p className="font-medium text-cyan-900">Downloading...</p>
                                {state.progress && (
                                    <p className="text-sm text-cyan-700">
                                        {state.progress.fetched.toLocaleString()} of{' '}
                                        {state.progress.total.toLocaleString()} records
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        <button
                            onClick={cancelExport}
                            className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl min-h-[76px]">
                            <Download className="w-6 h-6 text-gray-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm text-gray-500">Export Credential Data</p>
                                <p className="font-medium text-gray-900 flex items-center gap-2 h-6">
                                    {statsError ? (
                                        <span className="text-amber-600 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Could not load count
                                        </span>
                                    ) : (
                                        <>
                                            <span
                                                className={`transition-opacity duration-150 ${
                                                    isLoadingStats ? 'opacity-50' : 'opacity-100'
                                                }`}
                                            >
                                                {totalRecords !== null
                                                    ? `${totalRecords.toLocaleString()} ${
                                                          totalRecords === 1 ? 'result' : 'results'
                                                      }`
                                                    : 'Loading...'}
                                            </span>
                                            {isLoadingStats && totalRecords !== null && (
                                                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Filter className="w-4 h-4" />
                                    Event Type
                                </label>
                                <select
                                    value={eventType}
                                    onChange={e =>
                                        setEventType(e.target.value as CredentialEventType | '')
                                    }
                                    className="w-full px-3 py-2 border bg-transparent rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    {EVENT_TYPE_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Date Range (Optional)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {state.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{state.error.message}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isLoadingStats || totalRecords === 0}
                                className="flex-1 py-3 px-4 bg-cyan-600 rounded-xl text-white font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExportDialog;
