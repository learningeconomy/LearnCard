import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Package } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { InstallActions } from '../components/catalog/InstallActions';
import { EnableActions } from '../components/catalog/EnableActions';
import { PageSkeleton } from '../components/PageSkeleton';
import { ClampText } from '../components/ClampText';
import {
    getCatalogBundleMembers,
    getCatalogEnablement,
    getCatalogListing,
    type CatalogBundleMember,
    type CatalogEnablement,
    type CatalogListing,
    type DashboardSession,
} from '../api';
import { trpc } from '../trpc';
import type { InstallIntent } from '@learncard/types';

// ADR-008 install targets → the prototype's catalog section labels (same map as
// Bundles.tsx), plus the prototype's per-section badge colors.
const SECTION_BY_TARGET_TYPE: Record<string, { label: string; color: string; path: string }> = {
    WORKLOAD_DEPLOYMENT: {
        label: 'Infrastructure',
        color: 'bg-emerald/10 text-emerald',
        path: '/plugins',
    },
    REGISTRY_SUBSCRIPTION: {
        label: 'Trust Registries',
        color: 'bg-violet/10 text-violet',
        path: '/trust-registries',
    },
    APP_AVAILABILITY: {
        label: 'User Apps',
        color: 'bg-lc-cyan/10 text-lc-cyan',
        path: '/apps',
    },
    WALLET_ENABLEMENT: {
        label: 'Wallets',
        color: 'bg-lc-blue/10 text-lc-blue',
        path: '/wallets',
    },
    INTEGRATION_INSTALL: {
        label: 'Integrations',
        color: 'bg-gold/10 text-gold',
        path: '/integrations',
    },
};

const SECTION_ORDER = Object.values(SECTION_BY_TARGET_TYPE).map(section => section.label);

interface BundleDetailProps {
    session: DashboardSession;
}

