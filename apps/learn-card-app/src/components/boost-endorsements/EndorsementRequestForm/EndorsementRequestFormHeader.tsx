import React from 'react';

import { useGetVCInfo, CredentialCategoryEnum } from 'learn-card-base';

import { VC } from '@learncard/types';

import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';

export const EndorsementRequestFormHeader: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
}> = ({ credential, categoryType }) => {
    const { title } = useGetVCInfo(credential, categoryType);

    return (
        <div className="ion-padding bg-white safe-area-top-margin rounded-b-[30px] overflow-hidden shadow-md">
            <div className="flex items-center justify-normal p-2">
                <div className="flex items-start gap-2">
                    <div className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] flex items-center justify-center">
                        <EndorsmentThumbWithCircle
                            className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] text-grayscale-900"
                            fill="#E2E3E9"
                        />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h5 className="text-[20px] font-semibold text-grayscale-800 font-poppins mb-1">
                            Endorsement Request
                        </h5>
                        <p className="text-sm text-grayscale-600 font-poppins text-left">
                            Send a request to someone who can vouch for your {categoryType},{' '}
                            <span className="font-semibold">{title}</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EndorsementRequestFormHeader;
