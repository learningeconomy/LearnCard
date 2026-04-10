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
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';
import { getMinorAgeThreshold } from 'learn-card-base/constants/gdprAgeLimits';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useAnalytics } from '../../analytics';

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
    const dob = currentLCNUser?.dob;
    const age = dob ? calculateAge(dob) : null;
    const threshold = getMinorAgeThreshold(currentLCNUser?.country);
    const isMinorByAge =
        profileType === 'child' || (age !== null && !isNaN(age) && age < threshold);
    const isMinor = isMinorByAge;

    const aiEnabled = isMinor ? false : preferences?.aiEnabled ?? true;
    const analyticsEnabled = isMinor ? false : preferences?.analyticsEnabled ?? true;
    const bugReportsEnabled = isMinor ? false : preferences?.bugReportsEnabled ?? true;
    // Legacy profiles may only have `isPrivate` populated. Mirror the backend
    // fallback so the selected privacy option matches the profile's effective
    // visibility until the user saves the new canonical field.
    let profileVisibility = ProfileVisibilityEnum.enum.public;
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
            { value: ProfileVisibilityEnum.enum.public, label: 'Public' },
            { value: ProfileVisibilityEnum.enum.connections_only, label: 'Connections only' },
            { value: ProfileVisibilityEnum.enum.private, label: 'Private' },
        ],
        []
    );

    const connectionRequestOptions = useMemo(
        () => [
            { value: AllowConnectionRequestsEnum.enum.anyone, label: 'Anyone' },
            { value: AllowConnectionRequestsEnum.enum.invite_only, label: 'Invite only' },
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
                presentToast(error?.message ?? 'Unable to update privacy settings.', {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setSavingProfileField(null);
            }
        },
        [initWallet, presentToast, refetch]
    );

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

                <div className="bg-white rounded-[16px] overflow-hidden shadow-sm p-5">
                    <div className="mb-4">
                        <p className="text-[15px] font-medium text-grayscale-900">
                            Profile Privacy
                        </p>
                        <p className="text-sm text-grayscale-500 mt-0.5">
                            Control how your {brandName} profile appears to others in the network.
                        </p>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <p className="text-[14px] font-medium text-grayscale-900">
                                Profile visibility
                            </p>
                            <p className="text-sm text-grayscale-500">
                                Choose who can view the details on your profile.
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
                                    Show email to connections
                                </p>
                                <p className="text-sm text-grayscale-500 mt-0.5">
                                    Let connected users see your email address on your profile.
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
                                Connection requests
                            </p>
                            <p className="text-sm text-grayscale-500">
                                Decide who can send you new connection requests.
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
                                Help improve {brandName} with anonymous usage data
                            </p>
                        </div>
                        <IonToggle
                            checked={analyticsEnabled}
                            disabled={isMinor}
                            onIonChange={e => !isMinor && handleAnalyticsToggle(e.detail.checked)}
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
                            onIonChange={e => !isMinor && handleBugReportsToggle(e.detail.checked)}
                            aria-label="Bug Reports"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacySettingsModal;
