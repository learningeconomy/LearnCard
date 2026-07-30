import { useState, useEffect, useCallback } from 'react';
import { trpc } from './trpc';
import { TRPCClientError } from '@trpc/client';
import type { InstallIntent } from '@learncard/types';
import type { InstallIntentAuditEventType } from '@brain-service/types/install-intent-audit';

// console-bff types these procedures as `unknown` (z.any() in + untyped transport out),
// so responses MUST be checked at runtime. A dev stub transport returns `{}` for every
// call, which a blind `as T[]` cast would turn into a render crash.
const expectArray = (value: unknown, what: string): unknown[] => {
    if (!Array.isArray(value)) {
        throw new Error(
            `Expected a list of ${what} but the server returned ${
                value && typeof value === 'object' && Object.keys(value).length === 0
                    ? 'an empty object. Is console-bff running against the stub transport? Set BRAIN_SERVICE_URL to reach a real brain-service.'
                    : typeof value
            }`
        );
    }

    return value;
};

const describeError = (e: unknown): string => {
    if (e instanceof TRPCClientError) {
        if (e.data?.httpStatus === 401) {
            return `Not authorized: ${e.message}. Sign in again, and confirm this profile has a managed key and an OWNER/ADMIN role on the ecosystem.`;
        }

        return e.message;
    }

    return e instanceof Error ? e.message : String(e);
};

