import React, { useState } from 'react';
import useManagedBoost from '../../hooks/useManagedBoost';

import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import Plus from 'learn-card-base/svgs/Plus';
import X from 'learn-card-base/svgs/X';
import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import { Checkmark } from '@learncard/react';
import { Boost } from '@learncard/types';

import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
} from '../../components/boost/boost-options/boostOptions';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { LCNProfile } from '@learncard/types';

type AdminManagedBoostRowProps = {
    boost?: Boost;
    boostUri?: string;
    category?: BoostCategoryOptionsEnum;
    actionButtonOverride?: { text: string; onClick: (boost: Boost) => void };
    selectModeOptions?: {
        selectedUris: string[];
        handleAdd: (uri: string) => void;
        handleRemove: (uri: string) => void;
    };
    className?: string;
    hideButtons?: boolean;
    issuerProfileOverride?: LCNProfile;
    children?: React.ReactNode;
};

const AdminManagedBoostRow: React.FC<AdminManagedBoostRowProps> = ({
    category,
    boost,
    boostUri,
    actionButtonOverride,
    selectModeOptions,
    className = '',
    hideButtons,
    issuerProfileOverride,
    children,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    boost = boost || { uri: boostUri }; // useManagedBoost will take care of everything if we give it the uri

    const {
        cred,
        thumbImage,
        isDraft,
        isLive,
        handleOptionsMenu,
        handleEditOnClick,
        handleIssueOnClick,
        presentManagedBoostModal,
    } = useManagedBoost(boost, {
        categoryType: category,
        disableLoadingLine: true,
        issuerProfileOverride,
    });

    category = category || getDefaultCategoryForCredential(cred);
    const { subColor } = boostCategoryOptions[category];

    if (!cred?.name) {
        return <BoostSkeleton containerClassName="w-full h-[46px] rounded-[10px]" />;
    }

    const isSelectMode = !!selectModeOptions;
    const isSelected = selectModeOptions?.selectedUris.includes(boost.uri);

    return (
        <>
            <div
                role="button"
                onClick={presentManagedBoostModal}
                className={`bg-${subColor} text-black px-[10px] py-[5px] rounded-[10px] w-full flex gap-[10px] items-center ${className}`}
            >
                <img src={thumbImage} className="h-[36px] w-[36px] rounded-full" />
                {cred?.name}

                {!hideButtons && (
                    <>
                        <div className="ml-auto flex gap-[5px]">
                            {!actionButtonOverride && !isSelectMode && (
                                <>
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
                                </>
                            )}
                            {actionButtonOverride && !isSelectMode && (
                                <button
                                    className="bg-white px-[10px] py-[3px] rounded-full shadow-box-bottom"
                                    onClick={e => {
                                        e.stopPropagation();
                                        actionButtonOverride.onClick(boost);
                                    }}
                                >
                                    {actionButtonOverride.text}
                                </button>
                            )}
                            {isSelectMode && (
                                <>
                                    {isSelected && (
                                        <button
                                            className="bg-emerald-700 text-white px-[10px] py-[10px] rounded-full shadow-box-bottom hover:bg-red-600"
                                            onClick={e => {
                                                e.stopPropagation();
                                                selectModeOptions.handleRemove(boost.uri);
                                            }}
                                            onMouseEnter={() => {
                                                if (isSelected) {
                                                    setIsHovered(true);
                                                }
                                            }}
                                            onMouseLeave={() => setIsHovered(false)}
                                        >
                                            {isHovered ? (
                                                <X className="h-[20px] w-[20px]" />
                                            ) : (
                                                <Checkmark className="h-[20px] w-[20px]" />
                                            )}
                                        </button>
                                    )}
                                    {!isSelected && (
                                        <button
                                            className="bg-white px-[10px] py-[10px] rounded-full shadow-box-bottom"
                                            onClick={e => {
                                                e.stopPropagation();
                                                selectModeOptions.handleAdd(boost.uri);
                                            }}
                                        >
                                            <Plus className="h-[20px] w-[20px]" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
            {children}
        </>
    );
};

export default AdminManagedBoostRow;
