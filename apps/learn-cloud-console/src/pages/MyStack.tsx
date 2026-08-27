import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Wallet, Cable, LayoutGrid, Package, ArrowRight, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { InstallIntents } from '../InstallIntents';
import { trpc } from '../trpc';
import type { DashboardSession, CatalogListing } from '../api';
import type { InstallIntent } from '@learncard/types';

interface MyStackProps {
    session: DashboardSession;
}

export function MyStack({ session }: MyStackProps) {
    const [, setLocation] = useLocation();
    const [listings, setListings] = useState<CatalogListing[]>([]);
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openKey, setOpenKey] = useState<string | null>(null);

    const ecosystemRoles = session.effectiveAccess.ecosystemRoles;
    const ecosystemId = ecosystemRoles[0]?.ecosystemId;
    const ecosystemIds = [...new Set(ecosystemRoles.map(grant => grant.ecosystemId))];

    const loadData = useCallback(async () => {
        if (!ecosystemId) return;
        setError(null);
        try {
            const [listingsRes, intentsRes] = await Promise.all([
                trpc.catalog.listings.query({ limit: 100 }),
                trpc.installIntents.listInstallIntents.query({ ecosystemId }),
            ]);
            setListings(listingsRes.records);
            setIntents(intentsRes as InstallIntent[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

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

    const getActiveIntent = (listingId: string) => {
        return intents.find(
            i => i.proposal.source.listingId === listingId && i.status?.phase === 'READY'
        );
    };

    const installedListings = listings.filter(l => getActiveIntent(l.listing_id));

    const buckets = {
        wallets: installedListings.filter(l => l.kind === 'WALLET'),
        integrations: installedListings.filter(l => l.kind === 'INTEGRATION'),
        apps: installedListings.filter(l => l.kind === 'APP' || !l.kind),
        bundles: installedListings.filter(l => l.kind === 'BUNDLE'),
    };

    const total = installedListings.length;

    const GROUPS = [
        {
            key: 'wallets' as const,
            title: 'Wallets',
            blurb: 'Learner-held passports and credential wallets',
            icon: Wallet,
            accent: 'from-violet-500/25 to-fuchsia-500/10',
            ring: 'text-violet-600 dark:text-violet-400',
            browse: { label: 'Browse Wallets', to: '/wallets' },
        },
        {
            key: 'integrations' as const,
            title: 'Integrations',
            blurb: 'Systems of record — LMS, SIS and HR',
            icon: Cable,
            accent: 'from-amber-500/25 to-orange-500/10',
            ring: 'text-amber-600 dark:text-amber-400',
            browse: { label: 'Browse Integrations', to: '/integrations' },
        },
        {
            key: 'apps' as const,
            title: 'Apps',
            blurb: 'Learner and staff facing apps',
            icon: LayoutGrid,
            accent: 'from-sky-500/25 to-indigo-500/10',
            ring: 'text-sky-600 dark:text-sky-400',
            browse: { label: 'Browse User Apps', to: '/apps' },
        },
        {
            key: 'bundles' as const,
            title: 'Bundles',
            blurb: 'Core services and data sources',
            icon: Package,
            accent: 'from-emerald-500/25 to-lc-lime/10',
            ring: 'text-emerald-600 dark:text-emerald-400',
            browse: { label: 'Browse Bundles', to: '/bundles' },
        },
    ];

    const kindLabel = (kind?: string) => {
        switch (kind) {
            case 'APP':
                return 'App';
            case 'WALLET':
                return 'Wallet';
            case 'BUNDLE':
                return 'Bundle';
            case 'INTEGRATION':
            default:
                return 'Integration';
        }
    };

    const getFallbackIcon = (kind?: string) => {
        switch (kind) {
            case 'WALLET':
                return Wallet;
            case 'BUNDLE':
                return Package;
            case 'INTEGRATION':
                return Cable;
            case 'APP':
            default:
                return LayoutGrid;
        }
    };

    const activeKey =
        openKey || (GROUPS.find(g => buckets[g.key].length > 0)?.key ?? 'integrations');
    const openGroup = GROUPS.find(g => g.key === activeKey)!;
    const openItems = buckets[activeKey as keyof typeof buckets];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold text-foreground">My Stack</h1>
                <p className="text-muted-foreground mt-1">
                    Everything running in your EducationOS stack — {total} item
                    {total === 1 ? '' : 's'}.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GROUPS.map(g => {
                    const Icon = g.icon;
                    const count = buckets[g.key].length;
                    const isOpen = activeKey === g.key;
                    return (
                        <button
                            key={g.key}
                            type="button"
                            onClick={() => setOpenKey(g.key)}
                            className={`text-left rounded-xl border p-4 bg-gradient-to-br transition-all hover:shadow-md ${
                                g.accent
                            } ${isOpen ? 'border-primary/50 shadow-md' : 'border-border'}`}
                        >
                            <Icon className={`w-5 h-5 mb-3 ${g.ring}`} />
                            <div className="font-display text-2xl font-bold text-foreground leading-none">
                                {count}
                            </div>
                            <div className="font-medium text-sm text-foreground mt-1">
                                {g.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                {g.blurb}
                            </div>
                        </button>
                    );
                })}
            </div>

            {total === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
                    <h2 className="font-display text-xl font-bold text-foreground">
                        Nothing installed yet
                    </h2>
                    <p className="text-muted-foreground">
                        Get started by browsing the catalog and installing your first integration.
                    </p>
                    <Button variant="hero" onClick={() => setLocation('/integrations')}>
                        Browse Integrations
                    </Button>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl p-4 md:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-display font-bold text-foreground">
                            {openGroup.title}
                            <span className="text-muted-foreground font-normal text-sm ml-2">
                                {openItems.length} active
                            </span>
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-2 border-lc-blue text-lc-blue bg-background hover:bg-lc-blue/10 hover:text-lc-blue"
                            onClick={() => setLocation(openGroup.browse.to)}
                        >
                            {openGroup.browse.label}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {openItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nothing in this layer yet — use the browse buttons above to add{' '}
                            {openGroup.title.toLowerCase()}.
                        </p>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-2">
                            {openItems.map(item => {
                                const FallbackIcon = getFallbackIcon(item.kind);
                                return (
                                    <div
                                        key={item.listing_id}
                                        className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 cursor-pointer hover:border-primary/30 transition-colors"
                                        onClick={() =>
                                            setLocation(
                                                item.kind === 'INTEGRATION'
                                                    ? `/integrations/${item.listing_id}`
                                                    : `/apps/${item.listing_id}`
                                            )
                                        }
                                    >
                                        {item.icon_url ? (
                                            <img
                                                src={item.icon_url}
                                                alt={item.display_name}
                                                className="w-4 h-4 shrink-0 object-contain rounded-[3px]"
                                            />
                                        ) : (
                                            <FallbackIcon className="w-4 h-4 shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {item.display_name}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground truncate">
                                                {kindLabel(item.kind)}
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald shrink-0">
                                            <Check className="w-3 h-3" />
                                            Installed
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="pt-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <Badge
                        variant="outline"
                        className="font-display text-[10px] tracking-widest text-muted-foreground"
                    >
                        INSTALL ACTIVITY
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                </div>
                <InstallIntents ecosystemIds={ecosystemIds} />
            </div>
        </div>
    );
}