export function BundleDetail({ session }: BundleDetailProps) {
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [listing, setListing] = useState<CatalogListing | null>(null);
    const [members, setMembers] = useState<CatalogBundleMember[]>([]);
    const [memberListings, setMemberListings] = useState<Record<string, CatalogListing>>({});
    const [intents, setIntents] = useState<InstallIntent[]>([]);
    const [enablement, setEnablement] = useState<CatalogEnablement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;

    const loadData = useCallback(async () => {
        if (!id || !ecosystemId) return;
        setError(null);
        try {
            const [listingRes, intentsRes, enablementRes, membersRes] = await Promise.all([
                getCatalogListing({ listingId: id }),
                trpc.installIntents.listInstallIntents.query({ ecosystemId }),
                getCatalogEnablement({ ecosystemId }),
                // A bundle without a valid signed manifest simply has no members
                // to show — the page degrades to the About tab rather than failing.
                getCatalogBundleMembers({ listingId: id }).catch(() => [] as CatalogBundleMember[]),
            ]);

            setListing(listingRes.listing);
            setIntents(intentsRes as InstallIntent[]);
            setEnablement(enablementRes);
            setMembers(membersRes);

            const details = await Promise.all(
                membersRes.map(async member => {
                    try {
                        const res = await getCatalogListing({ listingId: member.listingId });
                        return [member.listingId, res.listing] as const;
                    } catch {
                        return null;
                    }
                })
            );

            setMemberListings(
                Object.fromEntries(
                    details.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
                )
            );
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

    if (error || !listing || listing.kind !== 'BUNDLE') {
        return (
            <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
                <p className="text-muted-foreground">{error || 'Bundle not found.'}</p>
                <Link href="/bundles">
                    <Button variant="outline">Back to Bundles</Button>
                </Link>
            </div>
        );
    }

    const getActiveIntent = (listingId: string) =>
        intents.find(i => i.proposal.source.listingId === listingId && i.status?.phase === 'READY');

    const bundleIntent = getActiveIntent(listing.listing_id);
    const bundleInstalled = !!bundleIntent;

    // ADR-008: a READY bundle intent pins all of its required members, so a
    // member counts as installed when it has its own READY intent or the
    // covering bundle intent exists (optional members need their own intent).
    const isMemberInstalled = (member: CatalogBundleMember) =>
        !!getActiveIntent(member.listingId) || (bundleInstalled && !member.optional);

    const installedCount = members.filter(isMemberInstalled).length;

    // ADR-010 §3.2: an absent allowlist is implicitly permissive, so nothing is
    // individually enabled until the operator makes the first explicit enablement.
    const isEnabled = (listingId: string) =>
        enablement?.allowedListings?.includes(listingId) ?? false;

    const sections = SECTION_ORDER.filter(label =>
        members.some(member => SECTION_BY_TARGET_TYPE[member.targetType]?.label === label)
    );

    const includedLabel =
        installedCount > 0 ? `${installedCount}/${members.length}` : `${members.length}`;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Link href="/bundles">
                <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
                    <ArrowLeft className="w-4 h-4" /> Bundles
                </Button>
            </Link>

            <div className="rounded-xl border border-border overflow-hidden bg-gradient-to-br from-lc-blue/25 to-lc-pink/10">
                <div className="p-5 md:p-7 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-background/70 flex items-center justify-center shrink-0 overflow-hidden">
                        {listing.icon_url ? (
                            <img
                                src={listing.icon_url}
                                alt={listing.display_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package className="w-8 h-8 text-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                            {listing.display_name}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">{listing.tagline}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {sections.map(label => (
                                <Badge key={label} variant="secondary" className="text-xs">
                                    {label}
                                </Badge>
                            ))}
                            {members.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    {installedCount > 0
                                        ? `${installedCount}/${members.length} items installed`
                                        : `${members.length} items`}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 sm:min-w-[280px]">
                        <div className="flex gap-2">
                            <EnableActions
                                ecosystemId={ecosystemId}
                                listingId={listing.listing_id}
                                itemName={listing.display_name}
                                enabled={isEnabled(listing.listing_id)}
                                unrestricted={enablement?.unrestricted ?? true}
                                onChanged={loadData}
                            />
                            <InstallActions
                                ecosystemId={ecosystemId}
                                itemId={listing.listing_id}
                                itemName={listing.display_name}
                                category={listing.category}
                                isInstalled={bundleInstalled}
                                existingIntentId={bundleIntent?.intentId}
                                className="flex-1"
                                onChanged={loadData}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="included">
                <TabsList>
                    <TabsTrigger value="included">Included ({includedLabel})</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>

                <TabsContent value="included" className="mt-4">
                    {members.length === 0 ? (
                        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                            This bundle has no signed member manifest yet.
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3">
                            {members.map(member => {
                                const section = SECTION_BY_TARGET_TYPE[member.targetType];
                                const memberListing = memberListings[member.listingId];
                                const installed = isMemberInstalled(member);
                                const memberIntent = getActiveIntent(member.listingId);
                                const name =
                                    member.display_name ??
                                    memberListing?.display_name ??
                                    member.listingId;
                                const detailPath =
                                    memberListing?.kind === 'INTEGRATION'
                                        ? `/integrations/${member.listingId}`
                                        : memberListing?.kind === 'WALLET'
                                        ? `/wallets/${member.listingId}`
                                        : memberListing?.kind === 'BUNDLE'
                                        ? `/bundles/${member.listingId}`
                                        : `/apps/${member.listingId}`;

                                return (
                                    <div
                                        key={member.declarationId}
                                        className={`bg-card border rounded-xl p-4 ${
                                            installed ? 'border-emerald/30' : 'border-border'
                                        }`}
                                    >
                                        <div className="mb-2.5 flex items-center gap-1.5 flex-wrap">
                                            {section && (
                                                <Badge
                                                    className={`text-[10px] ${section.color} border-0`}
                                                >
                                                    {section.label}
                                                </Badge>
                                            )}
                                            {member.optional && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    Optional
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                                                    section?.color ??
                                                    'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {memberListing?.icon_url ? (
                                                    <img
                                                        src={memberListing.icon_url}
                                                        alt={name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={detailPath}
                                                    className="font-medium text-sm text-foreground hover:text-primary"
                                                >
                                                    {name}
                                                </Link>
                                                {memberListing && (
                                                    <div className="mt-1">
                                                        <ClampText
                                                            text={
                                                                memberListing.tagline ||
                                                                memberListing.full_description
                                                            }
                                                            className="text-xs text-muted-foreground"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <EnableActions
                                                ecosystemId={ecosystemId}
                                                listingId={member.listingId}
                                                itemName={name}
                                                enabled={isEnabled(member.listingId)}
                                                unrestricted={enablement?.unrestricted ?? true}
                                                onChanged={loadData}
                                            />
                                            <InstallActions
                                                ecosystemId={ecosystemId}
                                                itemId={member.listingId}
                                                itemName={name}
                                                category={memberListing?.category}
                                                isInstalled={installed}
                                                existingIntentId={memberIntent?.intentId}
                                                className="flex-1"
                                                onChanged={loadData}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="about" className="mt-4">
                    <div className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-3 max-w-3xl">
                        <h2 className="font-display font-bold text-foreground">
                            About {listing.display_name}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {listing.full_description || listing.tagline}
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
