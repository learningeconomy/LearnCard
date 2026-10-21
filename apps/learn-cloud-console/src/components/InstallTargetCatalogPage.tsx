import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
    Loader2,
    Search,
    type LucideIcon,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ClampText } from './ClampText';
import { InstallActions } from './catalog/InstallActions';
import { EnableActions } from './catalog/EnableActions';
import { trpc } from '../trpc';
import {
    getCatalogBundleMembers,
    getCatalogEnablement,
    getCatalogIntegrationManifestSummary,
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
// catalogs. Two real catalog sources feed "Browse":
//  - ADR-015 D2: registry-adapter INTEGRATION listings — a signed manifest that
//    declares the REGISTRY_SUBSCRIPTION(s) a singleton install establishes. These
//    are individually installable (`browseCapability`).
//  - ADR-008 §3.6: not-yet-installed bundle members of the requested target type,
//    installable via their bundle. This is the only path for workloads: ADR-009 A5
//    rejected workloads as a listing kind and their package registry is not built.
// Quick Start, category chips, the issuer hero, and member requests are prototype
// mocks and are omitted, not faked.
interface CatalogEntry {
    listingId: string;
    listing: CatalogListing | null;
    memberDisplayName?: string;
    target?: InstallTargetSummary;
    viaBundles: CatalogListing[];
    installable: boolean;
    subscribes: string[];
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
    browseCapability?: string;
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
    browseCapability,
}: Props) {
    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState<CatalogEntry[]>([]);
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [enablement, setEnablement] = useState<CatalogEnablement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSupport, setExpandedSupport] = useState<Record<string, boolean>>({});
    const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

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
                const created: CatalogEntry = {
                    listingId,
                    listing: null,
                    viaBundles: [],
                    installable: false,
                    subscribes: [],
                };
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

            if (browseCapability) {
                const integrations = listingsRes.records.filter(l => l.kind === 'INTEGRATION');
                const summaries = await Promise.all(
                    integrations.map(async listing => {
                        try {
                            return [
                                listing,
                                await getCatalogIntegrationManifestSummary({
                                    listingId: listing.listing_id,
                                }),
                            ] as const;
                        } catch {
                            return [listing, null] as const;
                        }
                    })
                );
                summaries.forEach(([listing, summary]) => {
                    if (!summary?.capabilities.provided.includes(browseCapability)) return;
                    const entry = ensure(listing.listing_id);
                    entry.listing = listing;
                    entry.installable = true;
                    entry.subscribes = summary.subscribes.map(sub => sub.displayName);
                });
            }

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
    }, [ecosystemId, targetType, fetchTargets, browseCapability]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    useEffect(() => {
        if (targetType !== 'WORKLOAD_DEPLOYMENT') return;

        const hasPending = entries.some(e => {
            const target = e.target;
            if (!target || !('workload' in target)) return false;
            const { lifecycle } = target.workload;
            return lifecycle === 'PENDING' || lifecycle === 'APPLYING' || lifecycle === 'RETIRING';
        });

        if (!hasPending) return;

        const interval = setInterval(() => {
            void Promise.resolve().then(load);
        }, 5000);

        return () => clearInterval(interval);
    }, [entries, load, targetType]);

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

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedEndpoint(id);
        setTimeout(() => setCopiedEndpoint(null), 2000);
    };

    const renderWorkloadCard = (entry: CatalogEntry) => {
        const target = entry.target;
        if (!target || !('workload' in target)) return renderCard(entry);
        const { workload } = target;

        const name = entry.listing?.display_name ?? workload.packageId;
        const isExpanded = expandedSupport[entry.listingId];

        let badgeVariant: 'success' | 'warning' | 'destructive' | 'outline' | 'secondary' =
            'secondary';
        let showSpinner = false;
        if (workload.lifecycle === 'READY') badgeVariant = 'success';
        else if (workload.lifecycle === 'DEGRADED') badgeVariant = 'warning';
        else if (workload.lifecycle === 'FAILED') badgeVariant = 'destructive';
        else if (workload.lifecycle === 'RETIRING' || workload.lifecycle === 'RETIRED')
            badgeVariant = 'outline';
        else if (workload.lifecycle === 'APPLYING' || workload.lifecycle === 'PENDING') {
            badgeVariant = 'secondary';
            showSpinner = true;
        }

        const failureMessage =
            workload.failureCode === 'DRIVER_FAILED'
                ? 'The deployment agent reported a failure'
                : workload.failureCode === 'AGENT_STALE'
                  ? 'The deployment agent stopped reporting'
                  : workload.failureCode;

        const publicEndpoints = workload.endpoints.filter(
            e => e.visibility === 'ecosystem' || e.visibility === 'public'
        );

        return (
            <div
                key={entry.listingId}
                className="bg-card border rounded-xl p-4 md:p-6 shadow-card transition-all hover:shadow-md border-emerald/30"
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
                                <Badge
                                    variant={badgeVariant}
                                    className="text-[10px] flex items-center gap-1"
                                >
                                    {showSpinner && <Loader2 className="w-3 h-3 animate-spin" />}
                                    {workload.lifecycle}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {entry.viaBundles.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                        Installed via{' '}
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

                {failureMessage && (
                    <div className="mb-3 text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                        {failureMessage}
                    </div>
                )}

                {workload.components.length > 0 && (
                    <div className="mb-4">
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">
                            Components
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {workload.components.map(c => (
                                <div
                                    key={c.id}
                                    className="flex items-center gap-1.5 bg-muted/50 border rounded px-2 py-1 text-xs"
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full ${c.healthy ? 'bg-emerald' : 'bg-destructive'}`}
                                    />
                                    <span className="font-mono">{c.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {publicEndpoints.length > 0 && (
                    <div className="mb-4">
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">
                            Endpoints
                        </div>
                        <div className="space-y-1.5">
                            {publicEndpoints.map(e => (
                                <div
                                    key={e.id}
                                    className="flex items-center justify-between bg-muted/30 border rounded px-2 py-1.5 text-xs"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="font-medium text-muted-foreground shrink-0">
                                            {e.id}
                                        </span>
                                        <span className="font-mono truncate text-foreground">
                                            {e.url}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(e.url, e.id)}
                                        className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
                                    >
                                        {copiedEndpoint === e.id ? (
                                            <Check className="w-3.5 h-3.5 text-emerald" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 border-t pt-3">
                    <button
                        onClick={() =>
                            setExpandedSupport(prev => ({
                                ...prev,
                                [entry.listingId]: !prev[entry.listingId],
                            }))
                        }
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        Support boundary
                    </button>

                    {isExpanded && (
                        <div className="mt-2 space-y-1.5 text-xs bg-muted/20 p-3 rounded-md border">
                            {Object.entries(workload.supportBoundary).map(([key, value]) => (
                                <div key={key} className="flex flex-col sm:flex-row sm:gap-2">
                                    <span className="text-muted-foreground font-medium min-w-[100px]">
                                        {key}:
                                    </span>
                                    <span className="text-foreground break-words">{value}</span>
                                </div>
                            ))}
                            {workload.retainedObligations.length > 0 && (
                                <div className="flex flex-col sm:flex-row sm:gap-2 mt-2 pt-2 border-t border-border/50">
                                    <span className="text-muted-foreground font-medium min-w-[100px]">
                                        Retained after retirement:
                                    </span>
                                    <span className="text-foreground break-words">
                                        {workload.retainedObligations.join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
                {entry.subscribes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {entry.subscribes.map(label => (
                            <Badge key={label} variant="outline" className="text-[10px]">
                                {label}
                            </Badge>
                        ))}
                    </div>
                )}
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
                    {installed || entry.installable ? (
                        <InstallActions
                            ecosystemId={ecosystemId}
                            itemId={entry.listingId}
                            itemName={name}
                            category={sectionLabel}
                            isInstalled={installed}
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
                        {activeItems.map(entry =>
                            targetType === 'WORKLOAD_DEPLOYMENT'
                                ? renderWorkloadCard(entry)
                                : renderCard(entry)
                        )}
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

            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                {browseItems.map(entry =>
                    targetType === 'WORKLOAD_DEPLOYMENT'
                        ? renderWorkloadCard(entry)
                        : renderCard(entry)
                )}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
            )}
        </div>
    );
}
