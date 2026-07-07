import React, { useCallback, useMemo, useState } from 'react';
import { IonToggle } from '@ionic/react';
import { AllowConnectionRequestsEnum, ProfileVisibilityEnum } from '@learncard/types';

import {
    RadioGroup,
    ToastTypeEnum,
    useGetCurrentLCNUser,
    useToast,
    useWallet,
    useBrandingConfig,
} from 'learn-card-base';

import GlassCard from './GlassCard';

type ProfileVisibilityValue =
    (typeof ProfileVisibilityEnum.enum)[keyof typeof ProfileVisibilityEnum.enum];

type ConnectionRequestsValue =
    (typeof AllowConnectionRequestsEnum.enum)[keyof typeof AllowConnectionRequestsEnum.enum];

type PrivacySettingsProfile = {
    profileVisibility?: ProfileVisibilityValue;
    isPrivate?: boolean;
    showEmail?: boolean;
    allowConnectionRequests?: ConnectionRequestsValue;
};

const ProfileVisibilityCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
    const { currentLCNUser, refetch } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { name: brandName } = useBrandingConfig();
    const [savingField, setSavingField] = useState<string | null>(null);

    const profile = currentLCNUser as PrivacySettingsProfile | null;

    let profileVisibility: ProfileVisibilityValue = ProfileVisibilityEnum.enum.public;
    if (profile?.profileVisibility) {
        profileVisibility = profile.profileVisibility;
    } else if (profile?.isPrivate) {
        profileVisibility = ProfileVisibilityEnum.enum.private;
    }
    const showEmail = profile?.showEmail ?? false;
    const allowConnectionRequests =
        profile?.allowConnectionRequests ?? AllowConnectionRequestsEnum.enum.anyone;

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
                setSavingField(field);
                const wallet = await initWallet();
                await wallet?.invoke?.updateProfile(updates);
                await refetch?.();
            } catch (error: any) {
                presentToast(error?.message ?? 'Unable to update privacy settings.', {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setSavingField(null);
            }
        },
        [initWallet, presentToast, refetch]
    );

    const handleVisibilityChange = useCallback(
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

    const handleConnectionRequestsChange = useCallback(
        (value: string | null) => {
            if (!value || value === allowConnectionRequests) return;
            handleProfileUpdate('allowConnectionRequests', { allowConnectionRequests: value });
        },
        [allowConnectionRequests, handleProfileUpdate]
    );

    return (
        <div
            className="animate-fade-in-up"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <div className="px-1 mb-2">
                <h3 className="text-[15px] font-semibold text-grayscale-900">Your profile</h3>
                <p className="text-sm text-grayscale-600">Who can see you on {brandName}.</p>
            </div>

            <GlassCard className="p-5 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <p className="text-[14px] font-medium text-grayscale-900">Profile visibility</p>
                    <p className="text-sm text-grayscale-500">
                        Choose who can view your profile details.
                    </p>
                    <RadioGroup
                        name="profile-visibility"
                        value={profileVisibility}
                        onChange={handleVisibilityChange}
                        options={visibilityOptions}
                        columns={1}
                        disabled={savingField === 'profileVisibility'}
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
                            Let connected people see your email on your profile.
                        </p>
                    </div>
                    <IonToggle
                        className="ds-toggle"
                        checked={showEmail}
                        disabled={savingField === 'showEmail'}
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
                        onChange={handleConnectionRequestsChange}
                        options={connectionRequestOptions}
                        columns={1}
                        disabled={savingField === 'allowConnectionRequests'}
                        className="pt-1"
                    />
                </div>
            </GlassCard>
        </div>
    );
};

export default ProfileVisibilityCard;
