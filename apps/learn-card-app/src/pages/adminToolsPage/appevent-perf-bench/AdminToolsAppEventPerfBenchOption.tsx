import React, { useState } from 'react';
import type { FC } from 'react';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

import { useAnalytics, AnalyticsEvents } from '@analytics';
import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';
import type { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';

type RunStatus = 'idle' | 'running' | 'done' | 'error';

const inputClass =
    'w-full border border-grayscale-200 rounded-[12px] px-[12px] py-[10px] text-[14px] text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-notoSans';
const labelClass = 'text-[13px] font-[600] text-grayscale-700 mb-[4px] block font-notoSans';

type BenchSummary = {
    iteration_count: number;
    errors: number;
    total: { p50: number; p95: number; p99: number };
    sa_issue: { p50: number; p95: number; p99: number };
    sa_http: { p50: number; p95: number; p99: number };
    parallel_reads: { p50: number; p95: number; p99: number };
    owner_and_sa_reads: { p50: number; p95: number; p99: number };
    log_activity_and_send_boost: { p50: number; p95: number; p99: number };
};

type BenchResult = {
    runId: string;
    perIteration: Array<Record<string, unknown>>;
    summary: BenchSummary;
    posthogDashboardUrl?: string;
};

const AdminToolsAppEventPerfBenchOption: FC<{ option: AdminToolOption }> = ({ option }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { track } = useAnalytics();

    const [listingId, setListingId] = useState('');
    const [recipientProfileId, setRecipientProfileId] = useState('');
    const [templateAlias, setTemplateAlias] = useState('');
    const [iterations, setIterations] = useState(10);
    const [warmup, setWarmup] = useState(2);
    const [runLabel, setRunLabel] = useState('');

    const [status, setStatus] = useState<RunStatus>('idle');
    const [result, setResult] = useState<BenchResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRun = async () => {
        if (!listingId.trim() || !recipientProfileId.trim() || !templateAlias.trim()) {
            presentToast('Fill in listing ID, recipient profile ID, and template alias', {
                type: ToastTypeEnum.Error,
            });
            return;
        }
        const label = runLabel.trim() || `bench-${new Date().toISOString()}`;
        setStatus('running');
        setResult(null);
        setErrorMessage(null);

        try {
            const wallet = await initWallet();
            const triggeredRunId = crypto.randomUUID();
            await track(AnalyticsEvents.BENCH_APPEVENT_RUN_TRIGGERED, {
                run_id: triggeredRunId,
                iterations,
                warmup,
                listing_id: listingId.trim(),
                recipient_profile_id: recipientProfileId.trim(),
                run_label: label,
            });

            const res = await wallet.invoke.benchAppEvent?.({
                listingId: listingId.trim(),
                recipientProfileId: recipientProfileId.trim(),
                templateAlias: templateAlias.trim(),
                iterations,
                warmup,
                runLabel: label,
            });
            if (!res) throw new Error('benchAppEvent not available on this wallet');
            setResult(res as BenchResult);
            setStatus('done');
            presentToast('Bench complete', { type: ToastTypeEnum.Success });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setErrorMessage(msg);
            setStatus('error');
        }
    };

    const handleCleanup = async () => {
        if (!recipientProfileId.trim()) {
            presentToast('Recipient profile ID required for cleanup', { type: ToastTypeEnum.Error });
            return;
        }
        if (!window.confirm(`Delete ALL credentials/notifications/activity for ${recipientProfileId.trim()}?`)) {
            return;
        }
        try {
            const wallet = await initWallet();
            const res = await wallet.invoke.cleanupBenchAppEventData?.({
                recipientProfileId: recipientProfileId.trim(),
            });
            if (!res) throw new Error('cleanupBenchAppEventData not available');
            presentToast(
                `Deleted ${res.credentialsDeleted} credentials, ${res.notificationsDeleted} notifications, ${res.activityEntriesDeleted} activity entries`,
                { type: ToastTypeEnum.Success }
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            presentToast(msg, { type: ToastTypeEnum.Error });
        }
    };

    const handleCopyResults = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        presentToast('Results copied to clipboard', { type: ToastTypeEnum.Success });
    };

    const renderPercentileRow = (label: string, p: { p50: number; p95: number; p99: number }) => (
        <tr key={label} className="border-b border-grayscale-100 last:border-0">
            <td className="py-[6px] pr-[12px] font-[600] text-[13px] text-grayscale-700 font-notoSans">{label}</td>
            <td className="py-[6px] pr-[12px] text-[13px] font-mono text-grayscale-900">{p.p50}</td>
            <td className="py-[6px] pr-[12px] text-[13px] font-mono text-grayscale-900">{p.p95}</td>
            <td className="py-[6px] text-[13px] font-mono text-grayscale-900">{p.p99}</td>
        </tr>
    );

    return (
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px] overflow-hidden shadow-box-bottom">
                <AdminToolsOptionItemHeader option={option} />

                <div className="p-[20px] flex flex-col gap-[16px]">
                    <div>
                        <label className={labelClass}>Listing ID</label>
                        <input className={inputClass} value={listingId} onChange={e => setListingId(e.target.value)} />
                    </div>

                    <div>
                        <label className={labelClass}>Recipient Profile ID</label>
                        <input
                            className={inputClass}
                            placeholder="bench-perf-staging"
                            value={recipientProfileId}
                            onChange={e => setRecipientProfileId(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Template Alias</label>
                        <input className={inputClass} value={templateAlias} onChange={e => setTemplateAlias(e.target.value)} />
                    </div>

                    <div className="flex gap-[12px]">
                        <div className="flex-1">
                            <label className={labelClass}>Iterations (1-100)</label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                className={inputClass}
                                value={iterations}
                                onChange={e => setIterations(Math.max(1, Math.min(100, Number(e.target.value))))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className={labelClass}>Warmup (0-10)</label>
                            <input
                                type="number"
                                min={0}
                                max={10}
                                className={inputClass}
                                value={warmup}
                                onChange={e => setWarmup(Math.max(0, Math.min(10, Number(e.target.value))))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Run Label (optional)</label>
                        <input
                            className={inputClass}
                            placeholder={`bench-<auto-timestamp>`}
                            value={runLabel}
                            onChange={e => setRunLabel(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-[12px] mt-[8px]">
                        <button
                            onClick={handleRun}
                            disabled={status === 'running'}
                            className="rounded-full bg-emerald-700 text-white px-[18px] py-[12px] text-[15px] font-[600] font-notoSans disabled:opacity-50 flex items-center justify-center gap-[8px]"
                        >
                            {status === 'running' && (
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            )}
                            {status === 'running' ? 'Running…' : 'Run Bench'}
                        </button>
                        <button
                            onClick={handleCleanup}
                            disabled={status === 'running'}
                            className="rounded-full border border-red-300 text-red-700 px-[18px] py-[12px] text-[15px] font-[600] font-notoSans disabled:opacity-50"
                        >
                            Cleanup Bench Data
                        </button>
                        {status === 'done' && result && (
                            <button
                                onClick={handleCopyResults}
                                className="rounded-full border border-grayscale-300 text-grayscale-800 px-[18px] py-[12px] text-[15px] font-[600] font-notoSans"
                            >
                                Copy Results JSON
                            </button>
                        )}
                    </div>

                    {status === 'error' && errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px]">
                            <p className="text-[13px] text-red-700 font-mono break-all">{errorMessage}</p>
                        </div>
                    )}

                    {status === 'done' && result && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-[16px] flex flex-col gap-[12px]">
                            <p className="text-[14px] font-[600] text-emerald-800 font-notoSans">
                                Run {result.runId} — {result.summary.iteration_count} iterations, {result.summary.errors} errors
                            </p>
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans pr-[12px]">Phase</th>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans pr-[12px]">p50</th>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans pr-[12px]">p95</th>
                                        <th className="text-[12px] font-[600] text-grayscale-500 font-notoSans">p99</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderPercentileRow('total', result.summary.total)}
                                    {renderPercentileRow('sa_issue', result.summary.sa_issue)}
                                    {renderPercentileRow('sa_http', result.summary.sa_http)}
                                    {renderPercentileRow('parallel_reads', result.summary.parallel_reads)}
                                    {renderPercentileRow('owner_and_sa_reads', result.summary.owner_and_sa_reads)}
                                    {renderPercentileRow(
                                        'log_activity_and_send_boost',
                                        result.summary.log_activity_and_send_boost
                                    )}
                                </tbody>
                            </table>
                            {result.posthogDashboardUrl && (
                                <a
                                    href={result.posthogDashboardUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12px] text-emerald-700 underline self-start"
                                >
                                    View in PostHog →
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </section>
    );
};

export default AdminToolsAppEventPerfBenchOption;
