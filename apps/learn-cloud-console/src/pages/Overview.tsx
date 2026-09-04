import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
    AlertTriangle,
    AppWindow,
    ArrowRight,
    CheckCircle2,
    BookMarked,
    Building2,
    Loader2,
    LucideIcon,
    Plug,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    BindingRecord,
    DashboardSession,
    EcosystemAuditEvent,
    getEcosystemDetail,
    listEcosystems,
} from '../api';
import { trpc } from '../trpc';
import type { InstallIntent } from '@learncard/types';

// Ported from the prototype's Overview.tsx (src/pages/dashboard/Overview.tsx).
// Per AGENTS.md rule 4, prototype-only mock tiles are omitted, not faked:
// "Issue Credentials" / "Deploy LearnCards" / "Configure LearnClouds" /
// "Run Simulation" and the "Credentials Issued" stat have no real primitive yet.
const quickActions: { title: string; desc: string; icon: LucideIcon; href: string }[] = [
    {
        title: 'Build Your Ecosystem',
        desc: 'Add states, districts, schools, universities, and employers',
        icon: Building2,
        href: '/ecosystem',
    },
    {
        title: 'Install Apps',
        desc: 'Browse and install learning tools from the App Store',
        icon: AppWindow,
        href: '/apps',
    },
    {
        title: 'Add Plugins',
        desc: 'Extend your infrastructure with SSO, compliance, and integrations',
        icon: Plug,
        href: '/plugins',
    },
    {
        title: 'Manage Registries',
        desc: 'Add skills frameworks, trusted issuers, and endorsed credentials',
        icon: BookMarked,
        href: '/trust-registries',
    },
];

const relativeTime = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

interface StatTile {
    label: string;
    value: string;
    icon: LucideIcon;
    link: string;
    linkText: string;
}

export function Overview({ session }: { session: DashboardSession }) {
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StatTile[]>([]);
    const [events, setEvents] = useState<EcosystemAuditEvent[]>([]);
    const [pendingBindings, setPendingBindings] = useState<BindingRecord[]>([]);

    const ecosystemIds = useMemo(
        () => [...new Set(session.effectiveAccess.ecosystemRoles.map(grant => grant.ecosystemId))],
        [session.effectiveAccess.ecosystemRoles]
    );

    const load = useCallback(async () => {
        setError(null);
        try {
            const [ecosystems, details, intentsPerEcosystem, eventsPerEcosystem, bindingsPer] =
                await Promise.all([
                    listEcosystems(),
                    Promise.all(ecosystemIds.map(id => getEcosystemDetail(id))),
                    Promise.all(
                        ecosystemIds.map(id =>
                            trpc.installIntents.listInstallIntents.query({ ecosystemId: id })
                        )
                    ),
                    Promise.all(
                        ecosystemIds.map(id =>
                            trpc.activity.list.query({ ecosystemId: id, limit: 50 })
                        )
                    ),
                    Promise.all(
                        ecosystemIds.map(id => trpc.bindings.list.query({ ecosystemId: id }))
                    ),
                ]);

            setEvents(
                eventsPerEcosystem.flat().sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            );
            setPendingBindings(bindingsPer.flat().filter(b => b.status === 'PROPOSED'));

            // Members = unique profiles across every ecosystem this session can see
            // (ADR-001: profiles are the real primitive behind the prototype's
            // mocked "Learners" figure).
            const memberIds = new Set<string>();
            details.forEach(detail =>
                (detail.members ?? []).forEach(member => memberIds.add(member.profileId))
            );

            // Installed = ADR-008 install intents with status.phase === 'READY',
            // deduped by listing (same rule as My Stack).
            const installedListingIds = new Set<string>();
            intentsPerEcosystem.flat().forEach(intent => {
                const typed = intent as InstallIntent;
                if (typed.status?.phase === 'READY') {
                    installedListingIds.add(typed.proposal.source.listingId);
                }
            });

            setStats([
                {
                    label: 'Ecosystems',
                    value: ecosystems.length.toLocaleString(),
                    icon: Building2,
                    link: '/ecosystem',
                    linkText: 'Manage Ecosystem',
                },
                {
                    label: 'Members',
                    value: memberIds.size.toLocaleString(),
                    icon: Users,
                    link: '/users',
                    linkText: 'Manage Users',
                },
                {
                    label: 'Plugins Installed',
                    value: installedListingIds.size.toLocaleString(),
                    icon: Plug,
                    link: '/bundles',
                    linkText: 'Browse Plugins',
                },
            ]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [ecosystemIds]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                            Welcome to EducationOS
                        </h1>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <div
                        key={stat.label}
                        className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-card cursor-pointer hover:border-emerald/30 transition-all"
                        onClick={() => setLocation(stat.link)}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <stat.icon className="w-5 h-5 text-emerald" />
                            <TrendingUp className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                        <div className="font-display text-2xl font-bold text-foreground">
                            {stat.value}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                        <div className="text-xs text-emerald mt-2 font-medium">
                            {stat.linkText} →
                        </div>
                    </div>
                ))}
            </div>

            {/* Needs your attention — the only activity that is actionable from a dashboard.
                History lives in Settings → Security → Audit Log. */}
            {(() => {
                const latestInstall = events.find(
                    e => e.action === 'APPLIED' && e.object?.kind === 'INSTALL'
                );
                const todayCount = events.filter(
                    e =>
                        !e.action.startsWith('STATUS_') &&
                        new Date(e.timestamp).toDateString() === new Date().toDateString()
                ).length;
                if (pendingBindings.length === 0 && !latestInstall) return null;

                return (
                    <div className="bg-card border border-border rounded-xl shadow-card divide-y divide-border/60">
                        {pendingBindings.length > 0 && (
                            <Link
                                href="/bindings"
                                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-4 h-4" />
                                    </span>
                                    <div>
                                        <div className="text-sm font-medium text-foreground">
                                            {pendingBindings.length} binding
                                            {pendingBindings.length === 1 ? '' : 's'} awaiting your
                                            approval
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Proposed connections stay inert until an accountable
                                            administrator activates them.
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm text-emerald font-medium inline-flex items-center gap-1 shrink-0">
                                    Review <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </Link>
                        )}
                        {latestInstall && (
                            <div className="flex items-center justify-between gap-3 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </span>
                                    <div>
                                        <div className="text-sm font-medium text-foreground">
                                            {latestInstall.object?.title} installed{' '}
                                            <span className="text-muted-foreground font-normal">
                                                {relativeTime(latestInstall.timestamp)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {todayCount} decision{todayCount === 1 ? '' : 's'} today
                                            {latestInstall.actorDisplayName &&
                                                ` · by ${latestInstall.actorDisplayName}`}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href="/settings"
                                    className="text-sm text-emerald font-medium inline-flex items-center gap-1 shrink-0"
                                >
                                    View audit log <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Quick Actions */}
            <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                    Quick Actions
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                    {quickActions.map(action => (
                        <div
                            key={action.title}
                            onClick={() => setLocation(action.href)}
                            className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-card hover:shadow-elevated hover:border-emerald/30 transition-all group cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0 group-hover:bg-emerald/20 transition-colors">
                                    <action.icon className="w-5 h-5 text-emerald" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-foreground group-hover:text-emerald transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {action.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
