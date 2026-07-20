import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IonToggle } from '@ionic/react';
import { Check, ChevronLeft } from 'lucide-react';
import { AllowConnectionRequestsEnum, ProfileVisibilityEnum } from '@learncard/types';

import {
    RadioGroup,
    ToastTypeEnum,
    useGetPreferencesForDid,
    useConsentedContracts,
    useUpdatePreferences,
    useGetCurrentLCNUser,
    useModal,
    useToast,
    useWallet,
    useBrandingConfig,
    LEARNCARD_AI_PASSPORT_CONTRACT_URI,
    useAiFeatureGate,
} from 'learn-card-base';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useAiConsentToggle } from '../../hooks/useAiConsentToggle';
import { useAnalytics } from '../../analytics';
import * as m from '../../paraglide/messages.js';
import { useLocale } from '../../i18n';

type ProfileVisibilityValue =
    (typeof ProfileVisibilityEnum.enum)[keyof typeof ProfileVisibilityEnum.enum];

type PrivacySettingsProfile = {
    profileVisibility?: ProfileVisibilityValue;
    isPrivate?: boolean;
    showEmail?: boolean;
    allowConnectionRequests?: (typeof AllowConnectionRequestsEnum.enum)[keyof typeof AllowConnectionRequestsEnum.enum];
};

