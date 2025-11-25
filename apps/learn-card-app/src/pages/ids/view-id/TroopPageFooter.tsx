import React from 'react';
import { useModal } from 'learn-card-base';

import useEditTroopId from '../../hooks/useEditTroopId';
import troopPageStore, { ScoutsRoleEnum } from '../../stores/troopPageStore';

import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import X from 'learn-card-base/svgs/X';
import { getScoutsRole } from '../../helpers/troop.helpers';
import { VC } from '@learncard/types';

type TroopPageFooterProps = {
    credential: VC;
    uri: string;
    handleShare: () => void;
};

const TroopPageFooter: React.FC<TroopPageFooterProps> = ({ credential, uri, handleShare }) => {
    const { closeModal } = useModal();
    const showIdDetails = troopPageStore.use.showIdDetails();
    const role = getScoutsRole(credential);

    console.log('//troop page footer uri', uri);

    const { openEditTroopOrNetworkModal } = useEditTroopId(credential, uri);

    const closeTroopPage = () => {
        if (showIdDetails) {
            setTimeout(() => {
                troopPageStore.set.showIdDetails(false);
            }, 300); // match the closeModal timeout, so it doesn't flash the Troops page before closing
        }

        closeModal();
    };

    return (
        <footer className="w-full bg-white bg-opacity-70 border-t-[1px] border-solid border-white sticky bottom-0 p-[20px] backdrop-blur-[10px] h-[85px]">
            <div className="max-w-[600px] mx-auto flex gap-[10px]">
                {!showIdDetails && (
                    <>
                        <button
                            onClick={closeTroopPage}
                            className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                        >
                            Close
                        </button>
                        {role !== ScoutsRoleEnum.scout && (
                            <button
                                onClick={openEditTroopOrNetworkModal}
                                className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                            >
                                {role === ScoutsRoleEnum.leader && 'Edit Troop'}
                                {(role === ScoutsRoleEnum.national ||
                                    role === ScoutsRoleEnum.global) &&
                                    'Edit Network'}
                            </button>
                        )}
                        <button className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom">
                            <ThreeDots />
                        </button>
                    </>
                )}
                {showIdDetails && (
                    <>
                        <button
                            onClick={closeTroopPage}
                            className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom"
                        >
                            <X className="h-[20px] w-[20px]" />
                        </button>
                        <button
                            onClick={() => {
                                troopPageStore.set.showIdDetails(false);
                            }}
                            className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleShare}
                            className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center"
                        >
                            Share
                            <ReplyIcon />
                        </button>
                        <button className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom">
                            <ThreeDots />
                        </button>
                    </>
                )}
            </div>
        </footer>
    );
};

export default TroopPageFooter;
