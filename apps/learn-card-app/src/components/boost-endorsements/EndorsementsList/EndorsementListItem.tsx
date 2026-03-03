import React from 'react';

import EndorsementBadge from '../EndorsementBadge';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';

import { VC } from '@learncard/types';

import { CredentialCategoryEnum, useGetVCInfo } from 'learn-card-base';

export const EndorsementListItem: React.FC<{
    endorsement: VC; // endorsement VC stored
    metadata?: any; // item stored in index
}> = ({ endorsement, metadata }) => {
    const { issuerName, issuerProfileImageElement } = useGetVCInfo(
        endorsement,
        CredentialCategoryEnum.achievement
    );

    return (
        <div className="flex items-start justify-start w-full gap-4">
            <div className="w-[40px] h-[40px] min-w-[40px] min-h-[40px] overflow-hidden rounded-full">
                {issuerProfileImageElement}
            </div>
            <div className="flex flex-col items-start justify-center">
                <p className="flex items-center text-sm font-semibold text-grayscale-900 text-left gap-1">
                    <EndorsmentThumbWithCircle fill="#2DD4BF" className="text-white" /> {issuerName}
                </p>
                <p className="text-sm text-grayscale-700 line-clamp-3 text-left italic">
                    {endorsement?.description}
                </p>
            </div>
        </div>
    );
};

export default EndorsementListItem;
