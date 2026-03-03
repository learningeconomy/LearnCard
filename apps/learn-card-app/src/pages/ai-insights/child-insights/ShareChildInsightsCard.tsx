import React from 'react';

import ShareInsightsCardController from '../share-insights/ShareInsightsCardController';
import { UserProfilePicture } from 'learn-card-base';

import { LCNProfile, LCNProfileManager } from '@learncard/types';

export const ShareChildInsightsCard: React.FC<{
    profile: LCNProfile;
    profileManager: LCNProfileManager;
}> = ({ profile, profileManager }) => {
    const currentUserRole = profile.role ?? 'Learner';

    const name = profileManager?.displayName || profile?.displayName;
    const image = profileManager?.image || profile?.image;

    return (
        <div className="w-full flex items-center justify-center max-h-[100px] h-[100px]">
            <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-between relative shadow-bottom-2-4 overflow-hidden">
                <div className="pl-4 flex items-center">
                    <UserProfilePicture
                        user={{
                            name,
                            image,
                        }}
                        customContainerClass="flex w-[70px] min-w-[70px] h-[70px] min-h-[70px] items-center justify-center rounded-full overflow-hidden object-cover text-white"
                        customImageClass="w-full h-full object-cover flex-shrink-0"
                        customSize={120}
                    />

                    <div className="w-full flex items-start justify-center flex-col ml-[12px]">
                        <p className="text-[17px] text-grayscale-900 line-clamp-1">{name}</p>
                        <p className="font-semibold text-sm font-poppins capitalize text-grayscale-700">
                            {currentUserRole}
                        </p>
                    </div>
                </div>

                <ShareInsightsCardController
                    childProfile={profile}
                    childProfileManager={profileManager}
                />
            </div>
        </div>
    );
};

export default ShareChildInsightsCard;
