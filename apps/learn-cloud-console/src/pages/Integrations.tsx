import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Cable, Search, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { CategoryFilter } from '../components/CategoryFilter';
import { ClampText } from '../components/ClampText';
import { InstallActions } from '../components/catalog/InstallActions';
import { trpc } from '../trpc';
import { getCatalogIntegrationManifestSummary } from '../api';
import type { DashboardSession, CatalogListing, CatalogIntegrationManifestSummary } from '../api';
import type { InstallIntent } from '@learncard/types';

interface IntegrationsProps {
    session: DashboardSession;
}

export function Integrations({ session }: IntegrationsProps) {
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [listings, setListings] = useState<CatalogListing[]>([]);
    const [summaries, setSummaries] = useState<
        Record<string, CatalogIntegrationManifestSummary | null>
    >({});
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
            // ADR-007 §3.2: kind=INTEGRATION is the operator surface shown here;
            // kind=APP (or legacy listings without kind) belongs to User Apps.
            const integrations = listingsRes.records.filter(l => l.kind === 'INTEGRATION');

            setListings(integrations);
            setIntents(intentsRes as InstallIntent[]);

            // An integration whose manifest fails verification declares nothing we may
            // trust, so its card degrades to no record-class pills rather than erroring.
            const summaryResults = await Promise.all(
                integrations.map(
                    async listing =>
                        [
                            listing.listing_id,
                            await getCatalogIntegrationManifestSummary({
                                listingId: listing.listing_id,
                            }).catch(() => null),
                        ] as const
                )
            );

            setSummaries(Object.fromEntries(summaryResults));
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

    // ADR-007 §3.2 + ADR-008 D6: this surface is systems of record. Pure reference
    // feeds (insight-source only, no subject-data capability) render on Data Sources
    // instead; hybrids stay here per ADR-013's strictest-lane-wins review logic.
    const isReferenceFeedOnly = (listingId: string) => {
        const provided = summaries[listingId]?.capabilities?.provided ?? [];

        return (
            provided.includes('insight-source') &&
            !provided.includes('roster-source') &&
            !provided.includes('record-provisioning')
        );
    };

    const filtered = listings
        .filter(p => !isReferenceFeedOnly(p.listing_id))
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

    const renderRecordClassPill = (recordClass: string) => (
        <Badge
            key={recordClass}
            variant="outline"
            className={
                recordClass === 'employment'
                    ? 'border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-600'
                    : 'border-lc-blue/40 bg-lc-blue/10 text-[10px] text-lc-blue'
            }
        >
            {recordClass.charAt(0).toUpperCase() + recordClass.slice(1)}
        </Badge>
    );

    const renderCard = (plugin: CatalogListing) => {
        const activeIntent = getActiveIntent(plugin.listing_id);
        const isInstalled = !!activeIntent;
        const recordClasses = summaries[plugin.listing_id]?.supportedRecordClasses ?? [];

        return (
            <div
                key={plugin.listing_id}
                className={`bg-card border rounded-xl p-4 md:p-6 shadow-card transition-all cursor-pointer hover:shadow-md ${
                    isInstalled ? 'border-emerald/30' : 'border-border'
                }`}
                onClick={() => setLocation(`/integrations/${plugin.listing_id}`)}
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
                                <Cable className="w-5 h-5" />
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
                                    <Cable className="w-3 h-3" /> {kindLabel(plugin.kind)}
                                </Badge>
                                {/* ADR-012 + ADR-013 §3.1: record classes mark the
                                    subject-data lane (records out of a system of record)
                                    and set review depth + consent tier, so they render
                                    here — never on Data Sources, whose reference
                                    enrichment declares no record class (ADR-013 Q4). */}
                                {recordClasses.map(renderRecordClassPill)}
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
                <div onClick={e => e.stopPropagation()}>
                    <InstallActions
                        ecosystemId={ecosystemId}
                        itemId={plugin.listing_id}
                        itemName={plugin.display_name}
                        category={plugin.category}
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
                        <Cable className="w-7 h-7 text-lc-blue" />
                        Integrations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Connect the systems of record for your ecosystem — learning management,
                        student information, and HR systems.
                        {connectedCount > 0 && (
                            <span className="text-emerald font-medium">
                                {' '}
                                {connectedCount} connected
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
                    placeholder="Search integrations..."
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
                    No integrations match your search.
                </div>
            )}

            {listings.length === 0 && !search && !activeCategory && (
                <div className="text-center py-12 text-muted-foreground">
                    No integrations available in the catalog.
                </div>
            )}
        </div>
    );
}
