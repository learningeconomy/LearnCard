import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Cable, LayoutGrid, Wallet, Package } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { InstallActions } from '../components/catalog/InstallActions';
import { PageSkeleton } from '../components/PageSkeleton';
import { ErrorState } from '../components/ErrorState';
import { getCatalogListing, type DashboardSession, type CatalogListing } from '../api';
import { trpc } from '../trpc';
import type { InstallIntent } from '@learncard/types';

interface ListingDetailProps {
    session: DashboardSession;
}

export function ListingDetail({ session }: ListingDetailProps) {
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [listing, setListing] = useState<CatalogListing | null>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;

    const loadData = useCallback(async () => {
        if (!id || !ecosystemId) return;
        setError(null);
        try {
            const [listingRes, intentsRes] = await Promise.all([
                getCatalogListing({ listingId: id }),
                trpc.installIntents.listInstallIntents.query({ ecosystemId }),
            ]);
            setListing(listingRes.listing);
            setVersions(listingRes.versions || []);
            setIntents(intentsRes as InstallIntent[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [id, ecosystemId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    if (!ecosystemId) {
        return <div className="p-6 text-muted-foreground">No ecosystem access.</div>;
    }

    if (loading) return <PageSkeleton rows={3} />;
    if (error || !listing)
        return (
            <div className="max-w-4xl mx-auto">
                <ErrorState message={error || 'Listing not found.'} onRetry={loadData} />
            </div>
        );

    const getActiveIntent = () => {
        return intents.find(
            i => i.proposal.source.listingId === listing.listing_id && i.status?.phase === 'READY'
        );
    };

    const activeIntent = getActiveIntent();
    const isInstalled = !!activeIntent;

    let Icon = LayoutGrid;
    let backPath = '/apps';
    let backLabel = 'Apps';
    let kindLabel = 'App';

    if (listing.kind === 'INTEGRATION') {
        Icon = Cable;
        backPath = '/integrations';
        backLabel = 'Integrations';
        kindLabel = 'Integration';
    } else if (listing.kind === 'WALLET') {
        Icon = Wallet;
        backPath = '/wallets';
        backLabel = 'Wallets';
        kindLabel = 'Wallet';
    } else if (listing.kind === 'BUNDLE') {
        Icon = Package;
        backPath = '/bundles';
        backLabel = 'Bundles';
        kindLabel = 'Bundle';
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link
                href={backPath}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to {backLabel}
            </Link>

            <div className="bg-card border border-border rounded-xl p-5 md:p-8 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 bg-muted text-muted-foreground overflow-hidden">
                        {listing.icon_url ? (
                            <img
                                src={listing.icon_url}
                                alt={listing.display_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {listing.category && (
                                <Badge variant="secondary" className="text-xs">
                                    {listing.category}
                                </Badge>
                            )}
                            <Badge
                                variant="outline"
                                className="text-xs gap-1 border-lc-blue/40 text-lc-blue"
                            >
                                <Icon className="w-3 h-3" /> {kindLabel}
                            </Badge>
                        </div>
                        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground break-words">
                            {listing.display_name}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">{listing.tagline}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <InstallActions
                            ecosystemId={ecosystemId}
                            itemId={listing.listing_id}
                            itemName={listing.display_name}
                            category={listing.category}
                            isInstalled={isInstalled}
                            existingIntentId={activeIntent?.intentId}
                            onChanged={loadData}
                        />
                    </div>
                </div>
            </div>

            {listing.full_description && (
                <section className="bg-card border border-border rounded-xl p-6 shadow-card">
                    <h2 className="font-display text-lg font-bold text-foreground mb-3">About</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {listing.full_description}
                    </p>
                </section>
            )}

            <section className="bg-card border border-border rounded-xl p-6 shadow-card">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">Versions</h2>
                {versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No versions available.</p>
                ) : (
                    <div className="space-y-2">
                        {versions.map(v => (
                            <div
                                key={v.version_id}
                                className="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-3 border"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm text-foreground">
                                            v{v.version}
                                        </p>
                                        {v.status === 'LISTED' && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] bg-background"
                                            >
                                                LISTED
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(v.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
