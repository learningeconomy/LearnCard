import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import useBoost from '../hooks/useBoost';
import useManagedBoost from 'apps/learn-card-app/src/hooks/useManagedBoost';

import { IonSkeletonText } from '@ionic/react';
import { BoostIssuanceLoading } from '../boostLoader/BoostLoader';
import CredentialGeneralPlus from '../../svgs/CredentialGeneralPlus';

import { useModal, ModalTypes, CredentialCategory, categoryMetadata } from 'learn-card-base';

import { closeAll } from 'apps/learn-card-app/src/helpers/uiHelpers';
import { getAchievementTypeDisplayText } from 'learn-card-base/helpers/credentialHelpers';
import { VC, Boost } from '@learncard/types';

type BoostTemplateListItemProps = {
    boost: Boost;
    boostVC?: VC;
    defaultImg: string;
    categoryType: CredentialCategory;
    userToBoostProfileId?: string;
    loading?: boolean;
};

export const BoostTemplateListItem: React.FC<BoostTemplateListItemProps> = ({
    boost,
    boostVC: _boostVC,
    defaultImg,
    categoryType,
    userToBoostProfileId,
    loading,
}) => {
    const history = useHistory();
    const { newModal, closeAllModals } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const {
        boostVC,
        showSkeleton,
        badgeThumbnail,
        presentManagedBoostModal,
        handlePresentShortBoostModal,
    } = useManagedBoost(boost, { boostVC: _boostVC, categoryType, loading, defaultImg });

    const [issueLoading, setIssueLoading] = useState(false);
    const { handleSubmitExistingBoostOther } = useBoost(history);

    const handleShowShortBoostModal = () => {
        closeAll();
        handlePresentShortBoostModal();
    };

    const handleCardBoostClick = async () => {
        if (userToBoostProfileId) {
            // immediately issue the boost to the chosen user
            setIssueLoading(true);
            newModal(<BoostIssuanceLoading loading={issueLoading} />);
            await handleSubmitExistingBoostOther(
                [{ profileId: userToBoostProfileId }],
                boost?.uri,
                boost?.status
            );
            setIssueLoading(false);
            closeAll?.();
            closeAllModals();
        } else {
            // show "Who do you want to Boost?" modal
            handleShowShortBoostModal();
        }
    };

    const innerOnClick = () => {
        if (showSkeleton) return;
        presentManagedBoostModal();
    };

    const cardTitle = boost?.name || boostVC?.credentialSubject?.achievement?.name;

    const type = getAchievementTypeDisplayText(
        boostVC?.credentialSubject?.achievement?.achievementType,
        categoryMetadata[categoryType].value
    );

    const { color } = categoryMetadata[categoryType];

    if (showSkeleton) {
        return (
            <div
                role="button"
                onClick={innerOnClick}
                className="flex items-center gap-[10px] w-full p-[10px] rounded-[15px] bg-white shadow-bottom-2-4"
            >
                <IonSkeletonText
                    animated={true}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '100%',
                        margin: '0',
                        flexShrink: 0,
                    }}
                />
                <div className="flex flex-col font-poppins grow">
                    <IonSkeletonText
                        animated={true}
                        style={{ width: '90%', height: '22px', margin: '0' }}
                    />
                    <IonSkeletonText
                        animated={true}
                        style={{
                            width: '60%',
                            height: '19px',
                            marginTop: '2px',
                            marginBottom: '0',
                        }}
                    />
                </div>
                {/* <IonSkeletonText
                    animated={true}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '100%',
                        marginTop: '0',
                        marginBottom: '0',
                        marginLeft: 'auto',
                    }}
                /> */}
            </div>
        );
    }

    return (
        <div
            role="button"
            onClick={handleCardBoostClick}
            className="flex items-center gap-[10px] w-full p-[10px] rounded-[15px] bg-white shadow-bottom-2-4"
        >
            <img src={badgeThumbnail} className="rounded-full object-cover h-[40px] w-[40px]" />
            <div className="flex flex-col font-poppins">
                <h3 className="text-[16.5px] font-[600] text-grayscale-900 line-clamp-1">
                    {cardTitle}
                </h3>
                <p className="text-[13.5px] font-[600] text-grayscale-700 line-clamp-1">
                    {type}
                    {boost?.status === 'DRAFT' && ' • Draft'}
                </p>
            </div>
            <button
                onClick={e => {
                    e.stopPropagation();
                    handleCardBoostClick();
                }}
                className={`ml-auto bg-${color} p-[5px] rounded-full`}
            >
                <CredentialGeneralPlus className="h-[30px] w-[30px]" />
            </button>
        </div>
    );
};

export default BoostTemplateListItem;
