import React, { useCallback } from 'react';

import { IonContent, IonHeader, IonPage, IonToolbar, IonToggle } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import {
    useGetPreferencesForDid,
    useUpdatePreferences,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import { getAiFeatureAgeGateState } from 'learn-card-base';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { useAiConsentToggle } from '../../hooks/useAiConsentToggle';
import { useAnalytics } from '../../analytics';
import { useTranslation } from 'react-i18next';

const PrivacySettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { data: preferences } = useGetPreferencesForDid();
    const { mutate: updatePreferences } = useUpdatePreferences();
    const { setEnabled: setAnalyticsEnabled } = useAnalytics();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const brandingConfig = useBrandingConfig();
    const profileType = switchedProfileStore.use.profileType();

    // Local DOB fallback so minor banner/locks work even without stored preferences.
    // Uses GDPR country-specific thresholds for EU users, 18 for everyone else.
    const ageGate = getAiFeatureAgeGateState({
        profileType,
        dob: currentLCNUser?.dob,
        country: currentLCNUser?.country,
    });
    const { handleAiToggle } = useAiConsentToggle();
    const isMinor = ageGate.isChildProfile || ageGate.isMinorByAge;

    const aiEnabled = ageGate.isAiAgeRestricted
        ? false
        : ageGate.isChildProfile
        ? preferences?.aiEnabled ?? false
        : preferences?.aiEnabled ?? true;
    const analyticsEnabled = isMinor ? false : preferences?.analyticsEnabled ?? true;
    const bugReportsEnabled = isMinor ? false : preferences?.bugReportsEnabled ?? true;

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
        <IonPage className="bg-grayscale-50">
            <IonHeader className="ion-no-border">
                <IonToolbar className="ion-no-border bg-white px-4 pt-[max(env(safe-area-inset-top),16px)]">
                    <div className="flex items-center gap-3 py-3 px-4">
                        <button
                            onClick={() => history.goBack()}
                            className="p-1 -ml-1"
                            aria-label={t('settings.goBack', 'Go back')}
                        >
                            <CaretLeft className="h-auto w-3 text-grayscale-900" />
                        </button>
                        <h1 className="text-[17px] font-semibold text-grayscale-900">
                            {t('settings.privacyTitle', 'Privacy & Data')}
                        </h1>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div className="max-w-[600px] mx-auto flex flex-col gap-4 mt-4">
                    {isMinor && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4">
                            <p className="text-sm text-amber-800">
                                {t('settings.minorWarning', 'Some features are restricted for users under 18.')}
                            </p>
                        </div>
                    )}

                    {/* AI Features */}
                    <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex-1 pr-4">
                                <p className="text-[15px] font-medium text-grayscale-900">
                                    {t('settings.aiFeatures', 'AI Features')}
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5">
                                    {t('settings.aiFeaturesDesc', 'AI tutoring sessions, insights, and personalization')}
                                </p>
                            </div>
                            <IonToggle
                                checked={aiEnabled}
                                disabled={ageGate.isAiAgeRestricted}
                                onIonChange={e =>
                                    !ageGate.isAiAgeRestricted && handleAiToggle(e.detail.checked)
                                }
                                aria-label={t('settings.aiFeatures', 'AI Features')}
                            />
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex-1 pr-4">
                                <p className="text-[15px] font-medium text-grayscale-900">
                                    {t('settings.analytics', 'Analytics & Insights')}
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5">
                                    {t('settings.analyticsDesc', 'Help improve {{brand}} with anonymous usage data', { brand: brandingConfig?.name })}
                                </p>
                            </div>
                            <IonToggle
                                checked={analyticsEnabled}
                                disabled={isMinor}
                                onIonChange={e =>
                                    !isMinor && handleAnalyticsToggle(e.detail.checked)
                                }
                                aria-label={t('settings.analytics', 'Analytics & Insights')}
                            />
                        </div>
                    </div>

                    {/* Bug Reports */}
                    <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex-1 pr-4">
                                <p className="text-[15px] font-medium text-grayscale-900">
                                    {t('settings.bugReports', 'Bug Reports')}
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5">
                                    {t('settings.bugReportsDesc', 'Automatically send crash reports to help fix issues')}
                                </p>
                            </div>
                            <IonToggle
                                checked={bugReportsEnabled}
                                disabled={isMinor}
                                onIonChange={e =>
                                    !isMinor && handleBugReportsToggle(e.detail.checked)
                                }
                                aria-label={t('settings.bugReports', 'Bug Reports')}
                            />
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default PrivacySettingsPage;
