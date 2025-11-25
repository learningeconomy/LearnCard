import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import type { AppStoreListingCreate } from '../../types/app-store';
import { StepIndicator } from '../ui/StepIndicator';
import { AppDetailsStep } from './AppDetailsStep';
import { LaunchTypeStep } from './LaunchTypeStep';
import { LaunchConfigStep } from './LaunchConfigStep';
import { ReviewStep } from './ReviewStep';

const STEPS = [
    { id: 1, title: 'App Details', description: 'Basic information about your app' },
    { id: 2, title: 'Launch Type', description: 'How your app integrates' },
    { id: 3, title: 'Configuration', description: 'Technical settings' },
    { id: 4, title: 'Review', description: 'Submit for approval' },
];

export const SubmissionForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
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
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Submitting:', formData);
        setIsSubmitting(false);
        setIsSubmitted(true);
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

                <button
                    onClick={() => {
                        setIsSubmitted(false);
                        setCurrentStep(1);
                        setFormData({});
                    }}
                    className="btn-secondary"
                >
                    Submit Another App
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Step Indicator */}
            <div className="mb-10">
                <StepIndicator steps={STEPS} currentStep={currentStep} />
            </div>

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
