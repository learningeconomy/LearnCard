import React from 'react';
import Plus from 'learn-card-base/svgs/Plus';
import LearnCardAppIcon from '../../assets/images/lca-icon-v2.png';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import { ConsentFlowContractDetails } from '@learncard/types';
import { LaunchPadAppListItem, useCurrentUser, UserProfilePicture } from 'learn-card-base';

type ConsentFlowHeaderProps = {
    contractDetails?: ConsentFlowContractDetails;
    showCurrentUserPic?: boolean;
    app?: LaunchPadAppListItem;
    contractImageOnly?: boolean;
};

const ConsentFlowHeader: React.FC<ConsentFlowHeaderProps> = ({
    contractDetails,
    showCurrentUserPic,
    app,
    contractImageOnly,
}) => {
    const currentUser = useCurrentUser();

    const { name: contractName, image: contractImage } = contractDetails ?? {};
    const { name: appName, img: appImage } = app ?? {};

    const name = appName ?? contractName;
    const image = appImage ?? contractImage;

    return (
        <header className="flex items-center flex-col gap-[15px] w-full">
            <div
                className={`flex items-center justify-start ${
                    contractImageOnly ? 'w-[100px]' : 'w-[135px]'
                }`}
            >
                <div className="flex items-end justify-center relative">
                    <div className="w-[100px] h-[100px] rounded-[15px] border-[1px] border-grayscale-200 border-solid overflow-hidden">
                        {image ? (
                            <img
                                src={image}
                                alt="Contract Icon"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <img
                                src={EmptyImage}
                                alt="Contract Icon"
                                className="h-full w-full object-contain p-2"
                            />
                        )}
                    </div>

                    {!contractImageOnly && (
                        <>
                            <div className="w-[20px] h-[20px] p-[2px] rounded-full overflow-hidden absolute bottom-[12px] right-[-2px] shadow-box-bottom bg-white z-10">
                                <Plus className="text-grayscale-900" />
                            </div>

                            {showCurrentUserPic && (
                                <div className="w-[50px] h-[50px] rounded-full overflow-hidden border-solid border-white border-[2px] absolute bottom-[0px] right-[-40px]">
                                    <UserProfilePicture
                                        customContainerClass="w-full h-full text-white font-medium text-2xl"
                                        customImageClass="object-cover h-full w-full"
                                        customSize={120}
                                        user={currentUser}
                                    />
                                </div>
                            )}
                            {!showCurrentUserPic && (
                                <div className="w-[50px] h-[50px] rounded-[10px] overflow-hidden border-solid border-white border-[2px] absolute bottom-[0px] right-[-40px] drop-shadow-bottom bg-white">
                                    <img
                                        src={LearnCardAppIcon}
                                        alt="LearnCard App Icon"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <span className="text-grayscale-900 font-notoSans text-[22px] font-[600] leading-[130%] text-center tracking-[-0.25px]">
                {name}!!!!????????
            </span>
        </header>
    );
};

export default ConsentFlowHeader;