export function InstallIntents({ ecosystemIds }: { ecosystemIds: string[] }) {
    const [ecosystemId, setEcosystemId] = useState<string>(ecosystemIds[0] ?? '');
    const [intents, setIntents] = useState<InstallIntent[] | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const loadIntents = useCallback(async () => {
        if (!ecosystemId) return;

        setBusy(true);
        setError(null);
        try {
            const res = await trpc.installIntents.listInstallIntents.query({ ecosystemId });
            setIntents(expectArray(res, 'install intents') as InstallIntent[]);
        } catch (e) {
            setIntents(null);
            setError(describeError(e));
        } finally {
            setBusy(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void loadIntents();
    }, [loadIntents]);

    if (selectedId) {
        return <InstallIntentDetail id={selectedId} onBack={() => setSelectedId(null)} />;
    }

    if (ecosystemIds.length === 0) {
        return (
            <section className="card">
                <h2>Install Intents</h2>
                <p className="muted">
                    This profile has no ecosystem roles, so there are no install intents to
                    administer. An OWNER or ADMIN role on an ecosystem is required.
                </p>
            </section>
        );
    }

    return (
        <section className="card">
            <h2>Install Intents</h2>

            <div className="actions">
                <label htmlFor="ecosystem-select">Ecosystem</label>
                <select
                    id="ecosystem-select"
                    value={ecosystemId}
                    onChange={event => setEcosystemId(event.target.value)}
                    disabled={busy}
                >
                    {ecosystemIds.map(id => (
                        <option key={id} value={id}>
                            {id}
                        </option>
                    ))}
                </select>
                <button onClick={loadIntents} disabled={busy}>
                    Refresh List
                </button>
            </div>

            <CreatePlanForm
                ecosystemId={ecosystemId}
                disabled={busy}
                onPlanned={intentId => setSelectedId(intentId)}
            />

            {error && <p className="error">{error}</p>}

            {busy && !intents && <p className="muted">Loading intents…</p>}
            {!busy && !intents && !error && <p className="muted">No intents loaded.</p>}
            {intents && intents.length === 0 && (
                <p className="muted">No install intents in this ecosystem yet.</p>
            )}
            {intents && intents.length > 0 && (
                <ul>
                    {intents.map(intent => (
                        <li key={intent.intentId}>
                            <button onClick={() => setSelectedId(intent.intentId)} disabled={busy}>
                                {intent.intentId} — {intent.status?.phase ?? 'PENDING_ADOPTION'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function CreatePlanForm({
    ecosystemId,
    disabled,
    onPlanned,
}: {
    ecosystemId: string;
    disabled: boolean;
    onPlanned: (intentId: string) => void;
}) {
    const [listingId, setListingId] = useState('');
    const [versionId, setVersionId] = useState('');
    const [configText, setConfigText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        let requestedConfig: Record<string, unknown> = {};

        if (configText.trim().length > 0) {
            try {
                const parsed: unknown = JSON.parse(configText);

                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('Requested config must be a JSON object.');
                }

                requestedConfig = parsed as Record<string, unknown>;
            } catch (e) {
                setError(`Requested config is not valid JSON: ${describeError(e)}`);

                return;
            }
        }

        setBusy(true);
        try {
            const res = await trpc.installIntents.planInstallIntent.mutate({
                ecosystemId,
                listingId: listingId.trim(),
                versionId: versionId.trim(),
                requestedConfig,
                proposedBindings: [],
            });

            if (!res || typeof res !== 'object' || !('intentId' in res)) {
                throw new Error('Server did not return a planned install intent.');
            }

            onPlanned(String((res as { intentId: unknown }).intentId));
        } catch (e) {
            setError(describeError(e));
        } finally {
            setBusy(false);
        }
    };

    const ready = listingId.trim().length > 0 && versionId.trim().length > 0;

    return (
        <form onSubmit={submit} style={{ marginTop: '16px' }}>
            <h3>Render a new plan</h3>
            <p className="muted">
                Planning does not grant anything. It renders a reviewable plan that must be
                explicitly approved.
            </p>

            <div className="grid form-grid">
                <label htmlFor="plan-listing-id">Listing ID</label>
                <input
                    id="plan-listing-id"
                    value={listingId}
                    onChange={event => setListingId(event.target.value)}
                    disabled={disabled || busy}
                    placeholder="listing_…"
                />

                <label htmlFor="plan-version-id">Version ID</label>
                <input
                    id="plan-version-id"
                    value={versionId}
                    onChange={event => setVersionId(event.target.value)}
                    disabled={disabled || busy}
                    placeholder="version_…"
                />

                <label htmlFor="plan-config">Requested config (optional JSON)</label>
                <input
                    id="plan-config"
                    value={configText}
                    onChange={event => setConfigText(event.target.value)}
                    disabled={disabled || busy}
                    placeholder='{"district":"demo"}'
                />
            </div>

            {error && <p className="error">{error}</p>}

            <div className="actions">
                <button type="submit" disabled={disabled || busy || !ready}>
                    {busy ? 'Rendering plan…' : 'Render Plan'}
                </button>
            </div>
        </form>
    );
}

function InstallIntentDetail({ id, onBack }: { id: string; onBack: () => void }) {
    const [intent, setIntent] = useState<InstallIntent | null>(null);
    const [auditEvents, setAuditEvents] = useState<InstallIntentAuditEventType[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setBusy(true);
        setError(null);
        try {
            const [intentRes, auditRes] = await Promise.all([
                trpc.installIntents.getInstallIntent.query({ intentId: id }),
                trpc.installIntents.getInstallIntentAuditEvents.query({ intentId: id }),
            ]);

            if (!intentRes || typeof intentRes !== 'object' || !('intentId' in intentRes)) {
                throw new Error(
                    'Server did not return an install intent. Is console-bff running against the stub transport? Set BRAIN_SERVICE_URL to reach a real brain-service.'
                );
            }

            setIntent(intentRes as InstallIntent);
            setAuditEvents(expectArray(auditRes, 'audit events') as InstallIntentAuditEventType[]);
        } catch (e) {
            setError(describeError(e));
        } finally {
            setBusy(false);
        }
    }, [id]);

    useEffect(() => {
        void load();
    }, [load]);

    const runAction = async (action: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            await load();
        } catch (e) {
            if (e instanceof TRPCClientError && e.data?.code === 'CONFLICT') {
                setError(
                    'Conflict detected: The plan or status has changed. Please refresh the plan and re-review before trying again.'
                );
            } else if (
                e instanceof Error &&
                (e.message.toLowerCase().includes('stale') ||
                    e.message.toLowerCase().includes('conflict'))
            ) {
                setError(
                    'Conflict detected: The plan or status has changed. Please refresh the plan and re-review before trying again.'
                );
            } else {
                setError(e instanceof Error ? e.message : String(e));
            }
        } finally {
            setBusy(false);
        }
    };

    const handleApprove = () => {
        if (!intent?.plan) return;
        if (
            !window.confirm(
                'Are you sure you want to approve this install intent? This grants authority.'
            )
        )
            return;
        void runAction(async () => {
            await trpc.installIntents.approveInstallIntent.mutate({
                intentId: id,
                planHash: intent.plan!.planHash,
                planRevision: intent.plan!.planRevision,
            });
        });
    };

    const handleReject = () => {
        const reason = window.prompt('Reason for rejecting this install intent (required):');

        if (reason === null) return;

        if (reason.trim().length === 0) {
            setError('A rejection reason is required.');

            return;
        }

        void runAction(async () => {
            await trpc.installIntents.rejectInstallIntent.mutate({
                intentId: id,
                reason: reason.trim(),
            });
        });
    };

    const handleApply = () => {
        if (!intent?.status) return;
        void runAction(async () => {
            await trpc.installIntents.applyInstallIntent.mutate({
                intentId: id,
                expectedStatusRevision: intent.status!.statusRevision,
            });
        });
    };

    const handleRevoke = () => {
        if (!intent?.status) return;
        if (
            !window.confirm(
                'Are you sure you want to revoke this install intent? This withdraws authority.'
            )
        )
            return;
        void runAction(async () => {
            await trpc.installIntents.revokeInstallIntent.mutate({
                intentId: id,
                expectedStatusRevision: intent.status!.statusRevision,
            });
        });
    };

    const handlePlan = () => {
        if (!intent) return;

        // Re-planning replaces the rendered plan, so the existing proposal inputs are
        // passed through verbatim; omitting them would silently re-plan against defaults.
        void runAction(async () => {
            await trpc.installIntents.planInstallIntent.mutate({
                intentId: id,
                ecosystemId: intent.ecosystemId,
                listingId: intent.proposal.source.listingId,
                versionId: intent.proposal.source.versionId,
                requestedConfig: intent.proposal.requestedConfig,
                proposedBindings: intent.proposal.proposedBindings,
            });
        });
    };

    if (!intent) {
        return (
            <section className="card">
                <h2>Install Intent: {id}</h2>
                {error && <p className="error">{error}</p>}
                <p className="muted">Loading...</p>
                <button onClick={onBack}>Back</button>
            </section>
        );
    }

    const phase = intent.status?.phase ?? 'UNKNOWN';
    const isPlanned = phase === 'PLANNED';
    const isApproved = intent.approval.state === 'APPROVED';
    const isReady = phase === 'READY';
    const isDegraded = phase === 'DEGRADED';
    const isSuspended = phase === 'SUSPENDED';
    const isFailed = phase === 'FAILED';
    const isRemoving = phase === 'REMOVING';
    const isRemoved = phase === 'REMOVED';

    const dotClass =
        isReady || isPlanned || isApproved
            ? 'on'
            : isDegraded || isSuspended || isFailed
            ? 'error'
            : 'off';

    function PlanReviewPanel({ intent }: { intent: InstallIntent }) {
        if (!intent.plan) return null;

        const accountablePrincipal =
            intent.approval.state === 'APPROVED'
                ? intent.approval.artifact.approvedBy
                : 'Unavailable';

        return (
            <div style={{ marginTop: '24px' }}>
                <h3>Plan Review</h3>
                <dl className="grid">
                    <dt>Plan Hash</dt>
                    <dd className="mono">{intent.plan.planHash}</dd>
                    <dt>Plan Revision</dt>
                    <dd className="mono">{intent.plan.planRevision}</dd>
                    <dt>Accountable Principal</dt>
                    <dd>{accountablePrincipal}</dd>
                    <dt>Timestamp</dt>
                    <dd>
                        {intent.plan.renderedAt
                            ? new Date(intent.plan.renderedAt).toLocaleString()
                            : 'Unavailable'}
                    </dd>
                </dl>

                <h4>Authority Changes</h4>
                {intent.plan.authorityChanges ? (
                    <pre>{JSON.stringify(intent.plan.authorityChanges, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}

                <h4>Consent Tiers</h4>
                {intent.plan.consentTiers ? (
                    <pre>{JSON.stringify(intent.plan.consentTiers, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}

                <h4>Proposed Bindings</h4>
                {intent.proposal.proposedBindings ? (
                    <pre>{JSON.stringify(intent.proposal.proposedBindings, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}

                <h4>Infrastructure Effects</h4>
                {intent.plan.infrastructureEffects ? (
                    <pre>{JSON.stringify(intent.plan.infrastructureEffects, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}

                <h4>Disposition Policy</h4>
                {intent.plan.dispositionPolicy ? (
                    <pre>{JSON.stringify(intent.plan.dispositionPolicy, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}

                <h4>Expanded Install Targets</h4>
                {intent.spec?.targets ? (
                    <pre>{JSON.stringify(intent.spec.targets, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}

                <h4>Pinned Version IDs</h4>
                {intent.spec?.pinnedVersionIds ? (
                    <pre>{JSON.stringify(intent.spec.pinnedVersionIds, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}

                <h4>Entitlement Requirements</h4>
                {intent.spec?.entitlementRequirements ? (
                    <pre>{JSON.stringify(intent.spec.entitlementRequirements, null, 2)}</pre>
                ) : (
                    <p className="muted">Unavailable</p>
                )}
            </div>
        );
    }

    function AuditTrailPanel({
        auditEvents,
    }: {
        auditEvents: InstallIntentAuditEventType[] | null;
    }) {
        return (
            <div style={{ marginTop: '24px' }}>
                <h3>Audit Trail</h3>
                {auditEvents ? (
                    <ul>
                        {auditEvents.map((event, i) => (
                            <li key={i}>
                                <strong>{event.action}</strong> at{' '}
                                {new Date(event.timestamp).toLocaleString()} by{' '}
                                {event.actorProfileId || event.actorDid || 'Unknown'}
                                <pre>
                                    {JSON.stringify(
                                        {
                                            before: event.beforeSummary,
                                            after: event.afterSummary,
                                            authority: event.authorityChangesSummary,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="muted">Loading audit events...</p>
                )}
            </div>
        );
    }

    return (
        <section className="card">
            <div className="header">
                <h2>Install Intent: {id}</h2>
                <span className="tag">{intent.ecosystemId}</span>
            </div>

            <div className="status" style={{ marginBottom: '16px' }}>
                <span className={`dot ${dotClass}`} />
                Phase: {phase} (Revision: {intent.status?.statusRevision ?? 'N/A'})
            </div>

            {error && <p className="error">{error}</p>}

            <div className="actions">
                <button onClick={onBack} disabled={busy}>
                    Back
                </button>
                <button onClick={load} disabled={busy}>
                    Refresh
                </button>
                <button onClick={handlePlan} disabled={busy}>
                    Plan
                </button>
                <button onClick={handleApprove} disabled={busy || !isPlanned || isApproved}>
                    Approve
                </button>
                <button onClick={handleReject} disabled={busy || !isPlanned || isApproved}>
                    Reject
                </button>
                <button onClick={handleApply} disabled={busy || !isApproved || !isPlanned}>
                    Apply
                </button>
                <button onClick={handleRevoke} disabled={busy || isRemoved || isRemoving}>
                    Revoke
                </button>
            </div>

            <PlanReviewPanel intent={intent} />
            <AuditTrailPanel auditEvents={auditEvents} />
        </section>
    );
}
