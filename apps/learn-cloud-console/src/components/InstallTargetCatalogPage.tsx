import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Loader2, Search, type LucideIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ClampText } from './ClampText';
import { InstallActions } from './catalog/InstallActions';
import { EnableActions } from './catalog/EnableActions';
import { trpc } from '../trpc';
import {
    getCatalogBundleMembers,
    getCatalogEnablement,
    getCatalogListing,
    type CatalogBundleMember,
    type CatalogEnablement,
    type CatalogListing,
    type DashboardSession,
} from '../api';
import type { InstallTargetSummary } from './InstallTargetList';
import type { InstallIntent } from '@learncard/types';

type CatalogTargetType = 'WORKLOAD_DEPLOYMENT' | 'REGISTRY_SUBSCRIPTION';

// Prototype (Plugins.tsx / RegistryCatalogPage.tsx) renders these as browsable
// catalogs. There is no first-class catalog primitive for either target type:
// ADR-009 A5 rejected workloads as a listing kind (own package registry, not built),
// ADR-015 D2 says registry subscriptions never carry manifests/surfaces, and
// ADR-015 Q7 tracks the listing-kind enum gap. The only real path to either
// target today is a bundle member (ADR-008 §3.6), so "Browse" here is exactly the
// set of not-yet-installed bundle members of the requested type. Quick Start,
// category chips, the issuer hero, and member requests are prototype mocks and
// are omitted, not faked.
interface CatalogEntry {
    listingId: string;
    listing: CatalogListing | null;
    memberDisplayName?: string;
    target?: InstallTargetSummary;
    viaBundles: CatalogListing[];
}

interface Props {
    session: DashboardSession;
    targetType: CatalogTargetType;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    sectionLabel: string;
    searchPlaceholder: string;
    emptyMessage: string;
    fetchTargets: (input: { ecosystemId: string }) => Promise<InstallTargetSummary[]>;
}

