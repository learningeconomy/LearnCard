import React from 'react';
import useManagedBoost from '../../hooks/useManagedBoost';

import { BoostCategoryOptionsEnum, boostCategoryMetadata } from 'learn-card-base';

import ThreeDots from 'learn-card-base/svgs/ThreeDots';

import { Boost } from '@learncard/types';
import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import { boostCategoryOptions } from '../../components/boost/boost-options/boostOptions';

type AdminManagedBoostRowProps = {
    category: BoostCategoryOptionsEnum;
    boost: Boost;
};

const AdminManagedBoostRow: React.FC<AdminManagedBoostRowProps> = ({ category, boost }) => {
    const { subColor } = boostCategoryOptions[category];

    const {
        cred,
        thumbImage,
        isDraft,
        isLive,
        handleEditOnClick,
        handleIssueOnClick,
        handleOptionsMenu,
        presentManagedBoostModal,
    } = useManagedBoost(boost, {
        categoryType: boostCategoryMetadata[category].credentialType,
        disableLoadingLine: true,
    });

    if (!cred?.name) {
        return <BoostSkeleton containerClassName="w-full min-w-[400px] h-[46px] rounded-[10px]" />;
    }

    return (
        <div
            role="button"
            onClick={presentManagedBoostModal}
            className={`bg-${subColor} text-black px-[10px] py-[5px] rounded-[10px] w-[500px] flex gap-[10px] items-center`}
        >
            <img src={thumbImage} className="h-[36px] w-[36px] rounded-full" />
            {cred?.name}

            <div className="ml-auto flex gap-[5px]">
                {isDraft && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            handleEditOnClick();
                        }}
                        className="bg-white px-[10px] py-[3px] rounded-full shadow-box-bottom"
                    >
                        Edit
                    </button>
                )}
                {isLive && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            handleIssueOnClick();
                        }}
                        className="bg-white px-[10px] py-[3px] rounded-full shadow-box-bottom"
                    >
                        Issue
                    </button>
                )}

                <button
                    onClick={e => {
                        e.stopPropagation();
                        handleOptionsMenu();
                    }}
                >
                    <ThreeDots className="text-grayscale-900 opacity-60" />
                </button>
            </div>
        </div>
    );
};

export default AdminManagedBoostRow;
