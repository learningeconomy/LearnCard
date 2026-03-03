import React from 'react';

// import useTroopMembers from '../../hooks/useTroopMembers';
// import useGetTroopNetwork from '../../hooks/useGetTroopNetwork';

import IdDisplay from './IdDisplay';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';
import IdStatusButton from './IdStatusButton';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import IdViewDivetFrame from 'apps/learn-card-app/src/components/svgs/IdViewDivetFrame';

// import { getRoleFromCred } from '../../helpers/troop.helpers';
import {
    useCountBoostChildren,
    conditionalPluralize,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import { VC } from '@learncard/types';
// import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';

type ViewIdTemplateProps = {
    credential: VC; // for the ID footer
    boostUri?: string;

    idMainText: string; // line 1
    idSubText?: string; // line 2 override
    idExtraInfo?: React.ReactNode; // line 3 override
    idThumb: string;

    divetButton: React.ReactNode;

    isClaimMode?: boolean;
    isAlreadyClaimed?: boolean;
    isClaiming?: boolean;
    handleClaim?: () => void;

    isGeneralView?: boolean;
    skipProofCheck?: boolean;
};

const ViewIdTemplate: React.FC<ViewIdTemplateProps> = ({
    credential,
    boostUri,

    idMainText,
    idSubText,
    idExtraInfo,
    idThumb,
    divetButton,

    isClaimMode = false,
    isAlreadyClaimed,
    isClaiming,
    handleClaim,

    isGeneralView = false,
    skipProofCheck,
}) => {
    boostUri = boostUri ?? credential?.boostId;

    // const network = useGetTroopNetwork(credential, boostUri);
    // const networkName = network?.name ?? '...';
    const networkName = 'TODO';

    // const { scoutCount, leaderCount, currentBoostCount } = useTroopMembers(
    //     credential,
    //     undefined,
    //     boostUri
    // );

    // const role = getRoleFromCred(credential);
    // const isNational = role === ScoutsRoleEnum.national;
    // const isGlobal = role === ScoutsRoleEnum.global;
    // const isNetwork = isNational || isGlobal;

    // const { data: nationalTroopsCount } = useCountBoostChildren(boostUri, 2, {
    //     type: AchievementTypes.Troop,
    // });
    // const { data: globalTroopsCount } = useCountBoostChildren(boostUri, 2, {
    //     type: AchievementTypes.Troop,
    // });
    // const { data: globalNetworkCount } = useCountBoostChildren(boostUri, 1, {
    //     type: AchievementTypes.Network,
    // });
    // const { data: nationalBadgeCount } = useCountBoostChildren(boostUri, 2, {
    //     category: BoostCategoryOptionsEnum.meritBadge,
    // });

    // let claimButtonNoun: string;
    // let claimButtonColor: string;
    // if (isGlobal) {
    //     claimButtonNoun = 'Network';
    //     claimButtonColor = 'bg-sp-purple-base';
    // } else if (isNational) {
    //     claimButtonNoun = 'Network';
    //     claimButtonColor = 'bg-sp-fire-red';
    // } else {
    //     claimButtonNoun = 'Troop';
    //     claimButtonColor = 'bg-sp-green-forest';
    // }

    return (
        <div className="h-full flex items-center justify-center">
            <div className="rounded-[20px] shadow-box-bottom overflow-hidden flex flex-col max-w-[335px]">
                <div className="flex flex-col bg-white bg-opacity-70 backdrop-blur-[10px]">
                    <div className="p-[15px]">
                        <IdDisplay
                            credential={credential}
                            name={idMainText}
                            thumbSrc={idThumb}
                            subTextOverride={idSubText}
                            issuedDateOverride={idExtraInfo}
                        />
                    </div>

                    <div className="flex justify-center relative pb-[10px]">
                        {divetButton || <div className="h-[40px]" />}
                        <IdViewDivetFrame className="absolute bottom-0 pointer-events-none" />
                    </div>
                </div>

                <div className="bg-white relative px-[20px] flex flex-col gap-[10px] pb-[10px]">
                    <IdStatusButton
                        credential={credential}
                        checkProof={!isGeneralView && !isClaimMode && !skipProofCheck}
                    />

                    <div className="flex flex-col items-center gap-[7px]">
                        <div className="flex flex-col items-center">
                            <span className="flex font-notoSans text-[22px] text-grayscale-900 gap-[3px] items-center leading-[130%] tracking-[-0.25px] pt-[10px]">
                                <CredentialVerificationDisplay
                                    credential={credential}
                                    iconClassName="!h-[15px] !w-[15px]"
                                />
                                {credential?.name}
                            </span>
                            <span className="font-notoSans text-grayscale-800 font-[600] line-clamp-1 text-[14px]">
                                {networkName}
                            </span>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-grayscale-700 font-notoSans text-[12px] font-[600]">
                                {conditionalPluralize(123, 'Admin')}
                            </span>

                            {/* TODO real numbers */}
                            <span className="text-grayscale-900 font-notoSans text-[12px] font-[600]">
                                111 Social Boosts • 222 Merit Badges
                            </span>
                        </div>

                        {isClaimMode && (
                            <button
                                onClick={handleClaim}
                                className={`text-white font-notoSans text-[17px] font-[600] leadeing-[24px] tracking-[0.25px] w-full rounded-[30px] p-[7px] disabled:opacity-60 ${claimButtonColor}`}
                                disabled={isClaiming || isAlreadyClaimed}
                            >
                                {isAlreadyClaimed && 'Joined'}
                                {!isAlreadyClaimed && (
                                    <>
                                        {isClaiming ? 'Joining ' : 'Join '}
                                        TODO...
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="pt-[10px] border-t-[1px] border-solid border-grayscale-200 flex justify-center">
                        <CredentialVerificationDisplay
                            credential={credential}
                            showText
                            className="!text-[12px] font-poppins font-[500]"
                            iconClassName="!h-[18px] !w-[18px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewIdTemplate;
