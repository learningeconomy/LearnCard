import React from 'react';

import { IonToggle } from '@ionic/react';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import OnboardingHeader from './onboardingHeader/OnboardingHeader';
import OnboardingFooter from './onboardingFooter/OnboardingFooter';
import { OnboardingStepsEnum } from './onboarding.helpers';
import type { OnboardingPrivacyPreferences } from './privacyPreferences';

type OnboardingPrivacyDataStepProps = {
    preferences: OnboardingPrivacyPreferences;
    error?: string | null;
    isLoading?: boolean;
    onBack?: () => void;
    onChange: (updates: Partial<OnboardingPrivacyPreferences>) => void;
    onContinue: () => void;
};

const OnboardingPrivacyDataStep: React.FC<OnboardingPrivacyDataStepProps> = ({
    preferences,
    error,
    isLoading = false,
    onBack,
    onChange,
    onContinue,
}) => {
    const brandingConfig = useBrandingConfig();
    const isMinor = preferences.isMinor;

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-y-auto relative font-poppins">
            <div className="max-w-[600px] mx-auto pt-[50px] px-4 pb-[120px] relative w-full">
                <OnboardingHeader
                    text="Choose what you'd like to enable."
                    secondaryText="You're in control. Turn on only what feels right for you, and change it anytime in Settings."
                />

                {error && (
                    <div className="mt-6 mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl">
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}

                {isMinor && (
                    <div className="mt-6 mb-5 p-4 bg-sky-50 border border-sky-200 rounded-[20px]">
                        <p className="text-sm text-sky-800 leading-relaxed">
                            These features are restricted for users under 18.
                        </p>
                    </div>
                )}

                <div className="space-y-4 mt-8">
                    <div className="bg-white border border-grayscale-200 rounded-[20px] shadow-sm">
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                            <div className="flex-1 pr-4">
                                <p className="text-[15px] font-medium text-grayscale-900">
                                    AI Features
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5 leading-relaxed">
                                    AI tutoring sessions, insights, and personalization. This may
                                    share relevant messages and records with AI providers.
                                </p>
                            </div>
                            <IonToggle
                                checked={preferences.aiEnabled}
                                disabled={isMinor || isLoading}
                                onIonChange={e => onChange({ aiEnabled: e.detail.checked })}
                                aria-label="AI Features"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-grayscale-200 rounded-[20px] shadow-sm">
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                            <div className="flex-1 pr-4">
                                <p className="text-[15px] font-medium text-grayscale-900">
                                    Usage Analytics
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5 leading-relaxed">
                                    Help improve {brandingConfig?.name} by sharing anonymous app
                                    usage data
                                </p>
                            </div>
                            <IonToggle
                                checked={preferences.analyticsEnabled}
                                disabled={isMinor || isLoading}
                                onIonChange={e => onChange({ analyticsEnabled: e.detail.checked })}
                                aria-label="Usage Analytics"
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-grayscale-200 rounded-[20px] shadow-sm">
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                            <div className="flex-1 pr-4">
                                <p className="text-[15px] font-medium text-grayscale-900">
                                    Crash Reports
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5 leading-relaxed">
                                    Share technical details if the app crashes so we can fix issues
                                    faster
                                </p>
                            </div>
                            <IonToggle
                                checked={preferences.bugReportsEnabled}
                                disabled={isMinor || isLoading}
                                onIonChange={e => onChange({ bugReportsEnabled: e.detail.checked })}
                                aria-label="Crash Reports"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <OnboardingFooter
                step={OnboardingStepsEnum.privacyData}
                text={isLoading ? 'Saving...' : 'Continue'}
                onClick={onContinue}
                onBack={onBack}
                isLoading={isLoading}
                showBackButton={Boolean(onBack)}
                showSkipButton={false}
            />
        </div>
    );
};

export default OnboardingPrivacyDataStep;
