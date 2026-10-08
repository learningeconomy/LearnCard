import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/react';
import { alertCircleOutline, arrowBackOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';

import { getLogger, useDeviceTypeByWidth, useWallet } from 'learn-card-base';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { ListingDetailsFields, ListingIdentityFields, StandOutSection } from './ListingEditor';
import { StoreListingPreview } from './StoreListingPreview';
import { EMPTY_LISTING_DETAILS, listingToData, toListingUpdates } from './listingForm';
import type { ListingData } from './listingForm';
import { getFirstMissingField } from './listingValidation';
import type { ListingField } from './listingValidation';
import { DEFAULT_APP_ICON_URL } from './constants';

const log = getLogger('edit-listing');

const AUTOSAVE_DELAY_MS = 800;

const EMPTY_LISTING: ListingData = {
    ...EMPTY_LISTING_DETAILS,
    name: '',
    tagline: '',
    iconUrl: DEFAULT_APP_ICON_URL,
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_STATUS_TEXT: Record<SaveState, string> = {
    idle: '',
    saving: 'Saving…',
    saved: 'All changes saved',
    error: "Couldn't save. We'll try again when you edit.",
};

export const EditListingPage: React.FC = () => {
    const history = useHistory();
    const { integrationId, listingId } = useParams<{ integrationId: string; listingId: string }>();
    const { initWallet } = useWallet();
    const { useUpdateListing, useSubmitForReview } = useDeveloperPortal();
    const { mutateAsync: saveListing } = useUpdateListing();
    const { mutateAsync: submitListingForReview } = useSubmitForReview();
    const { isDesktop } = useDeviceTypeByWidth();

    const { data: listing, isLoading } = useQuery({
        queryKey: ['developer', 'listing', 'owned', listingId],
        queryFn: async () => {
            const wallet = await initWallet();
            return (await wallet.invoke.getAppStoreListing(listingId)) ?? null;
        },
        enabled: Boolean(listingId),
    });

    const [data, setData] = useState<ListingData>(EMPTY_LISTING);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showMissingHint, setShowMissingHint] = useState(false);
    const hasEditedRef = useRef(false);
    const loadedListingIdRef = useRef<string | null>(null);

    const iconRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const taglineRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const privacyPolicyInputRef = useRef<HTMLInputElement>(null);
    const termsInputRef = useRef<HTMLInputElement>(null);
    const contactEmailInputRef = useRef<HTMLInputElement>(null);
    const promoVideoInputRef = useRef<HTMLInputElement>(null);
    const heroColorInputRef = useRef<HTMLInputElement>(null);
    const optionalFieldRefs = {
        privacyPolicyUrl: privacyPolicyInputRef,
        termsUrl: termsInputRef,
        contactEmail: contactEmailInputRef,
        promoVideoUrl: promoVideoInputRef,
        heroColor: heroColorInputRef,
    };

    const isDraft = listing?.app_listing_status === 'DRAFT';
    const dashboardPath = `/app-store/developer/integrations/${integrationId}`;

    useEffect(() => {
        if (!listing || loadedListingIdRef.current === listing.listing_id) return;
        loadedListingIdRef.current = listing.listing_id;
        setData(listingToData(listing));
    }, [listing]);

    const updateData = (updates: Partial<ListingData>) => {
        hasEditedRef.current = true;
        setData(prev => ({ ...prev, ...updates }));
    };

    useEffect(() => {
        if (!hasEditedRef.current) return;

        const timer = setTimeout(async () => {
            setSaveState('saving');
            try {
                await saveListing({ listingId, updates: toListingUpdates(data) });
                setSaveState('saved');
            } catch (e) {
                log.warn('listing.autosave.failed', e, { listingId });
                setSaveState('error');
            }
        }, AUTOSAVE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [data, listingId, saveListing]);

    const missingField = useMemo(
        () => getFirstMissingField({ ...data, needsProductionUrl: false, productionUrl: '' }),
        [data]
    );

    const focusField = (field: ListingField) => {
        const refs: Partial<Record<ListingField, React.RefObject<HTMLElement>>> = {
            icon: iconRef,
            name: nameRef,
            tagline: taglineRef,
            description: descriptionRef,
            ...optionalFieldRefs,
        };
        const element = refs[field]?.current;
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.focus({ preventScroll: true });
    };

    const handlePrimaryAction = async () => {
        if (!isDraft) {
            history.push(dashboardPath);
            return;
        }
        if (missingField) {
            setShowMissingHint(true);
            focusField(missingField.field);
            return;
        }

        setIsSubmitting(true);
        setFormError(null);
        try {
            await saveListing({ listingId, integrationId, updates: toListingUpdates(data) });
            await submitListingForReview(listingId);
            history.push(dashboardPath);
        } catch (e) {
            log.error('listing.submit.failed', e, { listingId });
            setFormError("We couldn't submit your app. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <IonPage>
                <AppStoreHeader title="Edit listing" />
                <IonContent>
                    <div className="flex items-center justify-center h-full">
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!listing) {
        return (
            <IonPage>
                <AppStoreHeader title="Edit listing" />
                <IonContent>
                    <div className="max-w-md mx-auto mt-16 p-6 text-center font-poppins">
                        <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                            We couldn't find this listing
                        </h1>
                        <button
                            type="button"
                            onClick={() => history.push(dashboardPath)}
                            className="mt-4 py-3 px-6 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            Back to Your App
                        </button>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const preview = (
        <StoreListingPreview
            name={data.name}
            tagline={data.tagline}
            description={data.description}
            iconUrl={data.iconUrl}
            category={data.category}
            ageRating={data.ageRating}
            screenshots={data.screenshots}
            highlights={data.highlights}
            heroColor={data.heroColor}
        />
    );

    return (
        <IonPage>
            <AppStoreHeader title="Edit listing" />
            <IonContent>
                <div className="flex min-h-full font-poppins">
                    <div className={`flex-1 ${isDesktop ? 'p-6' : 'ion-padding'}`}>
                        <div className="max-w-xl mx-auto w-full">
                            <button
                                type="button"
                                onClick={() => history.push(dashboardPath)}
                                className="mt-2 mb-6 flex items-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                <IonIcon icon={arrowBackOutline} />
                                Back to your app
                            </button>

                            {formError && (
                                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                    <IonIcon
                                        icon={alertCircleOutline}
                                        className="text-red-400 text-lg mt-0.5 shrink-0"
                                    />
                                    <span className="text-sm text-red-700 leading-relaxed">
                                        {formError}
                                    </span>
                                </div>
                            )}

                            <div className="bg-white rounded-[20px] border border-grayscale-200 p-6 mb-6 space-y-5">
                                <h2 className="text-base font-semibold text-grayscale-900">
                                    Your listing
                                </h2>
                                <ListingIdentityFields
                                    data={data}
                                    onChange={updateData}
                                    iconRef={iconRef}
                                    nameRef={nameRef}
                                    taglineRef={taglineRef}
                                />
                                <ListingDetailsFields
                                    details={data}
                                    onChange={updateData}
                                    descriptionRef={descriptionRef}
                                />
                            </div>

                            <StandOutSection
                                details={data}
                                onChange={updateData}
                                fieldRefs={optionalFieldRefs}
                            />

                            {!isDesktop && <div className="mt-6">{preview}</div>}

                            <div
                                className="sticky bottom-0 z-10 mt-6 pt-3 bg-gradient-to-t from-white via-white to-white/0"
                                style={{
                                    paddingBottom: 'calc(1rem + var(--ion-safe-area-bottom, 0px))',
                                }}
                            >
                                <div className="flex items-center gap-4 p-4 bg-white rounded-[20px] border border-grayscale-200 shadow-lg">
                                    <div className="flex-1 min-w-0 text-sm">
                                        {isDraft && showMissingHint && missingField ? (
                                            <button
                                                type="button"
                                                onClick={() => focusField(missingField.field)}
                                                className="text-left font-medium text-grayscale-900 hover:underline"
                                            >
                                                {missingField.message}
                                            </button>
                                        ) : (
                                            <span
                                                className={
                                                    saveState === 'error'
                                                        ? 'text-red-600'
                                                        : 'text-grayscale-500'
                                                }
                                            >
                                                {SAVE_STATUS_TEXT[saveState]}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePrimaryAction}
                                        disabled={isSubmitting}
                                        className="py-3 px-5 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Submitting…
                                            </>
                                        ) : isDraft ? (
                                            'Submit for Review'
                                        ) : (
                                            'Done'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isDesktop && (
                        <div className="w-1/2 max-w-2xl shrink-0 bg-grayscale-10 border-l border-grayscale-200">
                            <div className="sticky top-0 h-[calc(100vh-80px)] overflow-y-auto p-6">
                                <p className="text-xs font-medium text-grayscale-500 mb-3 text-center">
                                    How it looks in the store
                                </p>
                                {preview}
                            </div>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default EditListingPage;
