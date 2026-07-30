import { useState, useEffect, useCallback } from 'react';
import { trpc } from './trpc';
import { TRPCClientError } from '@trpc/client';
import type { InstallIntent } from '@learncard/types';
import type { InstallIntentAuditEventType } from '@brain-service/types/install-intent-audit';

export function InstallIntents() {
    const [intents, setIntents] = useState<InstallIntent[] | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const loadIntents = useCallback(async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await trpc.installIntents.listInstallIntents.query({});
            setIntents(res as InstallIntent[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        void loadIntents();
    }, [loadIntents]);

    if (selectedId) {
        return <InstallIntentDetail id={selectedId} onBack={() => setSelectedId(null)} />;
    }

    return (
        <section className="card">
            <h2>Install Intents</h2>
            {error && <p className="error">{error}</p>}
            <div className="actions">
                <button onClick={loadIntents} disabled={busy}>
                    Refresh List
                </button>
            </div>
            {intents ? (
                <ul>
                    {intents.map(intent => (
                        <li key={intent.intentId}>
                            <button onClick={() => setSelectedId(intent.intentId)} disabled={busy}>
                                {intent.intentId} - {intent.status?.phase ?? 'UNKNOWN'}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="muted">Loading intents...</p>
            )}
        </section>
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
            setIntent(intentRes as InstallIntent);
            setAuditEvents(auditRes as InstallIntentAuditEventType[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
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
        if (!intent?.plan) return;
        if (!window.confirm('Are you sure you want to reject this install intent?')) return;
        void runAction(async () => {
            await trpc.installIntents.rejectInstallIntent.mutate({
                intentId: id,
                planHash: intent.plan!.planHash,
                planRevision: intent.plan!.planRevision,
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
        void runAction(async () => {
            await trpc.installIntents.planInstallIntent.mutate({ intentId: id });
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
