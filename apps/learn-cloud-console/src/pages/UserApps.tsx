import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { LayoutGrid, Search, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { CategoryFilter } from '../components/CategoryFilter';
import { ClampText } from '../components/ClampText';
import { InstallActions } from '../components/catalog/InstallActions';
import { EnableActions } from '../components/catalog/EnableActions';
import { trpc } from '../trpc';
import { getCatalogEnablement, listCatalogListingsForEcosystem } from '../api';
import type { DashboardSession, CatalogListing, CatalogEnablement } from '../api';
import type { InstallIntent } from '@learncard/types';

interface UserAppsProps {
    session: DashboardSession;
}

export function UserApps({ session }: UserAppsProps) {
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [listings, setListings] = useState<CatalogListing[]>([]);
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [enablement, setEnablement] = useState<CatalogEnablement | null>(null);
    const [ecosystemCatalogIds, setEcosystemCatalogIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;

    const loadData = useCallback(async () => {
        if (!ecosystemId) return;
        setError(null);
        try {
            const [listingsRes, intentsRes, enablementRes, ecosystemListingsRes] =
                await Promise.all([
                    trpc.catalog.listings.query({ limit: 100 }),
                    trpc.installIntents.listInstallIntents.query({ ecosystemId }),
                    getCatalogEnablement({ ecosystemId }),
                    listCatalogListingsForEcosystem({ ecosystemId, limit: 100 }),
                ]);
            // ADR-007 §3.2: kind=APP (or legacy listings without kind) belongs to User Apps.
            setListings(listingsRes.records.filter(l => l.kind === 'APP' || l.kind == null));
            setIntents(intentsRes as InstallIntent[]);
            setEnablement(enablementRes);
            setEcosystemCatalogIds(
                new Set(ecosystemListingsRes.records.map(record => record.listing_id))
            );
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

    const categories = Array.from(
        new Set(listings.map(l => l.category).filter(Boolean) as string[])
    ).sort();

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

    const filtered = listings
        .filter(p => p.display_name.toLowerCase().includes(search.toLowerCase()))
        .filter(p => !activeCategory || p.category === activeCategory);

    const getActiveIntent = (listingId: string) => {
        return intents.find(
            i => i.proposal.source.listingId === listingId && i.status?.phase === 'READY'
        );
    };

    const activeItems = filtered.filter(p => getActiveIntent(p.listing_id));
    const restItems = filtered.filter(p => !getActiveIntent(p.listing_id));
    const connectedCount = listings.filter(p => getActiveIntent(p.listing_id)).length;

    // ADR-010 §3.2: an absent allowlist is implicitly permissive, so nothing is
    // individually enabled until the operator makes the first explicit enablement.
    const isEnabled = (listingId: string) =>
        enablement?.allowedListings?.includes(listingId) ?? false;

    const availableInEcosystemCount = listings.filter(p =>
        ecosystemCatalogIds.has(p.listing_id)
    ).length;

    const renderCard = (plugin: CatalogListing) => {
        const activeIntent = getActiveIntent(plugin.listing_id);
        const isInstalled = !!activeIntent;

        return (
            <div
                key={plugin.listing_id}
                className={`bg-card border rounded-xl p-4 md:p-6 shadow-card transition-all cursor-pointer hover:shadow-md ${
                    isInstalled ? 'border-emerald/30' : 'border-border'
                }`}
                onClick={() => setLocation(`/apps/${plugin.listing_id}`)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground overflow-hidden">
                            {plugin.icon_url ? (
                                <img
                                    src={plugin.icon_url}
                                    alt={plugin.display_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <LayoutGrid className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-foreground">
                                {plugin.display_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                <Badge
                                    variant="outline"
                                    className="text-[10px] gap-1 border-lc-blue/40 text-lc-blue"
                                >
                                    <LayoutGrid className="w-3 h-3" /> {kindLabel(plugin.kind)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <ClampText
                        text={plugin.tagline || plugin.full_description}
                        className="text-sm text-muted-foreground"
                    />
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <EnableActions
                        ecosystemId={ecosystemId}
                        listingId={plugin.listing_id}
                        itemName={plugin.display_name}
                        enabled={isEnabled(plugin.listing_id)}
                        unrestricted={enablement?.unrestricted ?? true}
                        onChanged={loadData}
                    />
                    <InstallActions
                        ecosystemId={ecosystemId}
                        itemId={plugin.listing_id}
                        itemName={plugin.display_name}
                        category={plugin.category}
                        isInstalled={isInstalled}
                        existingIntentId={activeIntent?.intentId}
                        className="flex-1"
                        onChanged={loadData}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
                        <LayoutGrid className="w-7 h-7 text-lc-blue" />
                        User Apps
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Enable apps for members of your ecosystem — learners install them in their
                        LearnCard wallet.
                        <span className="text-lc-blue font-medium">
                            {' '}
                            {availableInEcosystemCount} in your catalog
                        </span>
                        {connectedCount > 0 && (
                            <span className="text-emerald font-medium">
                                {' '}
                                · {connectedCount} connected
                            </span>
                        )}
                    </p>
                </div>
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
                    placeholder="Search apps..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                allCount={listings.length}
                getCategoryCount={cat => listings.filter(p => p.category === cat).length}
            />

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

            {restItems.length > 0 && activeItems.length > 0 && (
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

            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">{restItems.map(renderCard)}</div>

            {filtered.length === 0 && (search || activeCategory) && (
                <div className="text-center py-12 text-muted-foreground">
                    No apps match your search.
                </div>
            )}

            {listings.length === 0 && !search && !activeCategory && (
                <div className="text-center py-12 text-muted-foreground">
                    No apps available in the catalog.
                </div>
            )}
        </div>
    );
}
