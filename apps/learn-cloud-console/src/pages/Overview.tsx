import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
    AppWindow,
    BookMarked,
    Building2,
    Loader2,
    LucideIcon,
    Plug,
    TrendingUp,
    Users,
} from 'lucide-react';
import { DashboardSession, getEcosystemDetail, listEcosystems } from '../api';
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

    const ecosystemIds = useMemo(
        () => [...new Set(session.effectiveAccess.ecosystemRoles.map(grant => grant.ecosystemId))],
        [session.effectiveAccess.ecosystemRoles]
    );

    const load = useCallback(async () => {
        setError(null);
        try {
            const [ecosystems, details, intentsPerEcosystem] = await Promise.all([
                listEcosystems(),
                Promise.all(ecosystemIds.map(id => getEcosystemDetail(id))),
                Promise.all(
                    ecosystemIds.map(id =>
                        trpc.installIntents.listInstallIntents.query({ ecosystemId: id })
                    )
                ),
            ]);

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
        void load();
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
