import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Package, Search, Loader2, LayoutGrid } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ClampText } from '../components/ClampText';
import { InstallActions } from '../components/catalog/InstallActions';
import { EnableActions } from '../components/catalog/EnableActions';
import { trpc } from '../trpc';
import { getCatalogBundleMembers, getCatalogEnablement } from '../api';
import type { DashboardSession, CatalogListing, CatalogEnablement } from '../api';
import type { CatalogBundleMember } from '../api';
import type { InstallIntent } from '@learncard/types';

interface BundlesProps {
    session: DashboardSession;
}

// ADR-008 install targets → the prototype's catalog section labels, in the prototype's
// own section order so the pill row reads the same across bundles.
const SECTION_BY_TARGET_TYPE: Record<string, string> = {
    WORKLOAD_DEPLOYMENT: 'Infrastructure',
    REGISTRY_SUBSCRIPTION: 'Trust Registries',
    APP_AVAILABILITY: 'User Apps',
    WALLET_ENABLEMENT: 'Wallets',
    INTEGRATION_INSTALL: 'Integrations',
};

const SECTION_ORDER = Object.values(SECTION_BY_TARGET_TYPE);

const sectionsForMembers = (members: CatalogBundleMember[]): string[] => {
    const present = new Set(
        members
            .map(member => SECTION_BY_TARGET_TYPE[member.targetType])
            .filter((label): label is string => Boolean(label))
    );

    return SECTION_ORDER.filter(label => present.has(label));
};

export function Bundles({ session }: BundlesProps) {
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [listings, setListings] = useState<CatalogListing[]>([]);
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [enablement, setEnablement] = useState<CatalogEnablement | null>(null);
    const [membersByListing, setMembersByListing] = useState<Record<string, CatalogBundleMember[]>>(
        {}
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;

    const loadData = useCallback(async () => {
        if (!ecosystemId) return;
        setError(null);
        try {
            const [listingsRes, intentsRes, enablementRes] = await Promise.all([
                trpc.catalog.listings.query({ limit: 100 }),
                trpc.installIntents.listInstallIntents.query({ ecosystemId }),
                getCatalogEnablement({ ecosystemId }),
            ]);
            // ADR-007 §3.2: kind=BUNDLE is the bundle surface shown here.
            const bundles = listingsRes.records.filter(l => l.kind === 'BUNDLE');

            setListings(bundles);
            setIntents(intentsRes as InstallIntent[]);
            setEnablement(enablementRes);

            // A bundle with no valid signed manifest simply has no members to show —
            // its card degrades to the plain description rather than failing the page.
            const memberResults = await Promise.all(
                bundles.map(async bundle => {
                    try {
                        return [
                            bundle.listing_id,
                            await getCatalogBundleMembers({ listingId: bundle.listing_id }),
                        ] as const;
                    } catch {
                        return [bundle.listing_id, [] as CatalogBundleMember[]] as const;
                    }
                })
            );

            setMembersByListing(Object.fromEntries(memberResults));
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

    const filtered = listings.filter(bundle =>
        `${bundle.display_name} ${bundle.category ?? ''} ${bundle.tagline ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const getActiveIntent = (listingId: string) => {
        return intents.find(
            i => i.proposal.source.listingId === listingId && i.status?.phase === 'READY'
        );
    };

    // ADR-010 §3.2: an absent allowlist is implicitly permissive, so nothing is
    // individually enabled until the operator makes the first explicit enablement.
    const isEnabled = (listingId: string) =>
        enablement?.allowedListings?.includes(listingId) ?? false;

    const renderCard = (bundle: CatalogListing) => {
        const members = membersByListing[bundle.listing_id] ?? [];
        const sections = sectionsForMembers(members);
        const installedCount = members.filter(member => getActiveIntent(member.listingId)).length;
        const activeIntent = getActiveIntent(bundle.listing_id);
        const isInstalled = !!activeIntent;

        return (
            <div
                key={bundle.listing_id}
                className={`bg-card border rounded-xl overflow-hidden shadow-card transition-all cursor-pointer hover:shadow-md ${
                    isInstalled ? 'border-emerald/30' : 'border-border'
                }`}
                onClick={() => setLocation(`/bundles/${bundle.listing_id}`)}
            >
                <div className="bg-gradient-to-br from-lc-blue/25 to-lc-pink/10 px-4 md:px-6 py-4 flex items-start gap-3 relative">
                    <div className="w-10 h-10 rounded-lg bg-background/70 flex items-center justify-center shrink-0 overflow-hidden">
                        {bundle.icon_url ? (
                            <img
                                src={bundle.icon_url}
                                alt={bundle.display_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="w-6 h-6 text-foreground" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-foreground leading-tight">
                            {bundle.display_name}
                        </h3>
                        {bundle.category && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {bundle.category}
                            </p>
                        )}
                    </div>
                </div>
                <div className="p-4 md:p-6 space-y-3">
                    <ClampText
                        text={bundle.tagline || bundle.full_description}
                        className="text-sm text-muted-foreground"
                    />
                    <div className="flex flex-wrap gap-1.5">
                        {sections.map(label => (
                            <Badge key={label} variant="secondary" className="text-xs">
                                {label}
                            </Badge>
                        ))}
                        {members.length > 0 && (
                            <>
                                <Badge variant="outline" className="text-xs gap-1">
                                    <LayoutGrid className="w-3 h-3" />
                                    {installedCount > 0
                                        ? `${installedCount}/${members.length} items installed`
                                        : `${members.length} items`}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {members.length} tools
                                </Badge>
                            </>
                        )}
                    </div>
                    <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        <EnableActions
                            ecosystemId={ecosystemId}
                            listingId={bundle.listing_id}
                            itemName={bundle.display_name}
                            enabled={isEnabled(bundle.listing_id)}
                            unrestricted={enablement?.unrestricted ?? true}
                            onChanged={loadData}
                        />
                        <InstallActions
                            ecosystemId={ecosystemId}
                            itemId={bundle.listing_id}
                            itemName={bundle.display_name}
                            category={bundle.category}
                            isInstalled={isInstalled}
                            existingIntentId={activeIntent?.intentId}
                            className="flex-1"
                            onChanged={loadData}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Bundles</h1>
                <p className="text-muted-foreground mt-1">
                    Organization and product suites that span more than one catalog section. Install
                    a whole stack at once, or open the bundle to browse the vendor's own tools in
                    place.
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
                    placeholder="Search bundles..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 md:gap-4">{filtered.map(renderCard)}</div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No bundles match your search.
                </div>
            )}
        </div>
    );
}
