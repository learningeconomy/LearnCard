import React from 'react';
import {
    ProfilePicture,
    switchedProfileStore,
    useCurrentUser,
    useGetCurrentLCNUser,
    walletStore,
} from 'learn-card-base';
import LearnCardBrandmark from '../svgs/LearnCardBrandmark';
import { getIdBackgroundStyles } from '../learncardID-CMS/learncard-cms.helpers';
import { LCNProfile } from '@learncard/types';

type LearnCardIdViewProps = {
    user?: LCNProfile;
};

const LearnCardIdView: React.FC<LearnCardIdViewProps> = ({ user }) => {
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { displayName, profileId } = currentLCNUser ?? {};

    let idName = displayName || currentUser?.name || currentUser?.email || currentUser?.phoneNumber;
    idName = idName?.length > 20 ? `${idName?.substring(0, 17)}...` : idName;

    if (user?.displayName) idName = user?.displayName;

    const hasParentSwitchedProfiles = switchedProfileStore.use.isSwitchedProfile();

    const backgroundStyles = getIdBackgroundStyles(user?.display ?? currentLCNUser?.display);

    const displayStyles = user?.display ?? currentLCNUser?.display;
    return (
        <div className="rounded-[15px] flex flex-col overflow-hidden relative shadow-bottom-4-4 min-w-[305px]">
            <div
                className="flex gap-[10px] px-[10px] py-[27.5px] bg-contain items-center bg-grayscale-900"
                style={{ ...backgroundStyles, color: displayStyles?.fontColor }}
            >
                <ProfilePicture
                    customContainerClass="h-[80px] w-[80px] shrink-0 text-[40px]"
                    customImageClass="h-[80px] w-[80px] shrink-0 text-[40px] object-cover"
                    customSize={120}
                    overrideSrc={!!user}
                    overrideSrcURL={user?.image}
                />

                <div className="flex flex-col items-start pr-[10px] overflow-hidden text-white">
                    <span className="font-notoSans font-[600] text-[17px] leading-[24px] tracking-[0.25px]">
                        {idName}
                    </span>
                    {!hasParentSwitchedProfiles && !user && (
                        <span className="font-notoSans font-[600] text-[12px]">@{profileId}</span>
                    )}

                    {/* {issuedDateOverride || (
                        <span className="font-notoSans font-[600] text-[12px]">
                            Issued {issueDate || 'Unkown'}
                        </span>
                    )} */}
                </div>
            </div>

            <div
                className="flex flex-col justify-center px-[10px] py-[4px] h-[45px] bg-white"
                // style={{ backgroundColor: credential?.boostID?.accentColor }}
            >
                <span
                    className="flex items-center gap-[5px] font-notoSans text-[14px] font-[600] text-grayscale-900"
                    // style={{ color: credential?.boostID?.accentFontColor }}
                >
                    {/* <CredentialVerificationDisplay
                                credential={credential}
                                iconClassName="!h-[17px] !w-[17px]"
                            /> */}
                    LearnCard
                </span>
            </div>

            <div
                className="rounded-full h-[54px] w-[54px] absolute right-[10px] bottom-[10px] flex items-center justify-center bg-white"
                // style={{ backgroundColor: credential?.boostID?.accentColor }}
            >
                <LearnCardBrandmark className="rounded-full h-[50px] w-[50px]" />
            </div>
        </div>
    );
};

export default LearnCardIdView;
