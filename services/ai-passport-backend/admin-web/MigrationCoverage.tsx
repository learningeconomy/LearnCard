export type Coverage = {
    observedAt: string;
    complete: boolean;
    totalRecords: number | null;
    observedRecords: number;
    inventoryLimit: number;
    inventoryBatchSize?: number;
    scannedThisPass?: number;
    pendingChanges?: number;
    snapshotAt?: string | null;
    scanning?: boolean;
    novaReady: number;
    openaiOnly: number;
    unresolved: number;
    rollbackCopies: number;
};
export default function MigrationCoverage({
    coverage,
    error,
    updatedAt,
}: {
    coverage: Coverage | null;
    error: string;
    updatedAt: number | null;
}) {
    const total = coverage?.observedRecords ?? 0;
    const exact = coverage?.complete && coverage.totalRecords !== null;
    const stale = Boolean(error || (updatedAt && Date.now() - updatedAt > 45000));
    const slices = [
        {
            label: 'Nova copies complete',
            value: coverage?.novaReady ?? 0,
            color: '#0f766e',
            detail: 'All five current Nova views',
        },
        {
            label: 'OpenAI copies only',
            value: coverage?.openaiOnly ?? 0,
            color: '#6d28d9',
            detail: 'Five current OpenAI views; no current Nova views',
        },
        {
            label: 'Partial / missing / changed',
            value: coverage?.unresolved ?? 0,
            color: '#a16207',
            detail: 'Incomplete, unversioned or changing sources',
        },
    ];
    let consumed = 0;
    return (
        <section
            aria-labelledby="coverage-heading"
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
        >
            <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                        Backfill coverage
                    </p>
                    <h2 id="coverage-heading" className="mt-2 text-2xl font-bold text-slate-950">
                        Credentials prepared for cutover
                    </h2>
                </div>
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${stale ? 'bg-amber-100 text-amber-900' : 'bg-teal-50 text-teal-800'}`}
                >
                    {!coverage
                        ? error
                            ? 'Unavailable'
                            : 'Loading inventory'
                        : stale
                          ? 'Update delayed'
                          : 'Updates every 15 seconds'}
                </span>
            </div>
            <div className="mt-7 grid items-center gap-8 sm:grid-cols-[220px_1fr]">
                <div className="relative mx-auto h-52 w-52">
                    <svg
                        viewBox="0 0 120 120"
                        role="img"
                        aria-labelledby="coverage-chart-title coverage-chart-description"
                        className="h-full w-full -rotate-90"
                    >
                        <title id="coverage-chart-title">Credential backfill coverage</title>
                        <desc id="coverage-chart-description">
                            {coverage
                                ? `${exact ? 'Complete inventory' : 'Incomplete observation'}: ${total} observed credentials; ${coverage.novaReady} with complete Nova copies, ${coverage.openaiOnly} with only OpenAI copies, ${coverage.unresolved} partial, missing or changed. ${total === 0 ? 'No percentage available.' : ''}`
                                : 'Inventory is not available yet. No percentage available.'}
                        </desc>
                        <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="13"
                        />
                        {total > 0 &&
                            slices.map(slice => {
                                const length = (slice.value / total) * 100,
                                    offset = consumed;
                                consumed += length;
                                return (
                                    <circle
                                        key={slice.label}
                                        cx="60"
                                        cy="60"
                                        r="48"
                                        fill="none"
                                        stroke={slice.color}
                                        strokeWidth="13"
                                        pathLength="100"
                                        strokeDasharray={`${length} ${100 - length}`}
                                        strokeDashoffset={-offset}
                                    />
                                );
                            })}
                    </svg>
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                    >
                        <strong className="text-4xl font-bold tracking-tight text-slate-950">
                            {coverage && total > 0 && exact
                                ? `${coverage.novaReady === total ? 100 : Math.floor((coverage.novaReady / total) * 1000) / 10}%`
                                : '—'}
                        </strong>
                        <span className="mt-1 text-sm font-medium text-slate-500">
                            {exact && total > 0
                                ? 'Nova copies complete'
                                : 'Inventory not confirmed'}
                        </span>
                    </div>
                </div>
                <div>
                    <ul className="space-y-4">
                        {slices.map(slice => (
                            <li key={slice.label} className="flex items-start gap-3">
                                <span
                                    aria-hidden="true"
                                    className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${slice.color === '#0f766e' ? 'bg-teal-700' : slice.color === '#6d28d9' ? 'bg-violet-700' : 'bg-amber-700'}`}
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between gap-3">
                                        <span className="font-semibold text-slate-800">
                                            {slice.label}
                                        </span>
                                        <strong className="tabular-nums text-slate-950">
                                            {coverage ? slice.value.toLocaleString() : '—'}
                                        </strong>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {slice.detail}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                <p>
                    {coverage
                        ? exact
                            ? `${total.toLocaleString()} persisted credential records in this observation.`
                            : `Full inventory scan in progress: ${total.toLocaleString()} credential records observed; total not confirmed. Batches of ${coverage.inventoryBatchSize ?? coverage.inventoryLimit} records; source changes are reconciled.`
                        : 'Counting persisted credential records…'}{' '}
                    Messages are excluded.
                </p>
                <p className="mt-1">
                    A credential with both complete generations counts once under complete Nova
                    copies. {coverage?.rollbackCopies ?? '—'} Nova-ready records also retain
                    complete OpenAI rollback copies. This checks persisted source versions, not live
                    remote consent.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                    {coverage
                        ? `Observed ${new Date(coverage.observedAt).toLocaleTimeString()}.`
                        : 'Awaiting first observation.'}{' '}
                    {error && (
                        <span className="font-medium text-amber-800">
                            {error} Previous observation may be stale.
                        </span>
                    )}
                </p>
            </div>
        </section>
    );
}
