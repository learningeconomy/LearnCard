import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    Ban,
    Check,
    Link2,
    Loader2,
    Plus,
    Search,
    ShieldCheck,
    Users,
    X,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ProposeBindingDialog } from '../components/bindings/ProposeBindingDialog';
import { BindingConsentTrail } from '../components/bindings/BindingConsentTrail';
import { trpc } from '../trpc';
import { TRPCClientError } from '@trpc/client';
import type { DashboardSession, BindingRecord, EcosystemInstallTarget } from '../api';

// Prototype states are lowercase; brain (EducationOsBindingStatusEnum) has APPROVED as a
// distinct step between PROPOSED and ACTIVE. It renders under the Active tile.
type DisplayState = 'proposed' | 'active' | 'suspended' | 'revoked';

const DISPLAY_STATE: Record<BindingRecord['status'], DisplayState> = {
    PROPOSED: 'proposed',
    APPROVED: 'active',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    REVOKED: 'revoked',
};

const STATES: DisplayState[] = ['proposed', 'active', 'suspended', 'revoked'];

const STATE_LABELS: Record<DisplayState, string> = {
    proposed: 'Proposed',
    active: 'Active',
    suspended: 'Suspended',
    revoked: 'Revoked',
};

const STATE_STYLES: Record<DisplayState, string> = {
    proposed: 'bg-gold/10 text-gold border-gold/30',
    active: 'bg-emerald/10 text-emerald border-emerald/30',
    suspended: 'bg-muted text-muted-foreground border-border',
    revoked: 'bg-destructive/10 text-destructive border-destructive/30',
};

// Prototype CAPABILITY_STYLES, mapped onto our design tokens (no generic Tailwind palette).
const CAPABILITY_STYLES: Record<string, string> = {
    'roster-source': 'bg-lc-blue/10 text-lc-blue border-lc-blue/30',
    'record-provisioning': 'bg-gold/10 text-gold border-gold/30',
    'credential-issuer': 'bg-emerald/10 text-emerald border-emerald/30',
    'wallet-claim': 'bg-lc-pink/10 text-lc-pink border-lc-pink/30',
    'registry-adapter': 'bg-violet/10 text-violet border-violet/30',
    'insight-source': 'bg-teal/10 text-teal border-teal/30',
};

const CAPABILITIES = Object.keys(CAPABILITY_STYLES);

const describeError = (e: unknown): string => {
    if (e instanceof TRPCClientError) return e.message;
    return e instanceof Error ? e.message : String(e);
};

