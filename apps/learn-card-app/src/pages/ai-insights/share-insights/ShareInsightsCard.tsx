import React from 'react';

import ShareInsightsCardController from './ShareInsightsCardController';
import { ProfilePicture, useCurrentUser, useGetCurrentUserRole } from 'learn-card-base';

import { useSkillsCount } from '../../../hooks/useSkillsCount';

export const ShareInsightsCard: React.FC<{}> = () => {
    const currentUser = useCurrentUser();

    const { total } = useSkillsCount();

    const currentUserRole = useGetCurrentUserRole();

    const currentRoleLabel = currentUserRole ? `${currentUserRole} •` : '';

    return (
        <div className="w-full flex items-center justify-center max-h-[100px] h-[100px]">
            <div className="w-full h-full bg-white rounded-[16px] flex items-center justify-between relative shadow-bottom-2-4 overflow-hidden">
                <div className="pl-4 flex items-center">
                    <ProfilePicture
                        customContainerClass="flex w-[70px] text-white min-w-[70px] h-[70px] min-h-[70px] items-center justify-center rounded-full overflow-hidden object-cover"
                        customImageClass="w-full h-full object-cover flex-shrink-0"
                        customSize={120}
                    />

                    <div className="w-full flex items-start justify-center flex-col ml-[12px]">
                        <p className="text-[17px] text-grayscale-900 line-clamp-1">
                            {currentUser?.name}
                        </p>
                        <p className="font-semibold text-sm font-poppins capitalize text-grayscale-700">
                            {currentRoleLabel} {total ?? 0} Skills
                        </p>
                    </div>
                </div>

                <ShareInsightsCardController />
            </div>
        </div>
    );
};

export default ShareInsightsCard;
