import React, { useMemo } from 'react';

import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import {
    getAiFeatureAgeGateState,
    useGetCurrentLCNUser,
    useGetPreferencesForDid,
} from 'learn-card-base';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

import TrustSummaryCard from './components/TrustSummaryCard';
import ConnectedAppsSection from './components/ConnectedAppsSection';
import AiPersonalizationCard from './components/AiPersonalizationCard';
import ProfileVisibilityCard from './components/ProfileVisibilityCard';
import AppDiagnosticsCard from './components/AppDiagnosticsCard';
import './dataSharingCenter.scss';

const PrivacySettingsPage: React.FC = () => {
    const history = useHistory();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: preferences } = useGetPreferencesForDid();
    const { data: consentedContracts, isLoading, refetch } = useConsentedContracts();
    const profileType = switchedProfileStore.use.profileType();

    const ageGate = getAiFeatureAgeGateState({
        profileType,
        dob: currentLCNUser?.dob,
        country: currentLCNUser?.country,
    });
    const isMinor = ageGate.isChildProfile || ageGate.isMinorByAge;

    const contracts = useMemo(
        () =>
            [...(consentedContracts ?? [])]
                .filter(contract => contract?.status !== 'withdrawn')
                .sort((a, b) => {
                    const aUpdatedAt = new Date(
                        a.terms?.updatedAt ?? a.contract?.updatedAt ?? 0
                    ).getTime();
                    const bUpdatedAt = new Date(
                        b.terms?.updatedAt ?? b.contract?.updatedAt ?? 0
                    ).getTime();
                    return bUpdatedAt - aUpdatedAt;
                }),
        [consentedContracts]
    );

    return (
        <IonPage>
            <IonContent className="ds-content">
                <div aria-hidden className="ds-aurora">
                    <span className="ds-aurora__blob ds-aurora__blob--emerald" />
                    <span className="ds-aurora__blob ds-aurora__blob--sky" />
                    <span className="ds-aurora__blob ds-aurora__blob--violet" />
                </div>

                {isLoading ? (
                    <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] gap-3">
                        <IonSpinner name="crescent" className="w-8 h-8" />
                        <p className="text-grayscale-600 text-sm">Loading your privacy center...</p>
                    </div>
                ) : (
                    <div className="relative z-10 mx-auto w-full max-w-[820px] px-5 desktop:px-6 pt-[max(env(safe-area-inset-top),16px)] pb-14">
                        <button
                            onClick={() => history.goBack()}
                            aria-label="Go back"
                            className="mb-4 -ml-1.5 inline-flex items-center gap-1.5 py-1.5 pl-1.5 pr-3 rounded-full text-grayscale-700 hover:text-grayscale-900 hover:bg-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <CaretLeft className="h-auto w-3" />
                            <span className="text-sm font-medium">Back</span>
                        </button>

                        {isMinor && (
                            <div className="mb-6 bg-sky-50 border border-sky-200 rounded-[16px] p-4 animate-fade-in-up">
                                <p className="text-sm text-sky-800 leading-relaxed">
                                    Some features like AI and analytics are turned off to keep
                                    things safe for younger users.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-6">
                            <TrustSummaryCard contracts={contracts} />

                            <ConnectedAppsSection
                                contracts={contracts}
                                onUpdate={refetch}
                                delay={60}
                            />

                            {!isMinor && (
                                <AiPersonalizationCard
                                    consentedContracts={contracts}
                                    aiStoredPreference={!!preferences?.aiEnabled}
                                    delay={120}
                                />
                            )}

                            <ProfileVisibilityCard delay={180} />

                            <AppDiagnosticsCard isMinor={isMinor} delay={240} />

                            <p className="text-xs text-grayscale-500 text-center px-6 mt-1">
                                You can change any of this anytime. Turning something off takes
                                effect right away.
                            </p>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default PrivacySettingsPage;
