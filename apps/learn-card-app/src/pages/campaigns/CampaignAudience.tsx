import { IonIcon } from '@ionic/react';
import { cloudUploadOutline, ribbonOutline } from 'ionicons/icons';
import React, { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { CampaignAudienceSource } from '@learncard/types';
import type { CampaignApi } from './types';
import { audienceChunks, parseAudienceCsv, parseAudienceSource } from './model';
import { useCampaignAction } from './useCampaignAction';
import { Busy, Field, Notice, buttonClass, inputClass, panelClass, SectionHeading } from './ui';

export const CampaignAudience: React.FC<{
    api: CampaignApi;
    id: string;
    disabled: boolean;
    onBusy: (busy: boolean) => void;
}> = ({ api, id, disabled, onBusy }) => {
    const [csv, setCsv] = useState<ReturnType<typeof parseAudienceCsv>>();
    const [boostUri, setBoostUri] = useState('');
    const [sourceJson, setSourceJson] = useState('');
    const advanced = sourceJson ? parseAudienceSource(sourceJson) : undefined;
    const [includePending, setIncludePending] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0, matches: 0 });
    const [cancelling, setCancelling] = useState(false);
    const cancel = useRef(false);
    const fileVersion = useRef(0);
    const action = useCampaignAction();
    const queries = useQueryClient();
    const [showMembers, setShowMembers] = useState(false);
    const members = useInfiniteQuery({
        queryKey: ['campaign-audience', id],
        enabled: showMembers,
        initialPageParam: undefined as string | undefined,
        queryFn: ({ pageParam }) =>
            api.campaignsPageAudience({ campaignId: id, cursor: pageParam, limit: 50 }),
        getNextPageParam: last => (last.hasMore ? last.cursor : undefined),
        retry: false,
    });
    useEffect(() => {
        onBusy(Boolean(action.busy));
    }, [action.busy, onBusy]);
    useEffect(
        () => () => {
            cancel.current = true;
            fileVersion.current++;
        },
        []
    );
    const runSources = (sources: CampaignAudienceSource[], preview: boolean) =>
        void action.run(preview ? 'Checking audience...' : 'Adding audience...', async () => {
            cancel.current = false;
            setCancelling(false);
            let matches = 0;
            setProgress({ done: 0, total: sources.length, matches });
            try {
                for (let i = 0; i < sources.length && !cancel.current; i++) {
                    const result = await (
                        preview ? api.campaignsPreviewAudience : api.campaignsAddAudience
                    )({ campaignId: id, source: sources[i] });
                    matches += result.count;
                    setProgress({ done: i + 1, total: sources.length, matches });
                }
                action.setSuccess(
                    `${cancel.current ? 'Stopped after the current request. ' : ''}${matches.toLocaleString()} eligible matches processed${preview ? ' in preview; no members added' : '; existing members may be included'}.`
                );
            } finally {
                if (!preview) {
                    void queries.invalidateQueries({ queryKey: ['campaign-stats', id] });
                    void queries.invalidateQueries({ queryKey: ['campaign-audience', id] });
                }
            }
        });
    const locked = disabled || Boolean(action.busy);
    const csvSources = (): CampaignAudienceSource[] =>
        audienceChunks(csv?.dids ?? []).map(dids => ({ type: 'dids', dids }));
    const boostSource = (): CampaignAudienceSource[] => [
        { type: 'boostRecipients', boostUri: boostUri.trim(), includePending },
    ];
    return (
        <section className={panelClass}>
            <SectionHeading
                title="Audience"
                description="Add people from a file, a boost, or an existing audience source."
            />
            {disabled && (
                <p className="rounded-xl bg-grayscale-100 p-3 text-xs text-grayscale-600">
                    Save your changes before managing the audience. Archived campaigns cannot be
                    edited.
                </p>
            )}
            <fieldset disabled={locked} className="grid min-w-0 gap-5 md:grid-cols-2">
                <div className="min-w-0 space-y-4 rounded-2xl border border-grayscale-200 p-5">
                    <div className="flex items-center gap-3">
                        <IonIcon
                            icon={cloudUploadOutline}
                            className="text-xl text-emerald-700"
                            aria-hidden="true"
                        />
                        <h3 className="text-sm font-semibold">Import a CSV</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-grayscale-600">
                        One did column or a single column. Duplicate rows are removed.
                    </p>
                    <Field
                        label="Audience CSV (did column or single column)"
                        htmlFor="audience-csv"
                    >
                        <input
                            id="audience-csv"
                            type="file"
                            accept=".csv,text/csv"
                            className={`${inputClass} !p-3 text-xs file:mr-3 file:rounded-[20px] file:border-0 file:bg-grayscale-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-grayscale-700`}
                            onChange={event => {
                                const file = event.target.files?.[0];
                                const version = ++fileVersion.current;
                                setCsv(undefined);
                                if (!file) return;
                                void action.run('Reading CSV...', async () => {
                                    if (file.size > 10 * 1024 * 1024) {
                                        setCsv({
                                            dids: [],
                                            duplicates: 0,
                                            errors: ['Choose a CSV smaller than 10 MB.'],
                                        });
                                        return;
                                    }
                                    const text = await file.text();
                                    if (version === fileVersion.current)
                                        setCsv(parseAudienceCsv(text));
                                });
                            }}
                        />
                    </Field>
                    {csv && (
                        <>
                            <p>
                                {csv.dids.length.toLocaleString()} unique identifiers;{' '}
                                {csv.duplicates.toLocaleString()} duplicate rows removed.
                            </p>
                            {csv.errors.length > 0 && (
                                <Notice error>
                                    <ul>
                                        {csv.errors.slice(0, 20).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                    {csv.errors.length > 20 && (
                                        <p>
                                            {csv.errors.length - 20} more errors. Fix the CSV before
                                            continuing.
                                        </p>
                                    )}
                                </Notice>
                            )}
                        </>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className={buttonClass}
                            disabled={!csv?.dids.length || Boolean(csv.errors.length)}
                            onClick={() => runSources(csvSources(), true)}
                        >
                            Preview CSV audience
                        </button>
                        <button
                            type="button"
                            className={buttonClass}
                            disabled={!csv?.dids.length || Boolean(csv.errors.length)}
                            onClick={() => runSources(csvSources(), false)}
                        >
                            Add CSV audience
                        </button>
                    </div>
                </div>
                <div className="min-w-0 space-y-4 rounded-2xl border border-grayscale-200 p-5">
                    <div className="flex items-center gap-3">
                        <IonIcon
                            icon={ribbonOutline}
                            className="text-xl text-emerald-700"
                            aria-hidden="true"
                        />
                        <h3 className="text-sm font-semibold">Boost recipients</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-grayscale-600">
                        Use an existing boost to find people for this campaign.
                    </p>
                    <Field label="Boost URI" htmlFor="boost-uri">
                        <input
                            id="boost-uri"
                            className={inputClass}
                            value={boostUri}
                            onChange={e => setBoostUri(e.target.value)}
                        />
                    </Field>
                    <label className="flex gap-2 items-center text-sm">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-emerald-600"
                            checked={includePending}
                            onChange={e => setIncludePending(e.target.checked)}
                        />
                        Include pending boost recipients
                    </label>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className={buttonClass}
                            disabled={!boostUri.trim()}
                            onClick={() => runSources(boostSource(), true)}
                        >
                            Preview boost audience
                        </button>
                        <button
                            type="button"
                            className={buttonClass}
                            disabled={!boostUri.trim()}
                            onClick={() => runSources(boostSource(), false)}
                        >
                            Add boost audience
                        </button>
                    </div>
                </div>
                <details className="space-y-3 rounded-2xl border border-grayscale-200 p-5 md:col-span-2">
                    <summary className="cursor-pointer text-sm font-medium">
                        Advanced audience source
                    </summary>
                    <p className="text-xs text-grayscale-600">
                        Use the existing source JSON contract for email matches, credentials sent by
                        an account or listing, or inbox claims. Email matching selects existing
                        accounts; it does not enable email delivery.
                    </p>
                    <Field label="Audience source JSON" htmlFor="audience-source-json">
                        <textarea
                            id="audience-source-json"
                            className={`${inputClass} font-[family-name:ui-monospace,SFMono-Regular,Menlo,monospace]`}
                            rows={6}
                            value={sourceJson}
                            onChange={e => setSourceJson(e.target.value)}
                            placeholder={'{"type":"emails","emails":["learner@example.com"]}'}
                        />
                    </Field>
                    {advanced && advanced.errors.length > 0 && (
                        <Notice error>
                            <ul>
                                {advanced.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </Notice>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            className={buttonClass}
                            disabled={!advanced?.data}
                            onClick={() => {
                                if (advanced?.data) runSources([advanced.data], true);
                            }}
                        >
                            Preview advanced audience
                        </button>
                        <button
                            type="button"
                            className={buttonClass}
                            disabled={!advanced?.data}
                            onClick={() => {
                                if (advanced?.data) runSources([advanced.data], false);
                            }}
                        >
                            Add advanced audience
                        </button>
                    </div>
                </details>
            </fieldset>
            {action.busy && (
                <div role="status" className="space-y-3 rounded-2xl bg-grayscale-100 p-4 text-sm">
                    {progress.total > 0 && (
                        <progress
                            aria-label="Audience batch progress"
                            className="h-2 w-full accent-emerald-600"
                            value={progress.done}
                            max={progress.total}
                        />
                    )}
                    <Busy>{action.busy}</Busy>
                    {progress.total > 0 && (
                        <p>
                            {progress.done} of {progress.total} batches completed ·{' '}
                            {progress.matches.toLocaleString()} eligible matches
                        </p>
                    )}
                    <button
                        type="button"
                        className={buttonClass}
                        disabled={cancelling}
                        onClick={() => {
                            cancel.current = true;
                            fileVersion.current++;
                            setCancelling(true);
                        }}
                    >
                        {cancelling
                            ? 'Stopping after this request...'
                            : 'Stop after current request'}
                    </button>
                    <p className="text-xs">
                        Completed additions remain saved. Retrying is safe but may include existing
                        members.
                    </p>
                </div>
            )}
            {action.error && <Notice error>{action.error}</Notice>}
            {action.success && <Notice>{action.success}</Notice>}
            <p className="py-4 text-xs leading-relaxed text-grayscale-600">
                Counts include eligible existing members. They do not represent newly added people
                or an exact send count.
            </p>
            <button
                type="button"
                className={buttonClass}
                disabled={members.isFetching}
                onClick={() => {
                    if (showMembers) void members.refetch();
                    else setShowMembers(true);
                }}
            >
                {members.isFetching ? (
                    <Busy>Loading members...</Busy>
                ) : showMembers ? (
                    'Refresh stored members'
                ) : (
                    'View stored members'
                )}
            </button>
            {showMembers && members.isError && (
                <Notice error>Members could not be loaded. Try refreshing.</Notice>
            )}
            {showMembers && members.data && (
                <>
                    <p className="text-xs">Stored membership, not an eligible send list.</p>
                    <ul className="divide-y divide-grayscale-200 rounded-2xl border border-grayscale-200 text-sm break-all">
                        {members.data.pages
                            .flatMap(page => page.records)
                            .map(member => (
                                <li key={member.profileId} className="px-4 py-3">
                                    {member.profileId} — {member.did}
                                </li>
                            ))}
                    </ul>
                    {members.data.pages[0].records.length === 0 && <p>No stored members.</p>}
                    {members.hasNextPage && (
                        <button
                            type="button"
                            className={buttonClass}
                            disabled={members.isFetching}
                            onClick={() => void members.fetchNextPage()}
                        >
                            {members.isFetchingNextPage ? (
                                <Busy>Loading more members...</Busy>
                            ) : (
                                'Load more members'
                            )}
                        </button>
                    )}
                </>
            )}
        </section>
    );
};