export function Bindings({ session }: { session: DashboardSession }) {
    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;
    const currentRole = session.effectiveAccess.ecosystemRoles[0]?.role;
    const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN';

    const [bindings, setBindings] = useState<BindingRecord[]>([]);
    const [targets, setTargets] = useState<EcosystemInstallTarget[]>([]);
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState<DisplayState | null>(null);
    const [capFilter, setCapFilter] = useState<string | null>(null);
    const [proposeOpen, setProposeOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!ecosystemId) return;
        try {
            const [bindingsRes, targetsRes] = await Promise.all([
                trpc.bindings.list.query({ ecosystemId }),
                trpc.installTargets.list.query({ ecosystemId }),
            ]);
            setError(null);
            setBindings(bindingsRes);
            setTargets(targetsRes);
        } catch (e) {
            setError(describeError(e));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const endpointName = useCallback(
        (endpoint: BindingRecord['provider']): string => {
            if (endpoint.resourceType === 'ECOSYSTEM') return 'This ecosystem';
            const target = targets.find(t => t.id === endpoint.resourceId);
            return target?.displayName ?? endpoint.resourceId;
        },
        [targets]
    );

    const counts = useMemo(
        () =>
            STATES.map(state => ({
                state,
                count: bindings.filter(b => DISPLAY_STATE[b.status] === state).length,
            })),
        [bindings]
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return bindings.filter(b => {
            if (stateFilter && DISPLAY_STATE[b.status] !== stateFilter) return false;
            if (capFilter && b.capability !== capFilter) return false;
            if (!q) return true;
            return (
                endpointName(b.provider).toLowerCase().includes(q) ||
                endpointName(b.consumer).toLowerCase().includes(q) ||
                b.capability.includes(q)
            );
        });
    }, [bindings, search, stateFilter, capFilter, endpointName]);

    const runMutation = async (bindingId: string, action: () => Promise<unknown>) => {
        setBusyId(bindingId);
        setError(null);
        try {
            await action();
            await load();
        } catch (e) {
            setError(describeError(e));
        } finally {
            setBusyId(null);
        }
    };

    if (!ecosystemId) {
        return <div className="p-6 text-muted-foreground">No ecosystem access.</div>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold lg:text-3xl">
                            <Link2 className="h-6 w-6 text-lc-blue" /> Bindings
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Installing is not connecting. Installing software is like hiring a
                            vendor — hiring two doesn't mean they may talk to each other. A binding
                            is that second decision, written down: a provider on one end, a consumer
                            on the other, and a capability naming what kind of connection it is.
                        </p>
                    </div>
                    {canManage && (
                        <Button onClick={() => setProposeOpen(true)}>
                            <Plus className="mr-1.5 h-4 w-4" /> Propose binding
                        </Button>
                    )}
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-lc-blue/30 bg-lc-blue/5 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lc-blue" />
                    <p className="text-sm">
                        <span className="font-semibold">
                            A binding is authorization topology, never authorization bypass.
                        </span>{' '}
                        It says two systems may talk — it grants them nothing. Data crossing a
                        binding still has to clear the app's declared scopes, the organization's
                        access rules, and the subject's consent. A binding widens nothing; it only
                        makes a permitted path explicit, visible, and revocable.
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {counts.map(({ state, count }) => (
                    <button
                        key={state}
                        onClick={() => setStateFilter(stateFilter === state ? null : state)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                            stateFilter === state
                                ? 'border-lc-blue bg-lc-blue/5'
                                : 'border-border bg-card hover:bg-muted/40'
                        }`}
                    >
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-xs text-muted-foreground">
                            {STATE_LABELS[state]}
                            {state === 'proposed' && ' · needs approval'}
                        </div>
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <div className="relative max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search bindings"
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <Button
                        size="sm"
                        variant={capFilter === null ? 'default' : 'outline'}
                        onClick={() => setCapFilter(null)}
                    >
                        All capabilities
                    </Button>
                    {CAPABILITIES.map(c => (
                        <Button
                            key={c}
                            size="sm"
                            variant={capFilter === c ? 'default' : 'outline'}
                            className="font-mono text-xs"
                            onClick={() => setCapFilter(capFilter === c ? null : c)}
                        >
                            {c}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="font-semibold">Bindings in this organization</h2>
                    <Badge variant="outline" className="text-xs">
                        {filtered.length} shown
                    </Badge>
                </div>
                {filtered.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                        No bindings match these filters.
                    </p>
                ) : (
                    filtered.map(b => {
                        const state = DISPLAY_STATE[b.status];
                        const busy = busyId === b.bindingId;
                        const when = new Date(b.updatedAt).toLocaleDateString();

                        return (
                            <div
                                key={b.bindingId}
                                className="flex flex-col gap-3 border-b border-border/60 p-4 last:border-0 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="font-medium">
                                            {endpointName(b.provider)}
                                        </span>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="font-medium">
                                            {endpointName(b.consumer)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Badge
                                            variant="outline"
                                            className={`font-mono text-[10px] ${
                                                CAPABILITY_STYLES[b.capability] ?? ''
                                            }`}
                                        >
                                            {b.capability}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] ${STATE_STYLES[state]}`}
                                        >
                                            {STATE_LABELS[state]}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {b.approvedBy
                                            ? `Approved by ${b.approvedBy}`
                                            : 'Awaiting approval'}
                                        {' · '}
                                        rev {b.revision} · {when}
                                    </p>
                                    <BindingConsentTrail bindingId={b.bindingId} />
                                </div>

                                {canManage && state !== 'revoked' && (
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        {state === 'proposed' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        runMutation(b.bindingId, () =>
                                                            trpc.bindings.approve.mutate({
                                                                bindingId: b.bindingId,
                                                                expectedRevision: b.revision,
                                                            })
                                                        )
                                                    }
                                                >
                                                    <Check className="mr-1 h-3.5 w-3.5" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        runMutation(b.bindingId, () =>
                                                            trpc.bindings.revoke.mutate({
                                                                bindingId: b.bindingId,
                                                                expectedRevision: b.revision,
                                                            })
                                                        )
                                                    }
                                                >
                                                    <X className="mr-1 h-3.5 w-3.5" /> Decline
                                                </Button>
                                            </>
                                        )}
                                        {(state === 'active' || state === 'suspended') && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={busy}
                                                onClick={() =>
                                                    runMutation(b.bindingId, () =>
                                                        trpc.bindings.revoke.mutate({
                                                            bindingId: b.bindingId,
                                                            expectedRevision: b.revision,
                                                        })
                                                    )
                                                }
                                            >
                                                <Ban className="mr-1 h-3.5 w-3.5" /> Revoke
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                {!canManage && (
                    <p className="border-t border-border p-4 text-xs text-muted-foreground">
                        Read-only view — proposing and approving bindings is reserved for
                        accountable administrators.
                    </p>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <Ban className="h-4 w-4 text-destructive" /> Nothing auto-connects
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Wiring every issuer to every wallet automatically was considered and
                        rejected as "convenient and catastrophic." Each binding is a data-sharing
                        decision that needs a named, accountable approver. A bundle may propose
                        connections; only a person activates them.
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <Users className="h-4 w-4 text-lc-blue" /> Bindings don't cross
                        organizations
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        A binding lives inside one organization's tree. A state-run service serving
                        district-run software is handled by federation rules, not by stretching
                        bindings across boundaries. A designed limit, not a missing feature.
                    </p>
                </div>
            </div>

            <ProposeBindingDialog
                open={proposeOpen}
                onOpenChange={setProposeOpen}
                ecosystemId={ecosystemId}
                targets={targets}
                capabilities={CAPABILITIES}
                onProposed={load}
            />
        </div>
    );
}
