import React from 'react';

import { useGetVCInfo, CredentialCategoryEnum, UserProfilePicture } from 'learn-card-base';

import { VC } from '@learncard/types';
import { EndorsementFormModeEnum } from '../EndorsementForm/endorsement-state.helpers';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';

export const EndorsementFormHeader: React.FC<{
    credential: VC;
    endorsementVC?: VC;
    categoryType: CredentialCategoryEnum;
    isRequest?: boolean;
    mode?: EndorsementFormModeEnum;
}> = ({ credential, endorsementVC, categoryType, isRequest, mode }) => {
    const {
        issueeProfile,
        issueeName,
        title: credentialTitle,
        subjectProfileImageElement,
    } = useGetVCInfo(credential);
    const { issuerName: endorserName } = useGetVCInfo(endorsementVC);

    let title = 'Endorsement Request';
    let text = isRequest ? (
        <p className="text-sm text-grayscale-600 font-poppins text-left">
            <span className="font-semibold">{issueeProfile?.displayName || issueeName}</span> has
            requested an endorsement from you for{' '}
            <span className="font-semibold">{credentialTitle}</span>
        </p>
    ) : (
        <p className="text-sm text-grayscale-600 font-poppins text-left">
            You’re endorsing{' '}
            <span className="font-semibold">{issueeProfile?.displayName || issueeName}</span> for{' '}
            <span className="font-semibold">{credentialTitle}</span>
        </p>
    );

    if (mode === EndorsementFormModeEnum.review) {
        title = 'Review Endorsement';
        text = (
            <p className="text-sm text-grayscale-600 font-poppins text-left">
                <span className="font-semibold">{endorserName}</span> has written an endorsement for{' '}
                <span className="font-semibold">{credentialTitle}</span>
            </p>
        );
    }

    let headerImage = issueeProfile?.image ? (
        <UserProfilePicture
            user={{
                profileId: issueeProfile?.profileId,
                name: issueeProfile?.displayName,
                image: issueeProfile?.image,
            }}
            customImageClass="w-full h-full object-cover"
            customContainerClass="flex items-center justify-center h-full w-full text-white font-medium text-4xl"
        />
    ) : (
        subjectProfileImageElement
    );

    if (endorsementVC) {
        headerImage = (
            <EndorsmentThumbWithCircle
                fill="#E2E3E9"
                className="w-[60px] h-[60px] text-grayscale-900"
            />
        );
    }

    return (
        <div className="ion-padding bg-white safe-area-top-margin rounded-b-[30px] overflow-hidden shadow-md min-h-[110px] w-full">
            <div className="flex items-center justify-normal p-2">
                <div className="flex items-start gap-4">
                    <div className="w-[60px] h-[60px] min-w-[60px] min-h-[60px] flex items-center justify-center">
                        {headerImage}
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <h5 className="text-[20px] font-semibold text-grayscale-800 font-poppins mb-1">
                            {title}
                        </h5>
                        {text}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EndorsementFormHeader;
