import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Send, Loader2, AlertCircle, Save, FileEdit } from 'lucide-react';
import type { AppStoreListingCreate } from '../../types/app-store';
import type { AppStoreListing } from '@learncard/types';
import { StepIndicator } from '../ui/StepIndicator';
import { AppDetailsStep } from './AppDetailsStep';
import { LaunchTypeStep } from './LaunchTypeStep';
import { LaunchConfigStep } from './LaunchConfigStep';
import { ReviewStep } from './ReviewStep';
import { useLearnCardStore } from '../../stores/learncard';

const STEPS = [
    { id: 1, title: 'App Details', description: 'Basic information about your app' },
    { id: 2, title: 'Launch Type', description: 'How your app integrates' },
    { id: 3, title: 'Configuration', description: 'Technical settings' },
    { id: 4, title: 'Review', description: 'Submit for approval' },
];

interface SubmissionFormProps {
    onSuccess?: () => void;
    onBack?: (hasChanges: boolean, onSave: () => Promise<boolean>, onDiscard: () => void) => void;
    editingListing?: AppStoreListing | null;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSuccess, onBack, editingListing }) => {
    const { learnCard, selectedIntegrationId, createListing, updateListing, submitForReview } = useLearnCardStore();

    const isEditMode = !!editingListing;
    const isPendingReview = editingListing?.app_listing_status === 'PENDING_REVIEW';

    // Initialize form data from editing listing
    const initialFormData = useMemo<Partial<AppStoreListingCreate>>(() => {
        if (!editingListing) return {};

        // Type assertion to access new fields until types are rebuilt
        const listing = editingListing as typeof editingListing & {
            highlights?: string[];
            screenshots?: string[];
        };

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
    }, [editingListing]);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<Partial<AppStoreListingCreate>>(initialFormData);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Reset form when editingListing changes
    useEffect(() => {
        setFormData(initialFormData);
        setHasUnsavedChanges(false);
        setCurrentStep(1);
        setIsSubmitted(false);
        setIsDraftSaved(false);
        setSubmitError(null);
    }, [initialFormData]);

    const handleFormChange = (newData: Partial<AppStoreListingCreate>) => {
        setFormData(newData);
        setHasUnsavedChanges(true);
    };

    const hasMinimumDataForDraft = useCallback(() => {
        return !!(formData.display_name?.trim());
    }, [formData.display_name]);

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.display_name?.trim()) {
                newErrors.display_name = 'Display name is required';
            }

            if (!formData.tagline?.trim()) {
                newErrors.tagline = 'Tagline is required';
            }

            if (!formData.full_description?.trim()) {
                newErrors.full_description = 'Description is required';
            }

            if (!formData.icon_url?.trim()) {
                newErrors.icon_url = 'Icon URL is required';
            }
        }

        if (step === 3) {
            let config: Record<string, unknown> = {};

            try {
                config = formData.launch_config_json
                    ? JSON.parse(formData.launch_config_json)
                    : {};
            } catch {
                // Keep empty
            }

            if (
                ['EMBEDDED_IFRAME', 'SECOND_SCREEN', 'DIRECT_LINK'].includes(
                    formData.launch_type || ''
                )
            ) {
                if (!config.url) {
                    newErrors.url = 'URL is required';
                }
            }

            if (formData.launch_type === 'CONSENT_REDIRECT') {
                if (!config.contractUri) {
                    newErrors.contractUri = 'Contract URI is required';
                }

                if (!config.redirectUri) {
                    newErrors.redirectUri = 'Redirect URI is required';
                }
            }

            if (formData.launch_type === 'SERVER_HEADLESS') {
                if (!config.webhookUrl) {
                    newErrors.webhookUrl = 'Webhook URL is required';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const saveDraft = async (): Promise<boolean> => {
        if (!learnCard || !selectedIntegrationId) {
            setSubmitError('Please connect and select an integration first');
            return false;
        }

        if (!hasMinimumDataForDraft()) {
            setSubmitError('Please enter at least a display name to save as draft');
            return false;
        }

        setIsSavingDraft(true);
        setSubmitError(null);

        try {
            if (isEditMode && editingListing) {
                // Update existing listing
                const updates = {
                    display_name: formData.display_name!,
                    tagline: formData.tagline || 'Draft listing',
                    full_description: formData.full_description || 'Draft - description pending',
                    icon_url: formData.icon_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Draft',
                    launch_type: formData.launch_type || 'DIRECT_LINK',
                    launch_config_json: formData.launch_config_json || '{}',
                    category: formData.category,
                    promo_video_url: formData.promo_video_url,
                    privacy_policy_url: formData.privacy_policy_url,
                    terms_url: formData.terms_url,
                    ios_app_store_id: formData.ios_app_store_id,
                    android_app_store_id: formData.android_app_store_id,
                    highlights: formData.highlights,
                    screenshots: formData.screenshots,
                };

                const success = await updateListing(editingListing.listing_id, updates);

                if (!success) {
                    throw new Error('Failed to update draft');
                }
            } else {
                // Create new listing
                const listingData = {
                    display_name: formData.display_name!,
                    tagline: formData.tagline || 'Draft listing',
                    full_description: formData.full_description || 'Draft - description pending',
                    icon_url: formData.icon_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Draft',
                    launch_type: formData.launch_type || 'DIRECT_LINK',
                    launch_config_json: formData.launch_config_json || '{}',
                    category: formData.category,
                    promo_video_url: formData.promo_video_url,
                    privacy_policy_url: formData.privacy_policy_url,
                    terms_url: formData.terms_url,
                    ios_app_store_id: formData.ios_app_store_id,
                    android_app_store_id: formData.android_app_store_id,
                    highlights: formData.highlights,
                    screenshots: formData.screenshots,
                };

                const listingId = await createListing(selectedIntegrationId, listingData);

                if (!listingId) {
                    throw new Error('Failed to save draft');
                }
            }

            setHasUnsavedChanges(false);
            setIsSavingDraft(false);
            setIsDraftSaved(true);
            return true;
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to save draft');
            setIsSavingDraft(false);
            return false;
        }
    };

    const handleSaveDraft = async () => {
        const success = await saveDraft();

        if (success) {
            // Show success for a moment, then go back to dashboard
            setTimeout(() => {
                onSuccess?.();
            }, 1500);
        }
    };

    const handleSubmit = async () => {
        if (!learnCard || !selectedIntegrationId) {
            setSubmitError('Please connect and select an integration first');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            let listingId: string;

            if (isEditMode && editingListing) {
                // Update existing listing then submit
                const updates = {
                    display_name: formData.display_name!,
                    tagline: formData.tagline!,
                    full_description: formData.full_description!,
                    icon_url: formData.icon_url!,
                    launch_type: formData.launch_type!,
                    launch_config_json: formData.launch_config_json || '{}',
                    category: formData.category,
                    promo_video_url: formData.promo_video_url,
                    privacy_policy_url: formData.privacy_policy_url,
                    terms_url: formData.terms_url,
                    ios_app_store_id: formData.ios_app_store_id,
                    android_app_store_id: formData.android_app_store_id,
                    highlights: formData.highlights,
                    screenshots: formData.screenshots,
                };

                const success = await updateListing(editingListing.listing_id, updates);

                if (!success) {
                    throw new Error('Failed to update listing');
                }

                listingId = editingListing.listing_id;
            } else {
                // Create new listing
                const listingData = {
                    display_name: formData.display_name!,
                    tagline: formData.tagline!,
                    full_description: formData.full_description!,
                    icon_url: formData.icon_url!,
                    launch_type: formData.launch_type!,
                    launch_config_json: formData.launch_config_json || '{}',
                    category: formData.category,
                    promo_video_url: formData.promo_video_url,
                    privacy_policy_url: formData.privacy_policy_url,
                    terms_url: formData.terms_url,
                    ios_app_store_id: formData.ios_app_store_id,
                    android_app_store_id: formData.android_app_store_id,
                    highlights: formData.highlights,
                    screenshots: formData.screenshots,
                };

                const newListingId = await createListing(selectedIntegrationId, listingData);

                if (!newListingId) {
                    throw new Error('Failed to create listing');
                }

                listingId = newListingId;
            }

            const submitted = await submitForReview(listingId);

            if (!submitted) {
                throw new Error('Failed to submit listing for review');
            }

            setHasUnsavedChanges(false);
            setIsSubmitting(false);
            setIsSubmitted(true);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit listing');
            setIsSubmitting(false);
        }
    };

    const handleDiscard = useCallback(() => {
        setFormData({});
        setHasUnsavedChanges(false);
        setCurrentStep(1);
    }, []);

    const handleBackClick = useCallback(() => {
        if (hasUnsavedChanges && hasMinimumDataForDraft()) {
            onBack?.(true, saveDraft, handleDiscard);
        } else {
            onSuccess?.();
        }
    }, [hasUnsavedChanges, hasMinimumDataForDraft, onBack, onSuccess, saveDraft, handleDiscard]);

    if (isDraftSaved) {
        return (
            <div className="text-center py-16 animate-fade-in">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                    isPendingReview ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                    <FileEdit className={`w-10 h-10 ${isPendingReview ? 'text-amber-600' : 'text-blue-600'}`} />
                </div>

                <h2 className="text-2xl font-semibold text-apple-gray-600 mb-3">
                    {isPendingReview ? 'Changes Saved!' : isEditMode ? 'Draft Updated!' : 'Draft Saved!'}
                </h2>

                <p className="text-apple-gray-500 max-w-md mx-auto mb-8">
                    {isPendingReview ? (
                        <>Your app "{formData.display_name}" has been updated and remains pending review.</>
                    ) : (
                        <>Your app "{formData.display_name}" has been {isEditMode ? 'updated' : 'saved as a draft'}.
                        You can continue editing it anytime from your dashboard.</>
                    )}
                </p>

                <div className="flex gap-3 justify-center">
                    {onSuccess && (
                        <button onClick={onSuccess} className="btn-primary">
                            View My Listings
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Send className="w-10 h-10 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-semibold text-apple-gray-600 mb-3">
                    Submission Received!
                </h2>

                <p className="text-apple-gray-500 max-w-md mx-auto mb-8">
                    Your app "{formData.display_name}" has been submitted for review. We'll notify
                    you once it's been processed.
                </p>

                <div className="flex gap-3 justify-center">
                    {onSuccess && (
                        <button onClick={onSuccess} className="btn-primary">
                            View My Listings
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setIsSubmitted(false);
                            setCurrentStep(1);
                            setFormData({});
                            setHasUnsavedChanges(false);
                        }}
                        className="btn-secondary"
                    >
                        Submit Another App
                    </button>
                </div>
            </div>
        );
    }

    // Show message if not connected
    if (!learnCard) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-elevated text-center py-12">
                    <AlertCircle className="w-12 h-12 text-apple-gray-300 mx-auto mb-4" />

                    <h3 className="text-lg font-medium text-apple-gray-500 mb-2">
                        Connect to Submit
                    </h3>

                    <p className="text-sm text-apple-gray-400">
                        Connect your LearnCard wallet above to submit an app listing
                    </p>
                </div>
            </div>
        );
    }

    if (!selectedIntegrationId) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card-elevated text-center py-12">
                    <AlertCircle className="w-12 h-12 text-apple-gray-300 mx-auto mb-4" />

                    <h3 className="text-lg font-medium text-apple-gray-500 mb-2">
                        Select an Integration
                    </h3>

                    <p className="text-sm text-apple-gray-400">
                        Choose or create an integration above to submit an app listing
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Back to Dashboard button */}
            {onBack && (
                <button
                    onClick={handleBackClick}
                    className="btn-ghost mb-6"
                >
                    ← Back to Dashboard
                </button>
            )}

            {/* Step Indicator */}
            <div className="mb-10">
                <StepIndicator steps={STEPS} currentStep={currentStep} />
            </div>

            {/* Error Alert */}
            {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-apple flex items-start gap-3 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />

                    <div>
                        <p className="text-sm font-medium text-red-800">Submission Failed</p>

                        <p className="text-sm text-red-700 mt-1">{submitError}</p>
                    </div>
                </div>
            )}

            {/* Form Content */}
            <div className="card-elevated min-h-[500px]">
                {currentStep === 1 && (
                    <AppDetailsStep data={formData} onChange={handleFormChange} errors={errors} />
                )}

                {currentStep === 2 && <LaunchTypeStep data={formData} onChange={handleFormChange} />}

                {currentStep === 3 && (
                    <LaunchConfigStep data={formData} onChange={handleFormChange} errors={errors} />
                )}

                {currentStep === 4 && <ReviewStep data={formData} />}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`btn-ghost ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </button>

                <div className="flex gap-3">
                    {/* Save button - show on all steps if there's data */}
                    {hasMinimumDataForDraft() && (
                        <button
                            onClick={handleSaveDraft}
                            disabled={isSavingDraft || isSubmitting}
                            className={isPendingReview ? 'btn-primary' : 'btn-secondary'}
                        >
                            {isSavingDraft ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isPendingReview ? 'Saving...' : isEditMode ? 'Updating...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isPendingReview ? 'Save Changes' : isEditMode ? 'Update Draft' : 'Save Draft'}
                                </>
                            )}
                        </button>
                    )}

                    {currentStep < STEPS.length ? (
                        <button
                            onClick={handleNext}
                            disabled={currentStep === 2 && !formData.launch_type}
                            className="btn-primary"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    ) : (
                        /* Hide Submit for Review when editing pending review - Save Changes is sufficient */
                        !isPendingReview && (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isSavingDraft}
                                className="btn-primary min-w-[160px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit for Review
                                        <Send className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
