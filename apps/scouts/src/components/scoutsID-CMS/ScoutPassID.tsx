import React from 'react';

import { VerifiedBadgeWhiteBackground } from 'learn-card-base/svgs/VerifiedBadge';

import { getIdBackgroundStyles } from './scouts-cms.helpers';
import { userAccount, UserCMSAppearance } from './scouts-cms.helpers';
import { UserProfilePicture } from 'learn-card-base';

import ScoutsLogo from '../svgs/ScoutsLogo';

const ScoutPassID: React.FC<{
    user: userAccount;
    scoutPassID: UserCMSAppearance;
    showIssueDate?: boolean;
}> = ({ user, scoutPassID, showIssueDate = true }) => {
    const userName = user?.name ?? '';
    const userHandle = user?.profileId ?? '';
    const image = user?.image ?? '';

    const backgroundStyles = getIdBackgroundStyles(scoutPassID);

    return (
        <div className="rounded-[15px] flex flex-col overflow-hidden relative shadow-bottom-4-4">
            <div
                className={`flex gap-[10px] px-[10px] py-[27.5px] bg-contain items-center`}
                style={backgroundStyles}
            >
                <UserProfilePicture
                    customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[80px] min-h-[80px]"
                    customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[80px] min-h-[80px]"
                    customSize={500}
                    user={{
                        name: userName,
                        image: image,
                    }}
                />

                <div className="flex flex-col">
                    {userName && (
                        <span className="font-notoSans font-[600] text-[14px]">{userName}</span>
                    )}

                    {userHandle && (
                        <span className="font-notoSans font-[600] text-[12px]">{userHandle}</span>
                    )}

                    {showIssueDate && (
                        <span className="font-notoSans font-[600] text-[12px]">Issued (Date)</span>
                    )}
                </div>
            </div>
            <div
                className={`flex flex-col justify-center px-[10px] py-[4px] h-[45px]`}
                style={{ backgroundColor: scoutPassID?.accentColor }}
            >
                <span
                    className={`flex items-center gap-[5px] font-notoSans text-[14px] font-[600]`}
                    style={{ color: scoutPassID?.accentFontColor }}
                >
                    <VerifiedBadgeWhiteBackground />
                    ScoutPass
                </span>
            </div>

            <div
                className={`rounded-full overflow-hidden h-[54px] w-[54px] absolute right-[10px] bottom-[10px] flex items-center justify-center`}
                style={{ backgroundColor: scoutPassID?.accentColor }}
            >
                <ScoutsLogo className="rounded-full h-[50px] w-[50px]" fill="#622599" />
            </div>
        </div>
    );
};

export default ScoutPassID;
