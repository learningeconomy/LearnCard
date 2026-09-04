import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Download,
    Link2,
    Loader2,
    Package,
    Search,
    ShieldAlert,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { trpc } from '../../trpc';
import type { EcosystemAuditEvent } from '../../api';

type Tone = 'neutral' | 'success' | 'destructive' | 'warning';

// Reconciler STATUS_* ticks are plumbing: they fold into the decision that caused them.
const isPlumbing = (action: string) => action.startsWith('STATUS_');

// Human verb for the *decision* actions (ADR-008 install intents, ADR-008/011 bindings).
const VERBS: Record<string, { verb: string; tone: Tone }> = {
    PLAN_CREATED: { verb: 'planned install of', tone: 'neutral' },
    APPROVED: { verb: 'approved install of', tone: 'success' },
    APPLIED: { verb: 'installed', tone: 'success' },
    REJECTED: { verb: 'rejected install of', tone: 'destructive' },
    REVOKED: { verb: 'uninstalled', tone: 'destructive' },
    POLICY_SUSPENDED: { verb: 'suspended by policy:', tone: 'warning' },
    BINDING_PROPOSED: { verb: 'proposed binding', tone: 'neutral' },
    BINDING_APPROVED: { verb: 'approved binding', tone: 'success' },
    BINDING_ACTIVATED: { verb: 'activated binding', tone: 'success' },
    BINDING_REVOKED: { verb: 'revoked binding', tone: 'destructive' },
};

const describe = (action: string) =>
    VERBS[action] ?? { verb: action.toLowerCase().replace(/_/g, ' '), tone: 'neutral' as Tone };

const TONE_DOT: Record<Tone, string> = {
    neutral: 'bg-muted-foreground/40',
    success: 'bg-emerald',
    destructive: 'bg-destructive',
    warning: 'bg-gold',
};

// One decision = one row. Events that share a subject (intentId or bindingId) and land within
// GROUP_WINDOW_MS of each other are the same human action seen through several state
// transitions; the newest non-plumbing event is the headline, the rest is the chain.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

interface Decision {
    key: string;
    headline: EcosystemAuditEvent;
    chain: EcosystemAuditEvent[];
    at: string;
    actor: string;
    verb: string;
    tone: Tone;
    object?: EcosystemAuditEvent['object'];
    outcome?: string;
    consentSummary?: string;
}

const groupIntoDecisions = (events: EcosystemAuditEvent[]): Decision[] => {
    const sorted = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const decisions: Decision[] = [];

    for (const event of sorted) {
        const subject = event.bindingId ?? event.intentId ?? event.id;
        const existing = decisions.find(
            d =>
                (d.headline.bindingId ?? d.headline.intentId ?? d.headline.id) === subject &&
                Math.abs(new Date(d.at).getTime() - new Date(event.timestamp).getTime()) <
                    GROUP_WINDOW_MS &&
                // A revoke and an approve of the same subject are separate decisions;
                // neutral events (plan, propose, plumbing) fold into either.
                !(
                    describe(d.headline.action).tone === 'destructive' &&
                    describe(event.action).tone === 'success'
                ) &&
                !(
                    describe(d.headline.action).tone === 'success' &&
                    describe(event.action).tone === 'destructive'
                )
        );

        if (existing) {
            existing.chain.push(event);
            // Prefer the most decisive non-plumbing action as the headline.
            if (isPlumbing(existing.headline.action) && !isPlumbing(event.action)) {
                existing.headline = event;
            }
            continue;
        }

        decisions.push({
            key: `${subject}:${event.timestamp}`,
            headline: event,
            chain: [event],
            at: event.timestamp,
            actor: '',
            verb: '',
            tone: 'neutral',
            object: event.object,
        });
    }

    return decisions.map(d => {
        // Most decisive action wins the headline:
        // revoke/reject > applied/activated > approved > proposed/planned > plumbing.
        const rank = (action: string) =>
            action === 'REVOKED' || action === 'REJECTED' || action === 'BINDING_REVOKED'
                ? 4
                : action === 'APPLIED' || action === 'BINDING_ACTIVATED'
                  ? 3
                  : action === 'APPROVED' || action === 'BINDING_APPROVED'
                    ? 2
                    : isPlumbing(action)
                      ? 0
                      : 1;
        const headlineAction = [...d.chain].sort((a, b) => rank(b.action) - rank(a.action))[0]!
            .action;
        const { verb, tone } = describe(headlineAction);
        const status = d.chain.find(e => e.action === 'STATUS_READY')
            ? 'Ready'
            : d.chain.find(e => e.action === 'STATUS_FAILED')
              ? 'Failed'
              : d.chain.find(e => e.action === 'STATUS_APPLYING')
                ? 'Applying'
                : undefined;
        const actorEvent = d.chain.find(e => e.actorDisplayName || e.actorProfileId);

        return {
            ...d,
            verb,
            tone,
            actor: actorEvent?.actorDisplayName ?? actorEvent?.actorProfileId ?? 'System',
            outcome: status,
            consentSummary: d.chain
                .map(e => e.authorityChangesSummary)
                .find(summary => summary && !/^Install plan for /.test(summary)),
        };
    });
};

