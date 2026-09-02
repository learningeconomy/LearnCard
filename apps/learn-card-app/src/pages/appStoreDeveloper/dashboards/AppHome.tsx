import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, chevronForwardOutline } from 'ionicons/icons';
import type {
    LCNIntegration,
    AppStoreListing,
    CapturedTemplateRecord,
    CapturedConsentRecord,
} from '@learncard/types';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { ManifestDiffPanel } from './components/ManifestDiffPanel';
import { AppPreviewModal } from '../components/AppPreviewModal';
import { useModal, ModalTypes, getLogger } from 'learn-card-base';

const log = getLogger('app-home');

const PERSONAL_FIELD_LABELS: Record<string, string> = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    birthDate: 'Birth date',
    country: 'Country',
    avatar: 'Profile photo',
};

interface AppHomeProps {
    integration: LCNIntegration;
    onBack?: () => void;
    onToggleAdvanced: () => void;
}

export const AppHome: React.FC<AppHomeProps> = ({ integration, onBack, onToggleAdvanced }) => {
    const history = useHistory();
    const {
        useListingsForIntegration,
        useManifestVersions,
        useManifestVersion,
        useManifestDiff,
        useApplyManifestVersion,
        useSubmitForReview,
    } = useDeveloperPortal();

    const {
        data: listings,
        isLoading: isLoadingListings,
        error: listingsError,
    } = useListingsForIntegration(integration.id);
    const {
        data: manifestVersionsData,
        isLoading: isLoadingVersions,
        error: versionsError,
    } = useManifestVersions(integration.id);

    const applyManifestMutation = useApplyManifestVersion();
    const submitForReviewMutation = useSubmitForReview();

    const [isDiffExpanded, setIsDiffExpanded] = useState(false);
    const [isShipping, setIsShipping] = useState(false);
    const [shipError, setShipError] = useState<string | null>(null);
    const { newModal } = useModal();

    const latestListing = listings?.[0]; // Assuming the first one is the latest/only one for embed-app

    const manifestVersions = manifestVersionsData?.records || [];
    const latestVersionRecord =
        manifestVersions.length > 0
            ? manifestVersions.reduce((prev, current) =>
                  prev.version > current.version ? prev : current
              )
            : null;
    const activeVersionRecord = manifestVersions.find(v => v.status === 'active');

    const latestVersion = latestVersionRecord?.version ?? null;
    const activeVersion = activeVersionRecord?.version ?? null;

    const { data: latestManifestData, isLoading: isLoadingLatestManifest } = useManifestVersion(
        integration.id,
        latestVersion
    );
    const { data: diffData, isLoading: isLoadingDiff } = useManifestDiff(
        integration.id,
        latestVersion,
        activeVersion
    );

    const isLoading =
        isLoadingListings || isLoadingVersions || isLoadingLatestManifest || isLoadingDiff;
    const error = listingsError || versionsError;

    const hasNewerDraft =
        latestVersionRecord &&
        activeVersionRecord &&
        latestVersionRecord.version > activeVersionRecord.version &&
        latestVersionRecord.status === 'draft';
    const isDraftOnly =
        latestVersionRecord && !activeVersionRecord && latestVersionRecord.status === 'draft';
    const hasDraft = hasNewerDraft || isDraftOnly;

    const getEnvironmentPill = () => {
        if (!latestVersionRecord) return null;
        if (hasDraft) {
            return (
                <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Development
                </span>
            );
        }
        if (
            latestVersionRecord.status === 'active' &&
            latestListing?.app_listing_status === 'LISTED'
        ) {
            return (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Live
                </span>
            );
        }
        return null;
    };

    const getListingCompleteness = (listing: AppStoreListing | undefined) => {
        if (!listing) return 0;
        let count = 0;
        if (listing.display_name) count++;
        if (listing.tagline) count++;
        if (listing.full_description) count++;
        if (listing.icon_url) count++;
        if (listing.screenshots && listing.screenshots.length > 0) count++;
        return count;
    };

    const listingCompleteness = getListingCompleteness(latestListing);

    const handleShip = async () => {
        if (!latestVersionRecord || !latestListing) return;
        setIsShipping(true);
        setShipError(null);
        try {
            if (hasDraft) {
                await applyManifestMutation.mutateAsync({
                    integrationId: integration.id,
                    version: latestVersionRecord.version,
                    listingId: latestListing.listing_id,
                });
            }
            if (latestListing.app_listing_status === 'DRAFT') {
                await submitForReviewMutation.mutateAsync(latestListing.listing_id);
            }
        } catch (e) {
            log.error('app-home.ship-failed', e);
            setShipError('Failed to ship your app. Please try again.');
        } finally {
            setIsShipping(false);
        }
    };

    const handlePreview = () => {
        if (!latestListing) return;
        newModal(
            <AppPreviewModal listing={latestListing} />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const renderStatusSpine = () => {
        const steps = [
            {
                id: 'built',
                title: 'Built',
                detail: latestVersionRecord
                    ? `v${latestVersionRecord.version} · ${new Date(
                          latestVersionRecord.createdAt
                      ).toLocaleDateString()}`
                    : 'No builds yet',
                isDone: !!latestVersionRecord,
                action: (
                    <div className="flex items-center gap-2">
                        {latestVersionRecord && (
                            <button
                                onClick={() =>
                                    history.push(
                                        `/app-store/developer/apps/${integration.id}/publish`
                                    )
                                }
                                className="py-2 px-4 rounded-[20px] text-grayscale-600 font-medium text-sm hover:text-grayscale-900 transition-colors"
                            >
                                View capabilities →
                            </button>
                        )}
                        {hasDraft && diffData && (
                            <button
                                onClick={() => setIsDiffExpanded(!isDiffExpanded)}
                                className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            >
                                {isDiffExpanded ? 'Hide changes' : 'View changes'}
                            </button>
                        )}
                    </div>
                ),
                expandedContent:
                    isDiffExpanded && diffData ? (
                        <div className="mt-4 p-4 bg-white rounded-[20px] border border-grayscale-200">
                            <ManifestDiffPanel diff={diffData} />
                        </div>
                    ) : null,
            },
            {
                id: 'previewed',
                title: 'Previewed',
                detail: latestListing ? 'App listing created' : 'Not previewed yet',
                isDone: !!latestListing,
                action: latestListing ? (
                    <button
                        onClick={handlePreview}
                        className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Preview
                    </button>
                ) : null,
            },
            {
                id: 'listing',
                title: 'Listing',
                detail: latestListing ? `${listingCompleteness} of 5 complete` : '0 of 5 complete',
                isDone: listingCompleteness === 5,
                action: latestListing ? (
                    <button
                        onClick={() =>
                            history.push(
                                `/app-store/developer/integrations/${integration.id}/apps/${latestListing.listing_id}`
                            )
                        }
                        className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Edit listing
                    </button>
                ) : null,
            },
            {
                id: 'shipped',
                title: 'Shipped',
                detail:
                    latestListing?.app_listing_status === 'LISTED'
                        ? 'Live in App Store'
                        : latestListing?.app_listing_status === 'PENDING_REVIEW'
                        ? 'In review'
                        : 'Not submitted',
                isDone: latestListing?.app_listing_status === 'LISTED',
                action:
                    hasDraft || latestListing?.app_listing_status === 'DRAFT' ? (
                        <button
                            onClick={handleShip}
                            disabled={isShipping || !latestListing}
                            className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isShipping
                                ? 'Shipping...'
                                : hasDraft
                                ? `Apply & Ship v${latestVersionRecord?.version}`
                                : 'Submit for review'}
                        </button>
                    ) : null,
            },
        ];

        return (
            <div className="relative pl-4 border-l-2 border-grayscale-200 space-y-8 ml-2">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                        <div
                            className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                                step.isDone
                                    ? 'bg-grayscale-900 border-grayscale-900'
                                    : 'bg-white border-grayscale-300'
                            }`}
                        />
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-grayscale-900">
                                    {step.title}
                                </h3>
                                <p className="text-xs text-grayscale-500 mt-0.5">{step.detail}</p>
                            </div>
                            {step.action && <div className="ml-4 shrink-0">{step.action}</div>}
                        </div>
                        {step.expandedContent}
                    </div>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto p-6 font-poppins space-y-8 animate-pulse">
                <div className="h-16 bg-grayscale-100 rounded-2xl w-full" />
                <div className="space-y-8 pl-4 border-l-2 border-grayscale-100 ml-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="h-4 bg-grayscale-100 rounded w-24" />
                                <div className="h-3 bg-grayscale-100 rounded w-32" />
                            </div>
                            <div className="h-9 bg-grayscale-100 rounded-[20px] w-24" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 font-poppins relative">
            <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
                <button
                    onClick={onToggleAdvanced}
                    className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    Advanced view
                </button>
            </div>

            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">
                        Failed to load app data. Please try again.
                    </span>
                </div>
            )}

            {shipError && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">{shipError}</span>
                </div>
            )}

            <div className="flex items-center gap-4 mb-10">
                {latestListing?.icon_url ? (
                    <img
                        src={latestListing.icon_url}
                        alt="App Icon"
                        className="w-16 h-16 rounded-2xl object-cover border border-grayscale-200"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-2xl bg-grayscale-100 border border-grayscale-200 flex items-center justify-center">
                        <span className="text-grayscale-400 text-xl font-semibold">
                            {integration.name.charAt(0)}
                        </span>
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-semibold text-grayscale-900 flex items-center gap-3">
                        {latestListing?.display_name || integration.name}
                        {getEnvironmentPill()}
                    </h1>
                    <p className="text-sm text-grayscale-500 mt-1">App Home</p>
                </div>
            </div>

            <div className="mb-12">{renderStatusSpine()}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[20px] border border-grayscale-200 p-5">
                    <h3 className="text-sm font-medium text-grayscale-900 mb-1">
                        Credentials your app issues
                    </h3>
                    <p className="text-xs text-grayscale-400 mb-4">
                        Defined in your app's code — updates automatically
                    </p>

                    {latestManifestData?.manifest?.templates &&
                    latestManifestData.manifest.templates.length > 0 ? (
                        <div className="space-y-2">
                            {latestManifestData.manifest.templates.map(
                                (t: CapturedTemplateRecord, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-2.5 bg-grayscale-10 rounded-xl"
                                    >
                                        <span className="text-sm text-grayscale-700 font-medium">
                                            {t.alias}
                                        </span>
                                        <span className="bg-grayscale-100 text-grayscale-700 text-xs rounded-full px-2 py-0.5">
                                            v{t.version}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-grayscale-500 italic">
                            No credentials defined yet.
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[20px] border border-grayscale-200 p-5">
                    <h3 className="text-sm font-medium text-grayscale-900 mb-1">
                        Data your app requests
                    </h3>
                    <p className="text-xs text-grayscale-400 mb-4">
                        Defined in your app's code — updates automatically
                    </p>

                    {latestManifestData?.manifest?.consentRequests &&
                    latestManifestData.manifest.consentRequests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {latestManifestData.manifest.consentRequests.map(
                                (c: CapturedConsentRecord, i: number) => (
                                    <React.Fragment key={i}>
                                        {(c.scopes.read?.personalFields ?? []).map(field => (
                                            <span
                                                key={`read-pf-${i}-${field}`}
                                                className="bg-grayscale-100 text-grayscale-700 text-xs rounded-full px-3 py-1.5"
                                            >
                                                Read: {PERSONAL_FIELD_LABELS[field] || field}
                                            </span>
                                        ))}
                                        {(c.scopes.read?.credentialCategories ?? []).map(cat => (
                                            <span
                                                key={`read-cat-${i}-${cat}`}
                                                className="bg-grayscale-100 text-grayscale-700 text-xs rounded-full px-3 py-1.5"
                                            >
                                                Read: {cat}
                                            </span>
                                        ))}
                                        {(c.scopes.write?.credentialCategories ?? []).map(cat => (
                                            <span
                                                key={`write-cat-${i}-${cat}`}
                                                className="bg-grayscale-100 text-grayscale-700 text-xs rounded-full px-3 py-1.5"
                                            >
                                                Write: {cat}
                                            </span>
                                        ))}
                                    </React.Fragment>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-grayscale-500 italic">
                            No data requested yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
