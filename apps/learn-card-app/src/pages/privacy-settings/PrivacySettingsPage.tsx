import React, { useCallback, useMemo, useState } from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { AllowConnectionRequestsEnum, ProfileVisibilityEnum } from '@learncard/types';

import {
    getAiFeatureAgeGateState,
    useGetCurrentLCNUser,
    useGetPreferencesForDid,
    useUpdatePreferences,
    useWallet,
    useToast,
    useBrandingConfig,
    useAiFeatureGate,
    ToastTypeEnum,
    LEARNCARD_AI_PASSPORT_CONTRACT_URI,
} from 'learn-card-base';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

import { useAiConsentToggle } from '../../hooks/useAiConsentToggle';
import { useAnalytics } from '../../analytics';
import * as m from '../../paraglide/messages.js';
import DataSharingCenterView from './DataSharingCenterView';
import type {
    ConnectionRequestsValue,
    DataSharingCenterViewModel,
    ProfileVisibilityValue,
} from './DataSharingCenter.types';

type PrivacySettingsProfile = {
    profileVisibility?: ProfileVisibilityValue;
    isPrivate?: boolean;
    showEmail?: boolean;
    allowConnectionRequests?: ConnectionRequestsValue;
};

const PrivacySettingsPage: React.FC = () => {
    const { currentLCNUser, refetch: refetchUser } = useGetCurrentLCNUser();
    const { data: preferences } = useGetPreferencesForDid();
    const { mutate: updatePreferences } = useUpdatePreferences();
    const { setEnabled: setAnalyticsEnabled } = useAnalytics();
    const { data: consentedContracts, isLoading, refetch } = useConsentedContracts();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { name: brandName } = useBrandingConfig();
    const profileType = switchedProfileStore.use.profileType();
    const { isAiEnabled, reason: aiReason } = useAiFeatureGate();
    const { handleAiToggle } = useAiConsentToggle();
    const [savingField, setSavingField] = useState<string | null>(null);

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

    const handleProfileUpdate = useCallback(
        async (field: string, updates: Record<string, string | boolean>) => {
            try {
                setSavingField(field);
                const wallet = await initWallet();
                await wallet?.invoke?.updateProfile(updates);
                await refetchUser?.();
            } catch (error: any) {
                presentToast(error?.message ?? m['settings.privacy.unableToUpdate'](), {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setSavingField(null);
            }
        },
        [initWallet, presentToast, refetchUser]
    );

    const profileData = currentLCNUser as PrivacySettingsProfile | null;

    let visibility: ProfileVisibilityValue = ProfileVisibilityEnum.enum.public;
    if (profileData?.profileVisibility) {
        visibility = profileData.profileVisibility;
    } else if (profileData?.isPrivate) {
        visibility = ProfileVisibilityEnum.enum.private;
    }
    const showEmail = profileData?.showEmail ?? false;
    const allowConnectionRequests =
        profileData?.allowConnectionRequests ?? AllowConnectionRequestsEnum.enum.anyone;

    const hasAiConsent = contracts.some(
        consent =>
            consent?.contract?.uri === LEARNCARD_AI_PASSPORT_CONTRACT_URI &&
            consent?.status !== 'withdrawn'
    );

    const vm = useMemo<DataSharingCenterViewModel>(() => {
        const analyticsEnabled = preferences?.analyticsEnabled ?? !isMinor;
        const bugReportsEnabled = preferences?.bugReportsEnabled ?? !isMinor;

        return {
            isLoading,
            isMinor,
            contracts,
            onContractsUpdate: refetch,
            ai: isMinor
                ? {
                      checked: false,
                      disabled: true,
                      showConsentWarning: false,
                      lockedNote: m['dataShareCenter.aiLockedNote'](),
                      onToggle: handleAiToggle,
                      onRetryConsent: () => handleAiToggle(true),
                  }
                : {
                      checked: isAiEnabled,
                      disabled: aiReason === 'disabled_minor',
                      showConsentWarning:
                          !!preferences?.aiEnabled &&
                          !hasAiConsent &&
                          aiReason !== 'disabled_minor',
                      onToggle: handleAiToggle,
                      onRetryConsent: () => handleAiToggle(true),
                  },
            profile: {
                brandName,
                visibility,
                showEmail,
                allowConnectionRequests,
                savingField,
                onChangeVisibility: value => {
                    if (!value || value === visibility) return;
                    handleProfileUpdate('profileVisibility', { profileVisibility: value });
                },
                onToggleShowEmail: enabled => {
                    if (enabled === showEmail) return;
                    handleProfileUpdate('showEmail', { showEmail: enabled });
                },
                onChangeConnectionRequests: value => {
                    if (!value || value === allowConnectionRequests) return;
                    handleProfileUpdate('allowConnectionRequests', {
                        allowConnectionRequests: value,
                    });
                },
            },
            diagnostics: {
                brandName,
                analyticsEnabled,
                bugReportsEnabled,
                disabled: isMinor,
                lockedNote: isMinor ? m['dataShareCenter.diagLockedNote']() : undefined,
                onToggleAnalytics: enabled => {
                    updatePreferences({ analyticsEnabled: enabled });
                    setAnalyticsEnabled(enabled);
                },
                onToggleBugReports: enabled => {
                    updatePreferences({ bugReportsEnabled: enabled });
                },
            },
        };
    }, [
        isLoading,
        isMinor,
        contracts,
        refetch,
        isAiEnabled,
        aiReason,
        preferences?.aiEnabled,
        preferences?.analyticsEnabled,
        preferences?.bugReportsEnabled,
        hasAiConsent,
        handleAiToggle,
        brandName,
        visibility,
        showEmail,
        allowConnectionRequests,
        savingField,
        handleProfileUpdate,
        updatePreferences,
        setAnalyticsEnabled,
    ]);

    return (
        <IonPage>
            <IonContent>
                <DataSharingCenterView vm={vm} />
            </IonContent>
        </IonPage>
    );
};

export default PrivacySettingsPage;
