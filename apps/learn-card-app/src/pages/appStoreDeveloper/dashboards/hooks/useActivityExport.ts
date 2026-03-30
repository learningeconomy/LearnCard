import { useState, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

import {
    CredentialActivityRecord,
    CredentialEventType,
    getEventTypeLabel,
    formatActivitySource,
} from './useIntegrationActivity';

export interface ExportOptions {
    integrationId: string;
    listingId?: string;
    boostUris?: string[];
    eventType?: CredentialEventType;
    startDate?: string;
    endDate?: string;
}

export interface ExportState {
    isExporting: boolean;
    progress: { fetched: number; total: number } | null;
    error: Error | null;
}

interface ActivityChainMap {
    [activityId: string]: CredentialActivityRecord[];
}

interface CsvRow {
    credentialName: string;
    credentialCategory: string;
    recipientName: string;
    recipientId: string;
    recipientType: string;
    status: string;
    deliveryMethod: string;
    dateSent: string;
    dateClaimed: string;
    timeToClaim: string;
    errorDetails: string;
    source: string;
    activityId: string;
}

const CSV_HEADERS = [
    'Credential Name',
    'Credential Category',
    'Recipient Name',
    'Recipient ID',
    'Recipient Type',
    'Status',
    'Delivery Method',
    'Date Sent',
    'Date Claimed',
    'Time to Claim (hours)',
    'Error Details',
    'Source',
    'Activity ID',
];

const UTF8_BOM = '\uFEFF';

function escapeCSVField(field: string): string {
    if (!field) return '';
    if (
        field.includes(',') ||
        field.includes('"') ||
        field.includes('\n') ||
        field.includes('\r')
    ) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

function formatRecipientType(type: string): string {
    switch (type) {
        case 'email':
            return 'Email';
        case 'phone':
            return 'Phone';
        case 'profile':
            return 'Profile';
        default:
            return type;
    }
}

function deriveStatus(chain: CredentialActivityRecord[]): string {
    const eventTypes = chain.map(e => e.eventType);

    if (eventTypes.includes('CLAIMED')) return 'Claimed';
    if (eventTypes.includes('FAILED')) return 'Failed';
    if (eventTypes.includes('EXPIRED')) return 'Expired';
    if (eventTypes.includes('DELIVERED')) return 'Delivered';
    if (eventTypes.includes('CREATED')) return 'Sent';

    return 'Unknown';
}

function deriveDeliveryMethod(record: CredentialActivityRecord): string {
    if (record.recipientType === 'email' || record.recipientType === 'phone') {
        return 'Email Delivery';
    }
    return 'Direct to Profile';
}

function findEventTimestamp(
    chain: CredentialActivityRecord[],
    eventType: CredentialEventType
): string {
    const event = chain.find(e => e.eventType === eventType);
    return event?.timestamp || '';
}

function findSentTimestamp(chain: CredentialActivityRecord[]): string {
    const created = findEventTimestamp(chain, 'CREATED');
    if (created) return created;
    return findEventTimestamp(chain, 'DELIVERED');
}

function calculateTimeToClaim(chain: CredentialActivityRecord[]): string {
    const sentTimestamp = findSentTimestamp(chain);
    const claimedTimestamp = findEventTimestamp(chain, 'CLAIMED');

    if (!sentTimestamp || !claimedTimestamp) return '';

    const sentDate = new Date(sentTimestamp);
    const claimedDate = new Date(claimedTimestamp);
    const diffMs = claimedDate.getTime() - sentDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    return hours.toFixed(2);
}

function findBoostData(
    record: CredentialActivityRecord,
    chain: CredentialActivityRecord[]
): { name: string; category: string } {
    let name = '';
    let category = '';

    // First try the current record
    if (record.boost?.name) name = record.boost.name;
    if (record.boost?.category) category = record.boost.category;

    // Look through the chain for boost data (usually on CREATED event)
    if (!name || !category) {
        for (const event of chain) {
            if (!name && event.boost?.name) name = event.boost.name;
            if (!category && event.boost?.category) category = event.boost.category;
            if (name && category) break;
        }
    }

    return { name, category };
}

function buildCsvRow(record: CredentialActivityRecord, chain: CredentialActivityRecord[]): CsvRow {
    const errorEvent = chain.find(e => e.eventType === 'FAILED');
    const errorDetails = errorEvent?.metadata?.error ? String(errorEvent.metadata.error) : '';
    const boostData = findBoostData(record, chain);

    return {
        credentialName: boostData.name,
        credentialCategory: boostData.category,
        recipientName: record.recipientProfile?.displayName || '',
        recipientId: record.recipientIdentifier || '',
        recipientType: formatRecipientType(record.recipientType),
        status: deriveStatus(chain),
        deliveryMethod: deriveDeliveryMethod(record),
        dateSent: findSentTimestamp(chain),
        dateClaimed: findEventTimestamp(chain, 'CLAIMED'),
        timeToClaim: calculateTimeToClaim(chain),
        errorDetails,
        source: formatActivitySource(record.source),
        activityId: record.activityId,
    };
}

function rowToCsvLine(row: CsvRow): string {
    return [
        escapeCSVField(row.credentialName),
        escapeCSVField(row.credentialCategory),
        escapeCSVField(row.recipientName),
        escapeCSVField(row.recipientId),
        escapeCSVField(row.recipientType),
        escapeCSVField(row.status),
        escapeCSVField(row.deliveryMethod),
        escapeCSVField(row.dateSent),
        escapeCSVField(row.dateClaimed),
        escapeCSVField(row.timeToClaim),
        escapeCSVField(row.errorDetails),
        escapeCSVField(row.source),
        escapeCSVField(row.activityId),
    ].join(',');
}

function generateFilename(integrationName: string): string {
    const date = new Date().toISOString().split('T')[0];
    const safeName = integrationName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    return `${safeName}-credentials-${date}.csv`;
}

async function downloadCsvWeb(csvContent: string, filename: string): Promise<void> {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

async function downloadCsvNative(
    csvContent: string,
    filename: string,
    presentToast: (message: string, type: ToastTypeEnum) => void
): Promise<void> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(csvContent);
    const base64 = btoa(String.fromCharCode(...bytes));

    await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
    });

    presentToast(`CSV saved to Documents: ${filename}`, ToastTypeEnum.Success);
}

