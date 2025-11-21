import React from 'react';

import BoostSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';
import Pencil from '../../../svgs/Pencil';
import { VC } from '@learncard/types';

export const CustomManagedBoostButton: React.FC<{
    showSkeleton: boolean;
    isDraft: boolean;
    isLive: boolean;
    buttonBgColor: string;
    handleEditOnClick: () => void;
    handleShowShortBoostModal: () => void;
    boostVC?: VC;
}> = ({
    showSkeleton,
    isDraft,
    isLive,
    buttonBgColor,
    handleEditOnClick,
    handleShowShortBoostModal,
    boostVC,
}) => {
    if (showSkeleton) {
        return (
            <BoostSkeleton
                containerClassName="small-boost-boost-btn flex boost-btn-click rounded-[40px] w-[140px] h-[48px] text-white flex justify-center items-center"
                skeletonStyles={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '100px',
                }}
            />
        );
    }

    if (!showSkeleton && isDraft) {
        return (
            <button
                className="flex boost-btn-click rounded-[40px] w-[140px] h-[32px] justify-center items-center text-grayscale-900 bg-grayscale-200 mb-2 font-poppins font-semibold text-[14px]"
                onClick={e => {
                    e.stopPropagation();
                    handleEditOnClick();
                }}
            >
                Edit Draft
                <Pencil className="h-[20px] w-[20px] ml-[5px]" />
            </button>
        );
    }

    if (isLive) {
        return (
            <div className="flex w-full flex-col items-center justify-center">
                <div
                    onClick={boostVC ? () => handleShowShortBoostModal() : undefined}
                    className="cursor-pointer small-boost-boost-btn boost-btn-click rounded-[35px] w-[140px] h-[32px] flex gap-[5px] justify-center items-center border-[2px]"
                    style={{
                        color: buttonBgColor,
                        borderColor: buttonBgColor,
                    }}
                >
                    <>
                        <span className="text-[14px] font-semibold font-poppins">Issue</span>
                        <GearPlusIcon
                            className="h-[25px] w-[25px] text-white"
                            fill={buttonBgColor}
                        />
                    </>
                </div>
            </div>
        );
    }

    return <></>;
};

export default CustomManagedBoostButton;
