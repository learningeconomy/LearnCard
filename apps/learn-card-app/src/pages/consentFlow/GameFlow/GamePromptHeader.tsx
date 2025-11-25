import React from 'react';

import LearnCardAppIcon from '../../../assets/images/lca-icon-v2.png';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import Plus from 'learn-card-base/svgs/Plus';
import X from 'apps/learn-card-app/src/components/svgs/X';
import { UserProfilePicture } from 'learn-card-base';
import { LCNProfile } from '@learncard/types';

type GamePromptHeaderProps = {
    gameImage: string;
    user?: LCNProfile;
    showPlus?: boolean;
    showX?: boolean;
    showCheckmark?: boolean;
};

export const GamePromptHeader: React.FC<GamePromptHeaderProps> = ({
    gameImage,
    user,
    showPlus = true,
    showX = false,
    showCheckmark = false,
}) => {
    return (
        <div className="w-full flex items-center justify-center">
            <div className="flex items-center justify-center relative">
                <div className="w-[100px] h-[100px] rounded-full overflow-hidden">
                    <img src={gameImage} alt="Game Icon" className="h-full w-full object-cover" />
                </div>

                {showPlus && !showX && (
                    <div className="w-[25px] h-[25px] p-[2px] rounded-full overflow-hidden border-b-solid baorder-white border-2 absolute bottom-[10px] right-[0px] shadow-bottom bg-white z-10">
                        <Plus className="text-grayscale-900" />
                    </div>
                )}

                {showX && (
                    <div className="w-[25px] h-[25px] p-[2px] rounded-full overflow-hidden border-b-solid baorder-white border-2 absolute bottom-[10px] right-[0px] shadow-bottom bg-red-600 z-20">
                        <X className="white text-white" />
                    </div>
                )}

                {showCheckmark && (
                    <div className="w-[25px] h-[25px] p-[2px] rounded-full overflow-hidden border-b-solid baorder-white border-2 absolute bottom-[10px] right-[0px] shadow-bottom bg-emerald-700 z-20">
                        <Checkmark className="white text-white" />
                    </div>
                )}

                {user ? (
                    <UserProfilePicture
                        customContainerClass="w-[50px] h-[50px] rounded-full overflow-hidden border-b-solid baorder-white border-2 !absolute bottom-0 right-[-40px] shadow-bottom text-white font-medium text-2xl"
                        customImageClass="h-full w-full object-cover"
                        customSize={120}
                        user={user}
                    />
                ) : (
                    <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden border-b-solid border-white border-[2px] absolute bottom-0 right-[-40px] drop-shadow-bottom bg-white">
                        <img
                            src={LearnCardAppIcon}
                            alt="LearnCard App Icon"
                            className="h-full w-full object-contain"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamePromptHeader;
