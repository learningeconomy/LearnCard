import React, { useState } from 'react';
import moment from 'moment';

import TrashBin from 'learn-card-base/svgs/TrashBin';
import DeleteEndorsementOverlay from './DeleteEndorsementOverlay';
import EndorsmentThumbWithCircle from 'learn-card-base/svgs/EndorsementThumb';

import { BoostEndorsement } from '../boost-endorsement.helpers';
import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useGetVCInfo, UserProfilePicture } from 'learn-card-base';
import EndorsementButton from '../EndorsementButton';

const EndorsementDeletedCard: React.FC<{
    endorsement: BoostEndorsement;
    credential: VC;
    categoryType?: CredentialCategoryEnum;
}> = ({ endorsement, credential, categoryType }) => {
    const { isCurrentUserSubject } = useGetVCInfo(credential, categoryType);

    const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);

    const { user, description, qualifications, mediaAttachments, status, date, deleted } =
        endorsement;

    const endorserStyles = 'bg-grayscale-100';
    const endorserIconStyles = 'text-grayscale-700';

    return (
        <div
            className={`py-4 gap-4 bg-white flex flex-col items-start rounded-[20px] w-full shadow-bottom-2-4 relative overflow-hidden px-4 ${
                showDeleteOverlay ? 'py-6' : 'py-4'
            }`}
        >
            {/* delete overlay */}
            {showDeleteOverlay && (
                <DeleteEndorsementOverlay
                    setShowDeleteOverlay={setShowDeleteOverlay}
                    showDeleteOverlay={showDeleteOverlay}
                    hideIcon
                />
            )}

            <div className="w-full flex items-center justify-between">
                <div
                    className={`flex items-center justify-between px-2 py-1 rounded-[5px] ${endorserStyles}`}
                >
                    <p className="text-xs flex items-center font-semibold text-grayscale-700 uppercase">
                        <EndorsmentThumbWithCircle className={`mr-1 ${endorserIconStyles}`} />{' '}
                        Deleted on {moment(date).format('MMM D, YYYY')}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                    {isCurrentUserSubject && (
                        <button
                            onClick={() => setShowDeleteOverlay(true)}
                            className="text-xs font-semibold"
                        >
                            <TrashBin className="w-6 h-6 text-grayscale-700" />
                        </button>
                    )}
                </div>
            </div>

            <div className={`flex items-start justify-start w-full gap-4`}>
                <UserProfilePicture
                    user={{ name: endorsement.user.name, image: endorsement.user.image }}
                    customContainerClass="w-[40px] h-[40px] min-w-[40px] min-h-[40px]"
                />
                <div className="flex flex-col items-start justify-center">
                    <p className="flex items-center text-sm font-semibold text-grayscale-900 text-left gap-1">
                        {endorsement.user.name}
                    </p>
                    <p className="text-sm text-grayscale-700 line-clamp-3 text-left">
                        {endorsement?.relationship?.label}
                    </p>
                </div>
            </div>

            <EndorsementButton
                endorsement={endorsement}
                credential={credential}
                categoryType={categoryType}
                onClick={() => {}}
            />
        </div>
    );
};

export default EndorsementDeletedCard;
