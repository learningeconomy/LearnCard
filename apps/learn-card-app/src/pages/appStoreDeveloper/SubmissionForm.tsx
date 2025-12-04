import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { ArrowLeft, ArrowRight, Send, Loader2, AlertCircle, Save, FileEdit } from 'lucide-react';

import { useDeveloperPortal } from './useDeveloperPortal';
import { StepIndicator } from './components/StepIndicator';
import { AppDetailsStep } from './components/AppDetailsStep';
import { LaunchTypeStep } from './components/LaunchTypeStep';
import { LaunchConfigStep } from './components/LaunchConfigStep';
import { ReviewStep } from './components/ReviewStep';
import { AppStoreHeader } from './components/AppStoreHeader';
import type { AppStoreListingCreate, ExtendedAppStoreListing } from './types';

const STEPS = [
    { id: 1, title: 'App Details', description: 'Basic information about your app' },
    { id: 2, title: 'Launch Type', description: 'How your app integrates' },
    { id: 3, title: 'Configuration', description: 'Technical settings' },
    { id: 4, title: 'Review', description: 'Submit for approval' },
];

interface LocationState {
    listing?: ExtendedAppStoreListing;
}

const SubmissionForm: React.FC = () => {
    const history = useHistory();
    const location = useLocation<LocationState>();
    const { listingId } = useParams<{ listingId?: string }>();

    const searchParams = new URLSearchParams(location.search);
    const integrationId = searchParams.get('integrationId');
    const isEditMode = !!listingId;

    // Get listing from route state (passed from DeveloperPortal) or fetch if not available
    const listingFromState = location.state?.listing;

    const { useListing, useCreateListing, useUpdateListing, useSubmitForReview } = useDeveloperPortal();
    const { data: fetchedListing, isLoading: isLoadingListing } = useListing(
        listingFromState ? null : (listingId || null) // Only fetch if not passed via state
    );

    // Use listing from state first, fall back to fetched
    const existingListing = listingFromState || fetchedListing;

    const createMutation = useCreateListing();
    const updateMutation = useUpdateListing();
    const submitMutation = useSubmitForReview();

    const isPendingReview = existingListing?.app_listing_status === 'PENDING_REVIEW';

    const initialFormData = useMemo<Partial<AppStoreListingCreate>>(() => {
        if (!existingListing) return {};
        const listing = existingListing as ExtendedAppStoreListing;
        return {
            display_name: listing.display_name,
            tagline: listing.tagline,
            full_description: listing.full_description,
            icon_url: listing.icon_url,
            launch_type: listing.launch_type,
            launch_config_json: listing.launch_config_json,
            category: listing.category,
            promo_video_url: listing.promo_video_url,
            privacy_policy_url: listing.privacy_policy_url,
            terms_url: listing.terms_url,
            ios_app_store_id: listing.ios_app_store_id,
            android_app_store_id: listing.android_app_store_id,
            highlights: listing.highlights,
            screenshots: listing.screenshots,
        };
    }, [existingListing]);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<Partial<AppStoreListingCreate>>(initialFormData);

    useEffect(() => {
        setFormData(initialFormData);
        setCurrentStep(1);
        setIsSubmitted(false);
        setIsDraftSaved(false);
        setSubmitError(null);
    }, [initialFormData]);

    const handleFormChange = (newData: Partial<AppStoreListingCreate>) => setFormData(newData);
    const hasMinimumDataForDraft = useCallback(() => !!(formData.display_name?.trim()), [formData.display_name]);

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        if (step === 1) {
            if (!formData.display_name?.trim()) newErrors.display_name = 'Display name is required';
            if (!formData.tagline?.trim()) newErrors.tagline = 'Tagline is required';
            if (!formData.full_description?.trim()) newErrors.full_description = 'Description is required';
            if (!formData.icon_url?.trim()) newErrors.icon_url = 'Icon URL is required';
        }
        if (step === 3) {
            let config: Record<string, unknown> = {};
            try { config = formData.launch_config_json ? JSON.parse(formData.launch_config_json) : {}; } catch {}
            if (['EMBEDDED_IFRAME', 'SECOND_SCREEN', 'DIRECT_LINK'].includes(formData.launch_type || '') && !config.url) newErrors.url = 'URL is required';
            if (formData.launch_type === 'CONSENT_REDIRECT') {
                if (!config.contractUri) newErrors.contractUri = 'Contract URI is required';
                if (!config.redirectUri) newErrors.redirectUri = 'Redirect URI is required';
            }
            if (formData.launch_type === 'SERVER_HEADLESS' && !config.webhookUrl) newErrors.webhookUrl = 'Webhook URL is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, STEPS.length)); };
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const handleBackToDashboard = () => history.push('/app-store/developer');

    const saveDraft = async (): Promise<boolean> => {
        if (!integrationId && !isEditMode) { setSubmitError('Please select an integration first'); return false; }
        if (!hasMinimumDataForDraft()) { setSubmitError('Please enter at least a display name'); return false; }
        setIsSavingDraft(true); setSubmitError(null);
        try {
            const listingData = {
                display_name: formData.display_name!, tagline: formData.tagline || 'Draft listing',
                full_description: formData.full_description || 'Draft', icon_url: formData.icon_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Draft',
                launch_type: formData.launch_type || 'DIRECT_LINK', launch_config_json: formData.launch_config_json || '{}',
                category: formData.category, promo_video_url: formData.promo_video_url, privacy_policy_url: formData.privacy_policy_url,
                terms_url: formData.terms_url, ios_app_store_id: formData.ios_app_store_id, android_app_store_id: formData.android_app_store_id,
                highlights: formData.highlights, screenshots: formData.screenshots,
            };
            if (isEditMode && listingId) await updateMutation.mutateAsync({ listingId, updates: listingData });
            else if (integrationId) await createMutation.mutateAsync({ integrationId, listing: listingData });
            setIsSavingDraft(false); setIsDraftSaved(true); return true;
        } catch (error) { setSubmitError(error instanceof Error ? error.message : 'Failed to save draft'); setIsSavingDraft(false); return false; }
    };

    const handleSaveDraft = async () => { const success = await saveDraft(); if (success) setTimeout(() => handleBackToDashboard(), 1500); };

    const handleSubmit = async () => {
        if (!integrationId && !isEditMode) { setSubmitError('Please select an integration first'); return; }
        setIsSubmitting(true); setSubmitError(null);
        try {
            let newListingId: string;
            const listingData = {
                display_name: formData.display_name!, tagline: formData.tagline!, full_description: formData.full_description!,
                icon_url: formData.icon_url!, launch_type: formData.launch_type!, launch_config_json: formData.launch_config_json || '{}',
                category: formData.category, promo_video_url: formData.promo_video_url, privacy_policy_url: formData.privacy_policy_url,
                terms_url: formData.terms_url, ios_app_store_id: formData.ios_app_store_id, android_app_store_id: formData.android_app_store_id,
                highlights: formData.highlights, screenshots: formData.screenshots,
            };
            if (isEditMode && listingId) { await updateMutation.mutateAsync({ listingId, updates: listingData }); newListingId = listingId; }
            else if (integrationId) { newListingId = await createMutation.mutateAsync({ integrationId, listing: listingData }); }
            else throw new Error('No integration selected');
            await submitMutation.mutateAsync(newListingId);
            setIsSubmitting(false); setIsSubmitted(true);
        } catch (error) { setSubmitError(error instanceof Error ? error.message : 'Failed to submit listing'); setIsSubmitting(false); }
    };

    // Only show loading if we're fetching (no listing from state and still loading)
    if (isEditMode && !listingFromState && isLoadingListing) return <IonPage><IonContent className="ion-padding"><div className="flex justify-center items-center h-full"><IonSpinner name="crescent" /></div></IonContent></IonPage>;

    if (isDraftSaved) return (
        <IonPage>
            <AppStoreHeader title={isEditMode ? 'Edit App' : 'Create App'} />
            <IonContent className="ion-padding">
                <div className="max-w-lg mx-auto text-center py-12">
                    <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center ${isPendingReview ? 'bg-amber-100' : 'bg-cyan-100'}`}><FileEdit className={`w-8 h-8 ${isPendingReview ? 'text-amber-600' : 'text-cyan-600'}`} /></div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">{isPendingReview ? 'Changes Saved!' : isEditMode ? 'Draft Updated!' : 'Draft Saved!'}</h2>
                    <p className="text-gray-500 text-sm mb-6">Your app "{formData.display_name}" has been {isEditMode ? 'updated' : 'saved as a draft'}.</p>
                    <button onClick={handleBackToDashboard} className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors">View My Listings</button>
                </div>
            </IonContent>
        </IonPage>
    );

    if (isSubmitted) return (
        <IonPage>
            <AppStoreHeader title="Submission Received" />
            <IonContent className="ion-padding">
                <div className="max-w-lg mx-auto text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-5 bg-emerald-100 rounded-full flex items-center justify-center"><Send className="w-8 h-8 text-emerald-600" /></div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Submission Received!</h2>
                    <p className="text-gray-500 text-sm mb-6">Your app "{formData.display_name}" has been submitted for review.</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={handleBackToDashboard} className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors">View My Listings</button>
                        <button onClick={() => { setIsSubmitted(false); setCurrentStep(1); setFormData({}); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Submit Another App</button>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );

    return (
        <IonPage>
            <AppStoreHeader title={isEditMode ? 'Edit App' : 'Create New App'} />
            <IonContent className="ion-padding">
                <div className="max-w-2xl mx-auto pb-8">
                    <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5 text-sm"><ArrowLeft className="w-4 h-4" />Back to Dashboard</button>
                    <div className="mb-8"><StepIndicator steps={STEPS} currentStep={currentStep} /></div>
                    {submitError && <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-red-800">Error</p><p className="text-sm text-red-700 mt-0.5">{submitError}</p></div></div>}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[450px]">
                        {currentStep === 1 && <AppDetailsStep data={formData} onChange={handleFormChange} errors={errors} />}
                        {currentStep === 2 && <LaunchTypeStep data={formData} onChange={handleFormChange} />}
                        {currentStep === 3 && <LaunchConfigStep data={formData} onChange={handleFormChange} errors={errors} />}
                        {currentStep === 4 && <ReviewStep data={formData} />}
                    </div>
                    <div className="flex justify-between mt-6">
                        <button onClick={handleBack} disabled={currentStep === 1} className={`flex items-center gap-2 px-4 py-2 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}><ArrowLeft className="w-4 h-4" />Back</button>
                        <div className="flex gap-3">
                            {hasMinimumDataForDraft() && <button onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 ${isPendingReview ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{isSavingDraft ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />{isPendingReview ? 'Save Changes' : isEditMode ? 'Update Draft' : 'Save Draft'}</>}</button>}
                            {currentStep < STEPS.length ? <button onClick={handleNext} disabled={currentStep === 2 && !formData.launch_type} className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50">Continue<ArrowRight className="w-4 h-4" /></button> : !isPendingReview && <button onClick={handleSubmit} disabled={isSubmitting || isSavingDraft} className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 min-w-[160px] justify-center">{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <>Submit for Review<Send className="w-4 h-4" /></>}</button>}
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SubmissionForm;