export function useActivityExport(): {
    exportCsv: (options: ExportOptions, integrationName: string) => Promise<boolean>;
    cancelExport: () => void;
    state: ExportState;
} {
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;
    const { presentToast } = useToast();

    const [state, setState] = useState<ExportState>({
        isExporting: false,
        progress: null,
        error: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const cancelExport = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setState({ isExporting: false, progress: null, error: null });
    }, []);

    const exportCsv = useCallback(
        async (options: ExportOptions, integrationName: string): Promise<boolean> => {
            const { integrationId, listingId, boostUris, eventType, startDate, endDate } = options;

            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            setState({ isExporting: true, progress: { fetched: 0, total: 0 }, error: null });

            try {
                const wallet = await initWalletRef.current();

                const stats = await wallet.invoke.getActivityStats?.({
                    boostUris: boostUris?.length ? boostUris : undefined,
                    integrationId,
                    listingId,
                    eventType,
                    startDate,
                    endDate,
                });

                const totalEstimate = stats?.total || 0;

                setState(prev => ({
                    ...prev,
                    progress: { fetched: 0, total: totalEstimate },
                }));

                const allRecords: CredentialActivityRecord[] = [];
                const activityIdSet = new Set<string>();
                let cursor: string | undefined;
                let hasMore = true;
                const pageSize = 100;

                while (hasMore && !signal.aborted) {
                    const result = await wallet.invoke.getMyActivities?.({
                        limit: pageSize,
                        cursor,
                        integrationId,
                        listingId,
                        eventType,
                        startDate,
                        endDate,
                        groupByLatestStatus: true, // Export shows unique credentials filtered by current status
                    });

                    if (signal.aborted) break;

                    const records: CredentialActivityRecord[] = result?.records || [];

                    for (const record of records) {
                        if (!activityIdSet.has(record.activityId)) {
                            activityIdSet.add(record.activityId);
                            allRecords.push(record);
                        }
                    }

                    setState(prev => ({
                        ...prev,
                        progress: {
                            fetched: allRecords.length,
                            total: Math.max(totalEstimate, allRecords.length),
                        },
                    }));

                    hasMore = result?.hasMore || false;
                    cursor = result?.cursor;

                    if (hasMore) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                if (signal.aborted) {
                    setState({ isExporting: false, progress: null, error: null });
                    return false;
                }

                const chainMap: ActivityChainMap = {};
                const uniqueActivityIds = [...activityIdSet];
                const chainBatchSize = 10;

                for (let i = 0; i < uniqueActivityIds.length; i += chainBatchSize) {
                    if (signal.aborted) break;

                    const batch = uniqueActivityIds.slice(i, i + chainBatchSize);

                    const chainPromises = batch.map(async activityId => {
                        try {
                            const chain = await wallet.invoke.getActivityChain({ activityId });
                            return { activityId, chain: chain || [] };
                        } catch {
                            return { activityId, chain: [] };
                        }
                    });

                    const results = await Promise.all(chainPromises);

                    for (const { activityId, chain } of results) {
                        chainMap[activityId] = chain as CredentialActivityRecord[];
                    }

                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                if (signal.aborted) {
                    setState({ isExporting: false, progress: null, error: null });
                    return false;
                }

                let csvContent = UTF8_BOM;
                csvContent += CSV_HEADERS.map(escapeCSVField).join(',') + '\n';

                for (const record of allRecords) {
                    const chain = chainMap[record.activityId] || [record];
                    const row = buildCsvRow(record, chain);
                    csvContent += rowToCsvLine(row) + '\n';
                }

                const filename = generateFilename(integrationName);

                if (Capacitor.isNativePlatform()) {
                    await downloadCsvNative(csvContent, filename, presentToast);
                } else {
                    await downloadCsvWeb(csvContent, filename);
                }

                setState({ isExporting: false, progress: null, error: null });
                return true;
            } catch (err) {
                if (!signal.aborted) {
                    console.error('[useActivityExport] Export failed:', err);
                    setState({
                        isExporting: false,
                        progress: null,
                        error: err instanceof Error ? err : new Error('Export failed'),
                    });
                }
                return false;
            } finally {
                abortControllerRef.current = null;
            }
        },
        []
    );

    return { exportCsv, cancelExport, state };
}