export function InstallTargetCatalogPage({
    session,
    targetType,
    title,
    subtitle,
    icon: Icon,
    sectionLabel,
    searchPlaceholder,
    emptyMessage,
    fetchTargets,
}: Props) {
    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState<CatalogEntry[]>([]);
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [enablement, setEnablement] = useState<CatalogEnablement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!ecosystemId) return;
        try {
            const [targets, listingsRes, intentsRes, enablementRes] = await Promise.all([
                fetchTargets({ ecosystemId }),
                trpc.catalog.listings.query({ limit: 100 }),
                trpc.installIntents.listInstallIntents.query({ ecosystemId }),
                getCatalogEnablement({ ecosystemId }),
            ]);
            setError(null);
            setIntents(intentsRes as InstallIntent[]);
            setEnablement(enablementRes);

            const bundles = listingsRes.records.filter(l => l.kind === 'BUNDLE');
            const membersPerBundle = await Promise.all(
                bundles.map(async bundle => {
                    try {
                        return [
                            bundle,
                            await getCatalogBundleMembers({ listingId: bundle.listing_id }),
                        ] as const;
                    } catch {
                        return [bundle, [] as CatalogBundleMember[]] as const;
                    }
                })
            );

            const byListing = new Map<string, CatalogEntry>();
            const ensure = (listingId: string): CatalogEntry => {
                const existing = byListing.get(listingId);
                if (existing) return existing;
                const created: CatalogEntry = { listingId, listing: null, viaBundles: [] };
                byListing.set(listingId, created);
                return created;
            };

            targets.forEach(target => {
                const entry = ensure(target.listingId ?? target.id);
                entry.target = target;
            });

            membersPerBundle.forEach(([bundle, members]) => {
                members
                    .filter(member => member.targetType === targetType)
                    .forEach(member => {
                        const entry = ensure(member.listingId);
                        entry.memberDisplayName = member.display_name ?? entry.memberDisplayName;
                        entry.viaBundles.push(bundle);
                    });
            });

            const listingDetails = await Promise.all(
                [...byListing.keys()].map(async listingId => {
                    try {
                        return [
                            listingId,
                            (await getCatalogListing({ listingId })).listing,
                        ] as const;
                    } catch {
                        return [listingId, null] as const;
                    }
                })
            );
            listingDetails.forEach(([listingId, listing]) => {
                const entry = byListing.get(listingId);
                if (entry) entry.listing = listing;
            });

            setEntries([...byListing.values()]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId, targetType, fetchTargets]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

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

    const nameOf = (entry: CatalogEntry) =>
        entry.target?.displayName ??
        entry.listing?.display_name ??
        entry.memberDisplayName ??
        entry.listingId;
    const descriptionOf = (entry: CatalogEntry) =>
        entry.target?.tagline ?? entry.listing?.tagline ?? entry.listing?.full_description ?? '';

    const filtered = entries.filter(entry =>
        `${nameOf(entry)} ${descriptionOf(entry)}`.toLowerCase().includes(search.toLowerCase())
    );
    const activeItems = filtered.filter(entry => entry.target);
    const browseItems = filtered.filter(entry => !entry.target);
    const installedCount = entries.filter(entry => entry.target).length;

    const isEnabled = (listingId: string) =>
        enablement?.allowedListings?.includes(listingId) ?? false;

    const renderCard = (entry: CatalogEntry) => {
        const installed = !!entry.target;
        const name = nameOf(entry);
        const ownIntent = intents.find(
            i => i.proposal.source.listingId === entry.listingId && i.status?.phase === 'READY'
        );

        return (
            <div
                key={entry.listingId}
                className={`bg-card border rounded-xl p-4 md:p-6 shadow-card transition-all hover:shadow-md ${
                    installed ? 'border-emerald/30' : 'border-border'
                }`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary overflow-hidden">
                            {entry.listing?.icon_url ? (
                                <img
                                    src={entry.listing.icon_url}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Icon className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-foreground">{name}</h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                    {sectionLabel}
                                </Badge>
                                {entry.target && (
                                    <Badge
                                        variant={
                                            entry.target.status === 'READY' ? 'success' : 'warning'
                                        }
                                        className="text-[10px]"
                                    >
                                        {entry.target.status}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <ClampText
                        text={descriptionOf(entry)}
                        className="text-sm text-muted-foreground"
                    />
                </div>
                {entry.viaBundles.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                        via{' '}
                        {entry.viaBundles.map((bundle, index) => (
                            <span key={bundle.listing_id}>
                                {index > 0 && ', '}
                                <Link
                                    href={`/bundles/${bundle.listing_id}`}
                                    className="text-primary hover:underline"
                                >
                                    {bundle.display_name}
                                </Link>
                            </span>
                        ))}
                    </p>
                )}
                <div className="flex gap-2">
                    <EnableActions
                        ecosystemId={ecosystemId}
                        listingId={entry.listingId}
                        itemName={name}
                        enabled={isEnabled(entry.listingId)}
                        unrestricted={enablement?.unrestricted ?? true}
                        onChanged={load}
                    />
                    {installed ? (
                        <InstallActions
                            ecosystemId={ecosystemId}
                            itemId={entry.listingId}
                            itemName={name}
                            category={sectionLabel}
                            isInstalled
                            existingIntentId={ownIntent?.intentId}
                            className="flex-1"
                            onChanged={load}
                        />
                    ) : (
                        <Link
                            href={`/bundles/${entry.viaBundles[0]?.listing_id ?? ''}`}
                            className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-lc-blue to-emerald text-white shadow-md hover:opacity-90 transition-opacity"
                        >
                            Install via bundle
                        </Link>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
                    <Icon className="w-7 h-7 text-lc-blue" />
                    {title}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {subtitle}{' '}
                    {installedCount > 0 && (
                        <span className="text-emerald font-medium">{installedCount} installed</span>
                    )}
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    className="pl-10"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {activeItems.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-foreground">Active</h2>
                        <Badge className="bg-emerald/10 text-emerald border-emerald/30">
                            {activeItems.length}
                        </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                        {activeItems.map(renderCard)}
                    </div>
                </section>
            )}

            {activeItems.length > 0 && browseItems.length > 0 && (
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <Badge
                        variant="outline"
                        className="font-display text-[10px] tracking-widest text-muted-foreground"
                    >
                        BROWSE
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">{browseItems.map(renderCard)}</div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
            )}
        </div>
    );
}