const PrivacySettingsModal: React.FC = () => {
    const { closeModal } = useModal();
    const { data: preferences } = useGetPreferencesForDid();
    const { mutate: updatePreferences } = useUpdatePreferences();
    const { setEnabled: setAnalyticsEnabled } = useAnalytics();
    const { currentLCNUser, refetch } = useGetCurrentLCNUser();
    const { data: consentedContracts } = useConsentedContracts();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { name: brandName } = useBrandingConfig();
    const profileType = switchedProfileStore.use.profileType();
    const [savingProfileField, setSavingProfileField] = useState<string | null>(null);
    const [retryingAiConsent, setRetryingAiConsent] = useState(false);
    const [isSyncingAiConsent, setIsSyncingAiConsent] = useState(false);
    const [aiConnectionStatus, setAiConnectionStatus] = useState<
        'idle' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected'
    >('idle');
    const [isAiConnectionVisible, setIsAiConnectionVisible] = useState(false);
    const aiConnectionHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const aiConnectionClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const profile = currentLCNUser as PrivacySettingsProfile | null;

    // Local DOB fallback so minor banner/locks work even without stored preferences.
    // Uses GDPR country-specific thresholds for EU users, 18 for everyone else.
    const { isAiEnabled: aiFeatureEnabled, reason: aiFeatureGateReason } = useAiFeatureGate();
    const { handleAiToggle } = useAiConsentToggle();
    const isMinor = profileType === 'child';

    const aiEnabled = aiFeatureEnabled;
    const [aiToggleOverride, setAiToggleOverride] = useState<boolean | null>(null);
    const aiToggleChecked = aiToggleOverride ?? aiEnabled;
    const hasAiConsent = useMemo(() => {
        return consentedContracts?.some(
            consent =>
                consent?.contract?.uri === LEARNCARD_AI_PASSPORT_CONTRACT_URI &&
                consent?.status !== 'withdrawn'
        );
    }, [consentedContracts]);
    const showAiConsentWarning =
        !!preferences?.aiEnabled &&
        !hasAiConsent &&
        aiFeatureGateReason !== 'disabled_minor' &&
        !isSyncingAiConsent &&
        !retryingAiConsent;
    const showAiConnectionStatus = aiConnectionStatus !== 'idle';
    const analyticsEnabled = preferences?.analyticsEnabled ?? !isMinor;
    const bugReportsEnabled = preferences?.bugReportsEnabled ?? !isMinor;

    useEffect(() => {
        if (aiToggleOverride === null) return;

        if (aiToggleOverride === aiEnabled) {
            setAiToggleOverride(null);
        }
    }, [aiEnabled, aiToggleOverride]);

    // Legacy profiles may only have `isPrivate` populated. Mirror the backend
    // fallback so the selected privacy option matches the profile's effective
    // visibility until the user saves the new canonical field.
    let profileVisibility: ProfileVisibilityValue = ProfileVisibilityEnum.enum.public;
    if (profile?.profileVisibility) {
        profileVisibility = profile.profileVisibility;
    } else if (profile?.isPrivate) {
        profileVisibility = ProfileVisibilityEnum.enum.private;
    }
    const showEmail = profile?.showEmail ?? false;
    const allowConnectionRequests =
        profile?.allowConnectionRequests ?? AllowConnectionRequestsEnum.enum.anyone;

    const locale = useLocale();

    const visibilityOptions = useMemo(
        () => [
            {
                value: ProfileVisibilityEnum.enum.public,
                label: m['settings.privacy.visibilityPublic'](),
            },
            {
                value: ProfileVisibilityEnum.enum.connections_only,
                label: m['settings.privacy.visibilityConnectionsOnly'](),
            },
            {
                value: ProfileVisibilityEnum.enum.private,
                label: m['settings.privacy.visibilityPrivate'](),
            },
        ],
        [locale]
    );

    const connectionRequestOptions = useMemo(
        () => [
            {
                value: AllowConnectionRequestsEnum.enum.anyone,
                label: m['settings.privacy.connectionRequestsAnyone'](),
            },
            {
                value: AllowConnectionRequestsEnum.enum.invite_only,
                label: m['settings.privacy.connectionRequestsInviteOnly'](),
            },
        ],
        [locale]
    );

    const handleProfileUpdate = useCallback(
        async (field: string, updates: Record<string, string | boolean>) => {
            try {
                setSavingProfileField(field);
                const wallet = await initWallet();
                await wallet?.invoke?.updateProfile(updates);
                await refetch?.();
            } catch (error: any) {
                presentToast(error?.message ?? m['settings.privacy.unableToUpdate'](), {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setSavingProfileField(null);
            }
        },
        [initWallet, presentToast, refetch]
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

    const handleProfileVisibilityChange = useCallback(
        (value: string | null) => {
            if (!value || value === profileVisibility) return;
            handleProfileUpdate('profileVisibility', { profileVisibility: value });
        },
        [handleProfileUpdate, profileVisibility]
    );

    const handleShowEmailToggle = useCallback(
        (enabled: boolean) => {
            if (enabled === showEmail) return;
            handleProfileUpdate('showEmail', { showEmail: enabled });
        },
        [handleProfileUpdate, showEmail]
    );

    const handleAllowConnectionRequestsChange = useCallback(
        (value: string | null) => {
            if (!value || value === allowConnectionRequests) return;
            handleProfileUpdate('allowConnectionRequests', { allowConnectionRequests: value });
        },
        [allowConnectionRequests, handleProfileUpdate]
    );

    const handleRetryAiConsent = useCallback(async () => {
        try {
            setRetryingAiConsent(true);
            setAiToggleOverride(true);
            setAiConnectionStatus('connecting');
            setIsAiConnectionVisible(true);

            const synced = await handleAiToggle(true);

            if (synced) {
                setAiConnectionStatus('connected');
            } else {
                setAiToggleOverride(null);
                setAiConnectionStatus('idle');
                setIsAiConnectionVisible(false);
            }
        } finally {
            setRetryingAiConsent(false);
        }
    }, [handleAiToggle]);

    const handleAiFeatureToggle = useCallback(
        (enabled: boolean) => {
            setAiToggleOverride(enabled);
            setAiConnectionStatus(enabled ? 'connecting' : 'disconnecting');
            setIsAiConnectionVisible(true);
            setIsSyncingAiConsent(true);

            void (async () => {
                try {
                    const synced = await handleAiToggle(enabled);

                    if (synced) {
                        setAiConnectionStatus(enabled ? 'connected' : 'disconnected');
                        return;
                    }

                    setAiToggleOverride(null);
                    setAiConnectionStatus('idle');
                    setIsAiConnectionVisible(false);
                } finally {
                    setIsSyncingAiConsent(false);
                }
            })();
        },
        [handleAiToggle]
    );

    useEffect(() => {
        if (aiConnectionHideTimeoutRef.current) {
            clearTimeout(aiConnectionHideTimeoutRef.current);
            aiConnectionHideTimeoutRef.current = null;
        }

        if (aiConnectionClearTimeoutRef.current) {
            clearTimeout(aiConnectionClearTimeoutRef.current);
            aiConnectionClearTimeoutRef.current = null;
        }

        if (aiConnectionStatus !== 'connected' && aiConnectionStatus !== 'disconnected') return;

        aiConnectionHideTimeoutRef.current = setTimeout(() => {
            setIsAiConnectionVisible(false);
            aiConnectionClearTimeoutRef.current = setTimeout(() => {
                setAiConnectionStatus('idle');
                aiConnectionClearTimeoutRef.current = null;
            }, 300);
        }, 2000);

        return () => {
            if (aiConnectionHideTimeoutRef.current) {
                clearTimeout(aiConnectionHideTimeoutRef.current);
                aiConnectionHideTimeoutRef.current = null;
            }

            if (aiConnectionClearTimeoutRef.current) {
                clearTimeout(aiConnectionClearTimeoutRef.current);
                aiConnectionClearTimeoutRef.current = null;
            }
        };
    }, [aiConnectionStatus]);

    return (
        <div className="bg-white rounded-[20px] p-6 min-w-[350px] max-w-[450px] w-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => closeModal()} className="p-1 -ml-1">
                    <ChevronLeft className="w-6 h-6 text-grayscale-700" />
                </button>
                <h1 className="text-xl font-semibold text-grayscale-900">
                    {m['settings.privacyTitle']()}
                </h1>
            </div>

            <div className="modal-scrollable flex flex-col gap-4">
                {isMinor && (
                    <div className="bg-sky-50 border border-sky-200 rounded-[16px] p-4">
                        <p className="text-sm text-sky-800">{m['settings.minorWarning']()}</p>
                    </div>
                )}

                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm p-5">
                    <div className="mb-4">
                        <p className="text-[15px] font-medium text-grayscale-900">
                            {m['settings.privacy.profilePrivacy']()}
                        </p>
                        <p className="text-sm text-grayscale-500 mt-0.5">
                            {m['settings.privacy.profilePrivacyDesc']({ brand: brandName })}
                        </p>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <p className="text-[14px] font-medium text-grayscale-900">
                                {m['settings.privacy.profileVisibility']()}
                            </p>
                            <p className="text-sm text-grayscale-500">
                                {m['settings.privacy.profileVisibilityDesc']()}
                            </p>
                            <RadioGroup
                                name="profile-visibility"
                                value={profileVisibility}
                                onChange={handleProfileVisibilityChange}
                                options={visibilityOptions}
                                columns={1}
                                disabled={savingProfileField === 'profileVisibility'}
                                className="pt-1"
                            />
                        </div>

                        <div className="border-t border-grayscale-200" />

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 pr-4">
                                <p className="text-[15px] font-medium text-grayscale-900">
                                    {m['settings.privacy.showEmail']()}
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5">
                                    {m['settings.privacy.showEmailDesc']()}
                                </p>
                            </div>
                            <IonToggle
                                checked={showEmail}
                                disabled={savingProfileField === 'showEmail'}
                                onIonChange={e => handleShowEmailToggle(e.detail.checked)}
                                aria-label={m['settings.privacy.showEmail']()}
                            />
                        </div>

                        <div className="border-t border-grayscale-200" />

                        <div className="flex flex-col gap-2">
                            <p className="text-[14px] font-medium text-grayscale-900">
                                {m['settings.privacy.connectionRequests']()}
                            </p>
                            <p className="text-sm text-grayscale-500">
                                {m['settings.privacy.connectionRequestsDesc']()}
                            </p>
                            <RadioGroup
                                name="allow-connection-requests"
                                value={allowConnectionRequests}
                                onChange={handleAllowConnectionRequestsChange}
                                options={connectionRequestOptions}
                                columns={1}
                                disabled={savingProfileField === 'allowConnectionRequests'}
                                className="pt-1"
                            />
                        </div>
                    </div>
                </div>

                {/* AI Features */}
                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex-1 pr-4">
                            <p className="text-[15px] font-medium text-grayscale-900">
                                {m['settings.aiFeatures']()}
                            </p>
                            <p className="text-sm text-grayscale-500 mt-0.5">
                                {m['settings.aiFeaturesDesc']()}
                            </p>
                        </div>
                        <IonToggle
                            checked={aiToggleChecked}
                            disabled={
                                aiFeatureGateReason === 'disabled_minor' ||
                                isSyncingAiConsent ||
                                retryingAiConsent
                            }
                            onIonChange={e =>
                                aiFeatureGateReason !== 'disabled_minor' &&
                                handleAiFeatureToggle(e.detail.checked)
                            }
                            aria-label={m['settings.aiFeatures']()}
                        />
                    </div>
                    {showAiConnectionStatus && (
                        <div
                            className={`px-5 pb-4 transition-opacity duration-300 ${
                                isAiConnectionVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            {aiConnectionStatus === 'connecting' ? (
                                <p className="text-xs text-grayscale-500 leading-relaxed">
                                    {m['dataSharing.connecting']()}
                                </p>
                            ) : aiConnectionStatus === 'disconnecting' ? (
                                <p className="text-xs text-grayscale-500 leading-relaxed">
                                    {m['dataSharing.disconnecting']()}
                                </p>
                            ) : (
                                <p className="flex items-center gap-1.5 text-xs text-emerald-600 leading-relaxed">
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                        {aiConnectionStatus === 'connected'
                                            ? m['dataSharing.connected']()
                                            : m['dataSharing.disconnected']()}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}
                    {showAiConsentWarning && (
                        <div className="px-5 pb-4">
                            <div className="rounded-[16px] border border-red-100 bg-red-50 px-4 py-3">
                                <p className="text-sm text-red-700 leading-relaxed">
                                    {m['dataSharing.aiConsentWarning']()}
                                    <button
                                        type="button"
                                        onClick={handleRetryAiConsent}
                                        disabled={retryingAiConsent}
                                        className="ml-1 font-medium underline underline-offset-2 text-red-700 disabled:opacity-60"
                                    >
                                        {retryingAiConsent
                                            ? m['dataSharing.retrying']()
                                            : m['dataSharing.tryAgain']()}
                                    </button>
                                    .
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Analytics */}
                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex-1 pr-4">
                            <p className="text-[15px] font-medium text-grayscale-900">
                                {m['settings.analytics']()}
                            </p>
                            <p className="text-sm text-grayscale-500 mt-0.5">
                                {m['settings.analyticsDesc']({ brand: brandName })}
                            </p>
                        </div>
                        <IonToggle
                            checked={analyticsEnabled}
                            onIonChange={e => handleAnalyticsToggle(e.detail.checked)}
                            aria-label={m['settings.analytics']()}
                        />
                    </div>
                </div>

                {/* Crash Reports */}
                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex-1 pr-4">
                            <p className="text-[15px] font-medium text-grayscale-900">
                                {m['settings.bugReports']()}
                            </p>
                            <p className="text-sm text-grayscale-500 mt-0.5">
                                {m['settings.bugReportsDesc']()}
                            </p>
                        </div>
                        <IonToggle
                            checked={bugReportsEnabled}
                            onIonChange={e => handleBugReportsToggle(e.detail.checked)}
                            aria-label={m['settings.bugReports']()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettingsModal;
