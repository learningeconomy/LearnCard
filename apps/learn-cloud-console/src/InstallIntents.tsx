import { useState, useEffect, useCallback } from 'react';
import { trpc } from './trpc';
import { TRPCClientError } from '@trpc/client';
import type { InstallIntent } from '@learncard/types';
import type { InstallIntentAuditEventType } from '@brain-service/types/install-intent-audit';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Play,
    Trash2,
    FileText,
    ShieldAlert,
    Database,
    Link as LinkIcon,
    Server,
    Clock,
} from 'lucide-react';

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

function StatusBadge({ phase }: { phase: string }) {
    switch (phase) {
        case 'PLANNED':
            return (
                <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-200">
                    Planned
                </Badge>
            );
        case 'APPLYING':
            return (
                <Badge
                    variant="default"
                    className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                >
                    Applying
                </Badge>
            );
        case 'READY':
            return (
                <Badge
                    variant="success"
                    className="bg-emerald-100 text-emerald-800 border-emerald-200"
                >
                    Ready
                </Badge>
            );
        case 'DEGRADED':
            return (
                <Badge
                    variant="destructive"
                    className="bg-orange-100 text-orange-800 border-orange-200"
                >
                    Degraded
                </Badge>
            );
        case 'FAILED':
            return <Badge variant="destructive">Failed</Badge>;
        case 'REMOVING':
            return (
                <Badge variant="outline" className="text-muted-foreground">
                    Removing
                </Badge>
            );
        case 'REMOVED':
            return (
                <Badge variant="outline" className="text-muted-foreground">
                    Removed
                </Badge>
            );
        default:
            return <Badge variant="secondary">{phase}</Badge>;
    }
}

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
            <Card>
                <CardHeader>
                    <CardTitle>Install Intents</CardTitle>
                    <CardDescription>
                        This profile has no ecosystem roles, so there are no install intents to
                        administer. An OWNER or ADMIN role on an ecosystem is required.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold tracking-tight">
                        Install Intents
                    </h2>
                    <p className="text-muted-foreground">
                        Manage app installations and integrations
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-sm">
                    <label
                        htmlFor="ecosystem-select"
                        className="text-sm font-medium text-muted-foreground px-2"
                    >
                        Ecosystem
                    </label>
                    <select
                        id="ecosystem-select"
                        value={ecosystemId}
                        onChange={event => setEcosystemId(event.target.value)}
                        disabled={busy}
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {ecosystemIds.map(id => (
                            <option key={id} value={id}>
                                {id}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadIntents}
                        disabled={busy}
                        title="Refresh List"
                    >
                        <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                    <CreatePlanForm
                        ecosystemId={ecosystemId}
                        disabled={busy}
                        onPlanned={intentId => setSelectedId(intentId)}
                    />
                </div>

                <div className="md:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Intent Queue</CardTitle>
                            <CardDescription>
                                Pending approvals and active deployments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {busy && !intents && (
                                <div className="flex justify-center p-8">
                                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {!busy && !intents && !error && (
                                <p className="text-sm text-muted-foreground text-center p-8">
                                    No intents loaded.
                                </p>
                            )}
                            {intents && intents.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                                    <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium">No install intents</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Create a plan to get started.
                                    </p>
                                </div>
                            )}
                            {intents && intents.length > 0 && (
                                <div className="space-y-3">
                                    {intents.map(intent => (
                                        <div
                                            key={intent.intentId}
                                            onClick={() => setSelectedId(intent.intentId)}
                                            className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-medium">
                                                        {intent.intentId}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span>{intent.proposal.source.listingId}</span>
                                                    <span>•</span>
                                                    <span>{intent.proposal.source.versionId}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <StatusBadge
                                                    phase={
                                                        intent.status?.phase ?? 'PENDING_ADOPTION'
                                                    }
                                                />
                                                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
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
        <Card className="bg-gradient-to-b from-card to-muted/20 border-primary/10">
            <CardHeader>
                <CardTitle className="text-lg">Request Install</CardTitle>
                <CardDescription>
                    Render a reviewable plan. Planning does not grant authority.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="plan-listing-id"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Listing ID
                        </label>
                        <input
                            id="plan-listing-id"
                            value={listingId}
                            onChange={event => setListingId(event.target.value)}
                            disabled={disabled || busy}
                            placeholder="listing_..."
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="plan-version-id"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Version ID
                        </label>
                        <input
                            id="plan-version-id"
                            value={versionId}
                            onChange={event => setVersionId(event.target.value)}
                            disabled={disabled || busy}
                            placeholder="version_..."
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="plan-config"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Requested config (JSON)
                        </label>
                        <textarea
                            id="plan-config"
                            value={configText}
                            onChange={event => setConfigText(event.target.value)}
                            disabled={disabled || busy}
                            placeholder='{"district":"demo"}'
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        />
                    </div>

                    {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                    <Button type="submit" className="w-full" disabled={disabled || busy || !ready}>
                        {busy ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileText className="mr-2 h-4 w-4" />
                        )}
                        {busy ? 'Rendering plan...' : 'Render Plan'}
                    </Button>
                </form>
            </CardContent>
        </Card>
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
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                {error ? (
                    <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20 max-w-md text-center">
                        {error}
                        <Button variant="outline" className="mt-4 w-full" onClick={onBack}>
                            Go Back
                        </Button>
                    </div>
                ) : (
                    <>
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading intent details...</p>
                    </>
                )}
            </div>
        );
    }

    const phase = intent.status?.phase ?? 'UNKNOWN';
    const isPlanned = phase === 'PLANNED';
    const isApproved = intent.approval.state === 'APPROVED';
    const isReady = phase === 'READY';

    const isRemoving = phase === 'REMOVING';
    const isRemoved = phase === 'REMOVED';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-display font-bold tracking-tight">
                            Intent Details
                        </h2>
                        <StatusBadge phase={phase} />
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mt-1">{id}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load} disabled={busy}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20 flex items-start gap-3">
                    <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {intent.plan ? (
                        <Card className="border-2 border-primary/20 shadow-elevated overflow-hidden">
                            <div className="bg-gradient-brand h-2 w-full"></div>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Installation Plan
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Review the requested resources and authority changes.
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                            Plan Hash
                                        </div>
                                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1">
                                            {intent.plan.planHash.substring(0, 12)}...
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Consent Tiers - PROMINENT */}
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                                        Data Access & Consent
                                    </h4>
                                    {intent.plan.consentTiers &&
                                    Object.keys(intent.plan.consentTiers).length > 0 ? (
                                        <div className="grid gap-3">
                                            {Object.entries(intent.plan.consentTiers).map(
                                                ([tier, details]) => (
                                                    <div
                                                        key={tier}
                                                        className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-semibold text-amber-900 dark:text-amber-400">
                                                                {tier}
                                                            </span>
                                                            <Badge variant="warning">
                                                                Required
                                                            </Badge>
                                                        </div>
                                                        <pre className="text-xs text-amber-800/80 dark:text-amber-500/80 whitespace-pre-wrap font-mono bg-amber-100/50 dark:bg-amber-900/30 p-2 rounded">
                                                            {JSON.stringify(details, null, 2)}
                                                        </pre>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            No special data access requested.
                                        </div>
                                    )}
                                </div>

                                {/* Authority Changes */}
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <Database className="h-4 w-4 text-blue-500" />
                                        Authority Changes
                                    </h4>
                                    {intent.plan.authorityChanges &&
                                    Object.keys(intent.plan.authorityChanges).length > 0 ? (
                                        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                                            <pre className="text-xs text-blue-900 dark:text-blue-400 whitespace-pre-wrap font-mono">
                                                {JSON.stringify(
                                                    intent.plan.authorityChanges,
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                                            No authority changes.
                                        </div>
                                    )}
                                </div>

                                {/* Proposed Bindings */}
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4 text-violet-500" />
                                        Proposed Bindings
                                    </h4>
                                    {intent.proposal.proposedBindings &&
                                    intent.proposal.proposedBindings.length > 0 ? (
                                        <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50 rounded-lg p-4">
                                            <pre className="text-xs text-violet-900 dark:text-violet-400 whitespace-pre-wrap font-mono">
                                                {JSON.stringify(
                                                    intent.proposal.proposedBindings,
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                                            No bindings proposed.
                                        </div>
                                    )}
                                </div>

                                {/* Infrastructure Effects */}
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                        <Server className="h-4 w-4 text-emerald-500" />
                                        Infrastructure Effects
                                    </h4>
                                    {intent.plan.infrastructureEffects &&
                                    intent.plan.infrastructureEffects.length > 0 ? (
                                        <ul className="space-y-2">
                                            {intent.plan.infrastructureEffects.map((effect, i) => (
                                                <li
                                                    key={i}
                                                    className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-3 text-sm text-emerald-900 dark:text-emerald-400 flex items-start gap-2"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                                                    <span>
                                                        {typeof effect === 'string'
                                                            ? effect
                                                            : JSON.stringify(effect)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                                            No infrastructure effects.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t p-6 flex flex-wrap gap-3">
                                <Button
                                    variant="default"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={handleApprove}
                                    disabled={busy || !isPlanned || isApproved}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve Plan
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={busy || !isPlanned || isApproved}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <div className="flex-1"></div>
                                <Button variant="outline" onClick={handlePlan} disabled={busy}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Re-plan
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-medium">No Plan Rendered</h3>
                                <p className="text-sm text-muted-foreground mt-1 mb-6">
                                    This intent needs to be planned before it can be reviewed.
                                </p>
                                <Button onClick={handlePlan} disabled={busy}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Render Plan
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Lifecycle Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-lg border bg-card shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Apply</span>
                                    <Badge
                                        variant={isApproved && isPlanned ? 'default' : 'secondary'}
                                    >
                                        {isReady ? 'Done' : 'Pending'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Deploy the approved plan to the ecosystem.
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={handleApply}
                                    disabled={busy || !isApproved || !isPlanned}
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    Apply Intent
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-destructive">
                                        Revoke
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Withdraw authority and remove resources.
                                </p>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleRevoke}
                                    disabled={busy || isRemoved || isRemoving}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Revoke Intent
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Audit Trail
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {auditEvents ? (
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                    {auditEvents.map((event, i) => (
                                        <div
                                            key={i}
                                            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                                        >
                                            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border bg-card shadow-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-sm">
                                                        {event.action}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(
                                                            event.timestamp
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div
                                                    className="text-xs text-muted-foreground truncate"
                                                    title={
                                                        event.actorProfileId ||
                                                        event.actorDid ||
                                                        'Unknown'
                                                    }
                                                >
                                                    by{' '}
                                                    {event.actorProfileId?.substring(0, 8) ||
                                                        'Unknown'}
                                                    ...
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-center p-4">
                                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
