import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Database, Search, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { CategoryFilter } from '../components/CategoryFilter';
import { ClampText } from '../components/ClampText';
import { InstallActions } from '../components/catalog/InstallActions';
import { trpc } from '../trpc';
import type { CatalogListing, CatalogIntegrationManifestSummary, DashboardSession } from '../api';
import type { InstallIntent } from '@learncard/types';

interface DataSourcesProps {
    session: DashboardSession;
}

type DataSource = { listing: CatalogListing; summary: CatalogIntegrationManifestSummary };

export function DataSources({ session }: DataSourcesProps) {
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;

    const loadData = useCallback(async () => {
        if (!ecosystemId) return;
        setError(null);
        try {
            const [listingsRes, intentsRes] = await Promise.all([
                trpc.catalog.listings.query({ limit: 100 }),
                trpc.installIntents.listInstallIntents.query({ ecosystemId }),
            ]);

            // ADR-007 §3.2: only kind=INTEGRATION listings carry a signed lc.integration
            // manifest, which is the only place a capability can be declared.
            const integrations = listingsRes.records.filter(l => l.kind === 'INTEGRATION');

            const summaries = await Promise.all(
                integrations.map(listing =>
                    trpc.catalog.getIntegrationManifestSummary
                        .query({ listingId: listing.listing_id })
                        // An integration whose manifest fails verification declares no
                        // capability we may trust, so it is simply not a Data Source.
                        .catch(() => null)
                )
            );

            setDataSources(
                integrations
                    .map((listing, index) => ({ listing, summary: summaries[index] }))
                    // ADR-008 D6: `insight-source` is the capability for non-subject
                    // reference / insight data flowing *in* — that is this page.
                    // ADR-013 Q4: "Non-subject reference enrichment requires no record
                    // class", so record classes mark the subject-data lane (rendered on
                    // Integrations) and must never gate this listing.
                    .filter((entry): entry is DataSource =>
                        Boolean(entry.summary?.capabilities.provided.includes('insight-source'))
                    )
            );
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

    const categories = Array.from(new Set(dataSources.map(e => e.summary.category))).sort();

    const filtered = dataSources
        .filter(e => e.listing.display_name.toLowerCase().includes(search.toLowerCase()))
        .filter(e => !activeCategory || e.summary.category === activeCategory);

    const getActiveIntent = (listingId: string) =>
        intents.find(i => i.proposal.source.listingId === listingId && i.status?.phase === 'READY');

    const activeItems = filtered.filter(e => getActiveIntent(e.listing.listing_id));
    const restItems = filtered.filter(e => !getActiveIntent(e.listing.listing_id));
    const installed = dataSources.filter(e => getActiveIntent(e.listing.listing_id)).length;

    const renderCard = ({ listing, summary }: DataSource) => {
        const activeIntent = getActiveIntent(listing.listing_id);
        const isInstalled = !!activeIntent;

        return (
            <div
                key={listing.listing_id}
                className={`bg-card border rounded-xl p-4 md:p-6 shadow-card transition-all cursor-pointer hover:shadow-md ${
                    isInstalled ? 'border-emerald/30' : 'border-border'
                }`}
                // A Data Source is the same listing as its Integration, so it has no
                // separate detail route.
                onClick={() => setLocation(`/integrations/${listing.listing_id}`)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground overflow-hidden">
                            {listing.icon_url ? (
                                <img
                                    src={listing.icon_url}
                                    alt={listing.display_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Database className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-foreground">
                                {listing.display_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                    {summary.category}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] gap-1 border-lc-blue/40 text-lc-blue"
                                >
                                    <Database className="w-3 h-3" /> Data Source
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <ClampText
                        text={listing.tagline || listing.full_description}
                        className="text-sm text-muted-foreground"
                    />
                </div>
                <div onClick={e => e.stopPropagation()}>
                    <InstallActions
                        ecosystemId={ecosystemId}
                        itemId={listing.listing_id}
                        itemName={listing.display_name}
                        category={summary.category}
                        isInstalled={isInstalled}
                        existingIntentId={activeIntent?.intentId}
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
                        <Database className="w-7 h-7 text-lc-blue" />
                        Data Sources
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Install connectors that pull reference data into your ecosystem — labor
                        market, federal education, and standards feeds.
                        {installed > 0 && (
                            <span className="text-emerald font-medium"> {installed} installed</span>
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
                    placeholder="Search data sources..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                allCount={dataSources.length}
                getCategoryCount={cat => dataSources.filter(e => e.summary.category === cat).length}
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
                    No data sources match your search.
                </div>
            )}

            {dataSources.length === 0 && !search && !activeCategory && (
                <div className="text-center py-12 text-muted-foreground">
                    No data sources available in the catalog.
                </div>
            )}
        </div>
    );
}
