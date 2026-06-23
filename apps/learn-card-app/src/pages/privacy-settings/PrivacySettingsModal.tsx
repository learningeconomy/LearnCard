import React, { useCallback, useMemo, useState } from 'react';

import { IonToggle } from '@ionic/react';
import { ChevronLeft } from 'lucide-react';
import { AllowConnectionRequestsEnum, ProfileVisibilityEnum } from '@learncard/types';

import {
    RadioGroup,
    ToastTypeEnum,
    useGetPreferencesForDid,
    useUpdatePreferences,
    useGetCurrentLCNUser,
    useModal,
    useToast,
    useWallet,
    useBrandingConfig,
} from 'learn-card-base';
import { getAiFeatureAgeGateState } from 'learn-card-base';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useAiConsentToggle } from '../../hooks/useAiConsentToggle';
import { useAnalytics } from '../../analytics';
import * as m from '../../paraglide/messages.js';

type ProfileVisibilityValue =
    (typeof ProfileVisibilityEnum.enum)[keyof typeof ProfileVisibilityEnum.enum];

const PrivacySettingsModal: React.FC = () => {
    const { closeModal } = useModal();
    const { data: preferences } = useGetPreferencesForDid();
    const { mutate: updatePreferences } = useUpdatePreferences();
    const { setEnabled: setAnalyticsEnabled } = useAnalytics();
    const { currentLCNUser, refetch } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { name: brandName } = useBrandingConfig();
    const profileType = switchedProfileStore.use.profileType();
    const [savingProfileField, setSavingProfileField] = useState<string | null>(null);

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
    const analyticsEnabled = preferences?.analyticsEnabled ?? !isMinor;
    const bugReportsEnabled = preferences?.bugReportsEnabled ?? !isMinor;
    // Legacy profiles may only have `isPrivate` populated. Mirror the backend
    // fallback so the selected privacy option matches the profile's effective
    // visibility until the user saves the new canonical field.
    let profileVisibility: ProfileVisibilityValue = ProfileVisibilityEnum.enum.public;
    if (currentLCNUser?.profileVisibility) {
        profileVisibility = currentLCNUser.profileVisibility;
    } else if (currentLCNUser?.isPrivate) {
        profileVisibility = ProfileVisibilityEnum.enum.private;
    }
    const showEmail = currentLCNUser?.showEmail ?? false;
    const allowConnectionRequests =
        currentLCNUser?.allowConnectionRequests ?? AllowConnectionRequestsEnum.enum.anyone;

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
        []
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
        []
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
                                aria-label="Show email to connections"
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
                            checked={aiEnabled}
                            disabled={ageGate.isAiAgeRestricted}
                            onIonChange={e =>
                                !ageGate.isAiAgeRestricted && handleAiToggle(e.detail.checked)
                            }
                            aria-label="AI Features"
                        />
                    </div>
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
                            aria-label="Usage Analytics"
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
                            aria-label="Crash Reports"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettingsModal;
