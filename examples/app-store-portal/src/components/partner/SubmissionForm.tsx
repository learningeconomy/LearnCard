import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Send, Loader2, AlertCircle } from 'lucide-react';
import type { AppStoreListingCreate } from '../../types/app-store';
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
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSuccess }) => {
    const { learnCard, selectedIntegrationId, createListing, submitForReview } = useLearnCardStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [createdListingId, setCreatedListingId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<Partial<AppStoreListingCreate>>({});

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

    const handleSubmit = async () => {
        if (!learnCard || !selectedIntegrationId) {
            setSubmitError('Please connect and select an integration first');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Create the listing as a draft first
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
            };

            const listingId = await createListing(selectedIntegrationId, listingData);

            if (!listingId) {
                throw new Error('Failed to create listing');
            }

            setCreatedListingId(listingId);

            // Submit for review
            const submitted = await submitForReview(listingId);

            if (!submitted) {
                throw new Error('Failed to submit listing for review');
            }

            setIsSubmitting(false);
            setIsSubmitted(true);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit listing');
            setIsSubmitting(false);
        }
    };

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
                            setCreatedListingId(null);
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
                    <AppDetailsStep data={formData} onChange={setFormData} errors={errors} />
                )}

                {currentStep === 2 && <LaunchTypeStep data={formData} onChange={setFormData} />}

                {currentStep === 3 && (
                    <LaunchConfigStep data={formData} onChange={setFormData} errors={errors} />
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
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
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
                )}
            </div>
        </div>
    );
};
