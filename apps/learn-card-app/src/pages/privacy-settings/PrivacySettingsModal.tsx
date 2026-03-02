import React, { useCallback } from 'react';

import { IonToggle } from '@ionic/react';
import { ChevronLeft } from 'lucide-react';

import {
    useGetPreferencesForDid,
    useUpdatePreferences,
    useGetCurrentLCNUser,
    useModal,
} from 'learn-card-base';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import useFirebaseAnalytics from '../../hooks/useFirebaseAnalytics';

const PrivacySettingsModal: React.FC = () => {
    const { closeModal } = useModal();
    const { data: preferences } = useGetPreferencesForDid();
    const { mutate: updatePreferences } = useUpdatePreferences();
    const { setAnalyticsEnabled } = useFirebaseAnalytics();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();

    // Local DOB fallback so minor banner/locks work even without stored preferences
    const dob = currentLCNUser?.dob;
    const age = dob ? calculateAge(dob) : null;
    const isMinorByAge = profileType === 'child' || (age !== null && !isNaN(age) && age < 18);
    const isMinor = isMinorByAge || (preferences?.isMinor ?? false);

    const aiEnabled = isMinor ? false : (preferences?.aiEnabled ?? true);
    const analyticsEnabled = isMinor ? false : (preferences?.analyticsEnabled ?? true);
    const bugReportsEnabled = isMinor ? false : (preferences?.bugReportsEnabled ?? true);

    const handleAiToggle = useCallback(
        (enabled: boolean) => {
            updatePreferences({ aiEnabled: enabled });
        },
        [updatePreferences]
    );

    const handleAnalyticsToggle = useCallback(
        (enabled: boolean) => {
            updatePreferences({ analyticsEnabled: enabled });
            setAnalyticsEnabled(enabled);
        },
        [updatePreferences, setAnalyticsEnabled]
    );

    const handleBugReportsToggle = useCallback(
        (enabled: boolean) => {
            updatePreferences({ bugReportsEnabled: enabled });
        },
        [updatePreferences]
    );

    return (
        <div className="bg-white rounded-[20px] p-6 min-w-[350px] max-w-[450px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => closeModal()} className="p-1 -ml-1">
                    <ChevronLeft className="w-6 h-6 text-grayscale-700" />
                </button>
                <h1 className="text-xl font-semibold text-grayscale-900">Privacy & Data</h1>
            </div>

            <div className="flex flex-col gap-4">
                {isMinor && (
                    <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4">
                        <p className="text-sm text-amber-800">
                            Some features are restricted for users under 18.
                        </p>
                    </div>
                )}

                {/* AI Features */}
                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex-1 pr-4">
                            <p className="text-[15px] font-medium text-grayscale-900">
                                AI Features
                            </p>
                            <p className="text-sm text-grayscale-500 mt-0.5">
                                AI tutoring sessions, insights, and personalization
                            </p>
                        </div>
                        <IonToggle
                            checked={aiEnabled}
                            disabled={isMinor}
                            onIonChange={e => !isMinor && handleAiToggle(e.detail.checked)}
                            aria-label="AI Features"
                        />
                    </div>
                </div>

                {/* Analytics */}
                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex-1 pr-4">
                            <p className="text-[15px] font-medium text-grayscale-900">
                                Analytics & Insights
                            </p>
                            <p className="text-sm text-grayscale-500 mt-0.5">
                                Help improve LearnCard with anonymous usage data
                            </p>
                        </div>
                        <IonToggle
                            checked={analyticsEnabled}
                            disabled={isMinor}
                            onIonChange={e =>
                                !isMinor && handleAnalyticsToggle(e.detail.checked)
                            }
                            aria-label="Analytics & Insights"
                        />
                    </div>
                </div>

                {/* Bug Reports */}
                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex-1 pr-4">
                            <p className="text-[15px] font-medium text-grayscale-900">
                                Bug Reports
                            </p>
                            <p className="text-sm text-grayscale-500 mt-0.5">
                                Automatically send crash reports to help fix issues
                            </p>
                        </div>
                        <IonToggle
                            checked={bugReportsEnabled}
                            disabled={isMinor}
                            onIonChange={e =>
                                !isMinor && handleBugReportsToggle(e.detail.checked)
                            }
                            aria-label="Bug Reports"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettingsModal;

