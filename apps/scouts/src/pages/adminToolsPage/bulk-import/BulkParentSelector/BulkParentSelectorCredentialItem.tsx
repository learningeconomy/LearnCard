import React from 'react';
import moment from 'moment';

import useManagedBoost from '../../../../hooks/useManagedBoost';
import BlueCheckMark from '../../../../components/svgs/BlueCheckMark';

import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
} from '../../../../components/boost/boost-options/boostOptions';
import { Boost } from '@learncard/types';
import { useGetCurrentLCNUser, useModal } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';

type BulkParentSelectorCredentialItemProps = {
    boost?: Boost;
    category?: BoostCategoryOptionsEnum;
    setParentUri: React.Dispatch<React.SetStateAction<string>>;
    parentUri?: string;
};

const BulkParentSelectorCredentialItem: React.FC<BulkParentSelectorCredentialItemProps> = ({
    category,
    boost,
    setParentUri,
    parentUri,
}) => {
    const { closeModal } = useModal();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { cred, thumbImage, presentManagedBoostModal } = useManagedBoost(boost, {
        categoryType: category,
        disableLoadingLine: true,
    });

    const { subColor } = boostCategoryOptions?.[category || ''];

    if (!cred?.name) return <></>;

    const issueDate = moment(cred?.issuanceDate).format('MM/DD/YYYY');
    const isSelected = parentUri === boost?.uri;

    return (
        <div
            role="button"
            onClick={() => presentManagedBoostModal()}
            className="flex items-center gap-[10px] w-full px-2 py-3 rounded-[15px] bg-white shadow-bottom-2"
        >
            <div
                className={`flex items-center  justify-center rounded-full h-[40px] w-[40px] min-h-[40px] min-w-[40px] overflow-hidden bg-${subColor}`}
            >
                <img
                    src={thumbImage}
                    alt={cred?.name}
                    className="rounded-full object-cover h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                />
            </div>

            <div className="flex flex-col font-poppins flex-1">
                <h3 className="text-[16.5px] font-[600] text-grayscale-900 line-clamp-1">
                    {cred?.name}
                </h3>
                <p className="text-sm text-grayscale-700 line-clamp-1 flex items-center gap-[5px]">
                    <BlueCheckMark /> {currentLCNUser?.displayName} • {issueDate}
                </p>
            </div>
            <button
                onClick={e => {
                    e.stopPropagation();
                    setParentUri(boost?.uri);
                    closeModal();
                }}
                className={`flex items-center justify-center rounded-full transition-colors h-[40px] w-[40px] min-h-[40px] min-w-[40px] overflow-hidden ${
                    isSelected ? 'bg-emerald-700' : 'bg-grayscale-200'
                }`}
            >
                {isSelected && <Checkmark className="w-[30px] h-[30px] text-white" />}
            </button>
        </div>
    );
};

export default BulkParentSelectorCredentialItem;
