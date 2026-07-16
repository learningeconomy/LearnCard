import React, { useMemo } from 'react';
import { IonToggle } from '@ionic/react';
import { AllowConnectionRequestsEnum, ProfileVisibilityEnum } from '@learncard/types';

import { RadioGroup } from 'learn-card-base';

import * as m from '../../../paraglide/messages.js';
import type { DataSharingProfileViewModel } from '../DataSharingCenter.types';
import GlassCard from './GlassCard';

type ProfileVisibilityCardProps = DataSharingProfileViewModel & { delay?: number };

const ProfileVisibilityCard: React.FC<ProfileVisibilityCardProps> = ({
    brandName,
    visibility,
    showEmail,
    allowConnectionRequests,
    savingField,
    onChangeVisibility,
    onToggleShowEmail,
    onChangeConnectionRequests,
    delay = 0,
}) => {
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

    return (
        <div
            className="animate-fade-in-up"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <div className="px-1 mb-2">
                <h3 className="text-[15px] font-semibold text-grayscale-900">
                    {m['settings.privacy.yourProfile']()}
                </h3>
                <p className="text-sm text-grayscale-600">
                    {m['settings.privacy.whoCanSeeYou']({ brand: brandName })}
                </p>
            </div>

            <GlassCard className="p-5 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <p className="text-[14px] font-medium text-grayscale-900">
                        {m['settings.privacy.profileVisibility']()}
                    </p>
                    <p className="text-sm text-grayscale-500">
                        {m['settings.privacy.viewProfileHint']()}
                    </p>
                    <RadioGroup
                        name="profile-visibility"
                        value={visibility}
                        onChange={onChangeVisibility}
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
                            {m['settings.privacy.showEmail']()}
                        </p>
                        <p className="text-sm text-grayscale-500 mt-0.5">
                            {m['settings.privacy.showEmailHint']()}
                        </p>
                    </div>
                    <IonToggle
                        className="ds-toggle"
                        checked={showEmail}
                        disabled={savingField === 'showEmail'}
                        onIonChange={e => onToggleShowEmail(e.detail.checked)}
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
                        onChange={onChangeConnectionRequests}
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