const dayLabel = (iso: string): string => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (same(date, today)) return 'Today';
    if (same(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

type ObjectFilter = 'ALL' | 'INSTALL' | 'BINDING';
type DecisionFilter = 'ALL' | 'APPROVALS' | 'REVOCATIONS';

const toCsv = (decisions: Decision[]): string => {
    const header = ['timestamp', 'actor', 'action', 'object', 'capability', 'outcome', 'event_ids'];
    const rows = decisions.map(d => [
        d.at,
        d.actor,
        d.headline.action,
        d.object?.title ?? d.headline.bindingId ?? d.headline.intentId ?? '',
        d.object?.capability ?? '',
        d.outcome ?? '',
        d.chain.map(e => e.id).join(' '),
    ]);
    return [header, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
};

export function AuditLog({ ecosystemId }: { ecosystemId: string }) {
    const [events, setEvents] = useState<EcosystemAuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [objectFilter, setObjectFilter] = useState<ObjectFilter>('ALL');
    const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('ALL');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        try {
            setEvents(await trpc.activity.list.query({ ecosystemId, limit: 500 }));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const decisions = useMemo(() => groupIntoDecisions(events), [events]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return decisions.filter(d => {
            if (objectFilter !== 'ALL' && d.object?.kind !== objectFilter) return false;
            if (decisionFilter === 'APPROVALS' && d.tone !== 'success') return false;
            if (decisionFilter === 'REVOCATIONS' && d.tone !== 'destructive') return false;
            if (!q) return true;
            return [d.actor, d.verb, d.object?.title, d.object?.capability, d.headline.action]
                .join(' ')
                .toLowerCase()
                .includes(q);
        });
    }, [decisions, search, objectFilter, decisionFilter]);

    const byDay = useMemo(() => {
        const groups: { day: string; items: Decision[] }[] = [];
        for (const d of filtered) {
            const day = dayLabel(d.at);
            const last = groups[groups.length - 1];
            if (last && last.day === day) last.items.push(d);
            else groups.push({ day, items: [d] });
        }
        return groups;
    }, [filtered]);

    const exportCsv = () => {
        const blob = new Blob([toCsv(filtered)], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${ecosystemId}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggle = (key: string) =>
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[14rem]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by person, app, or capability"
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-1.5">
                    {(['ALL', 'INSTALL', 'BINDING'] as ObjectFilter[]).map(f => (
                        <Button
                            key={f}
                            size="sm"
                            variant={objectFilter === f ? 'default' : 'outline'}
                            onClick={() => setObjectFilter(f)}
                        >
                            {f === 'ALL' ? 'Everything' : f === 'INSTALL' ? 'Installs' : 'Bindings'}
                        </Button>
                    ))}
                </div>
                <div className="flex gap-1.5">
                    {(['ALL', 'APPROVALS', 'REVOCATIONS'] as DecisionFilter[]).map(f => (
                        <Button
                            key={f}
                            size="sm"
                            variant={decisionFilter === f ? 'default' : 'outline'}
                            onClick={() => setDecisionFilter(f)}
                        >
                            {f === 'ALL'
                                ? 'Any outcome'
                                : f === 'APPROVALS'
                                  ? 'Approvals'
                                  : 'Revocations'}
                        </Button>
                    ))}
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={exportCsv}
                    disabled={filtered.length === 0}
                >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                </Button>
            </div>

            {byDay.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                    No decisions match these filters.
                </div>
            )}

            {byDay.map(group => (
                <section key={group.day} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                        {group.day}
                    </h3>
                    <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
                        {group.items.map(d => {
                            const open = expanded.has(d.key);
                            const Icon = d.object?.kind === 'BINDING' ? Link2 : Package;
                            return (
                                <div key={d.key} className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggle(d.key)}
                                        className="w-full flex items-start gap-3 text-left"
                                    >
                                        <span
                                            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[d.tone]}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground">
                                                <span className="font-medium">{d.actor}</span>{' '}
                                                <span className="text-muted-foreground">
                                                    {d.verb}
                                                </span>{' '}
                                                <span className="font-medium">
                                                    {d.object?.title ??
                                                        d.headline.bindingId ??
                                                        d.headline.intentId}
                                                </span>
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                                <Icon className="h-3 w-3" />
                                                {d.object?.listingKind && (
                                                    <span className="capitalize">
                                                        {d.object.listingKind.toLowerCase()}
                                                    </span>
                                                )}
                                                {d.object?.memberCount && (
                                                    <span>· {d.object.memberCount} items</span>
                                                )}
                                                {d.object?.capability && (
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-[10px]"
                                                    >
                                                        {d.object.capability}
                                                    </Badge>
                                                )}
                                                {d.outcome && (
                                                    <Badge
                                                        variant={
                                                            d.outcome === 'Failed'
                                                                ? 'destructive'
                                                                : d.outcome === 'Ready'
                                                                  ? 'success'
                                                                  : 'outline'
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {d.outcome}
                                                    </Badge>
                                                )}
                                                {d.consentSummary && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        {d.consentSummary}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                                            {timeLabel(d.at)}
                                            {open ? (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            )}
                                        </div>
                                    </button>

                                    {open && (
                                        <div className="mt-3 ml-5 rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1.5 font-mono">
                                            {[...d.chain]
                                                .sort((a, b) =>
                                                    a.timestamp.localeCompare(b.timestamp)
                                                )
                                                .map(e => (
                                                    <div
                                                        key={e.id}
                                                        className="flex flex-wrap gap-x-3 text-muted-foreground"
                                                    >
                                                        <span className="text-foreground/80 w-[5.5rem] shrink-0">
                                                            {timeLabel(e.timestamp)}
                                                        </span>
                                                        <span className="w-[11rem] shrink-0">
                                                            {e.action}
                                                        </span>
                                                        <span className="truncate">
                                                            {e.bindingId ?? e.intentId}
                                                        </span>
                                                        {e.actorProfileId && (
                                                            <span className="truncate">
                                                                by {e.actorProfileId}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}
