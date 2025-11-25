import React, { useEffect, useState } from 'react';

import EndorsementForm from '../EndorsementForm/EndorsementForm';
import EndorsementBadge from '../../../assets/images/endorsement-badge.png';
import EndorsementRequestModalFooter from './EndorsementRequestModalFooter';
import DesktopLoginBG from '../../../assets/images/desktop-login-bg-alt.png';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';
import EndorsementSuccessfullRequestModal from './EndorsementSuccessfullRequestModal';
import EndorsementRequestModalSkeletonLoader from './EndorsementRequestModalSkeletonLoader';
import EndorsementFormBoostPreviewCard from '../EndorsementForm/EndorsementFormBoostPreviewCard';
import EndorsementDraftRequestSuccess from '../EndorsementRequestForm/EndorsementDraftRequestSuccess';

import {
    useGetVCInfo,
    useModal,
    ModalTypes,
    useIsLoggedIn,
    useDeviceTypeByWidth,
    UserProfilePicture,
    useWallet,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { endorsementsRequestStore } from '../../../stores/endorsementsRequestStore';
import { EndorsementState } from '../EndorsementForm/endorsement-state.helpers';
import { BoostEndorsement, BoostEndorsementStatusEnum } from '../boost-endorsement.helpers';
import { VC } from '@learncard/types';

export const EndorsementRequestModal: React.FC<{
    credential: VC;
    shareLinkInfo?: string;
    existingEndorsements?: VC[];
}> = ({ credential, shareLinkInfo, existingEndorsements }) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const { isDesktop } = useDeviceTypeByWidth();
    const categoryType = getDefaultCategoryForCredential(credential);
    const { newModal, closeModal, closeAllModals } = useModal();
    const endorsementRequestStore = endorsementsRequestStore;

    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [pendingEndorsement, setPendingEndorsement] = useState<BoostEndorsement | null>(null);

    let {
        issuerProfile,
        issueeProfile,
        issueeName,
        subjectProfileImageElement,
        // VC metadata
        title,
        loading: vcInfoLoading,
    } = useGetVCInfo(credential, categoryType);

    useEffect(() => {
        getPendingEndorsement();
    }, [issueeProfile]);

    const getPendingEndorsement = async () => {
        const wallet = await initWallet();
        // fetch sent credentials / notifications
        const sentCredentials = await wallet.invoke.getSentCredentials(
            issueeProfile?.profileId || ''
        );

        // filter for the specific credential
        const [pendingEndorsement] = await sentCredentials?.filter(
            c => c?.metadata?.credentialId === credential?.id
        );

        if (!pendingEndorsement) {
            return;
        }

        // get the endorsement request
        const pendingEndorsementRequest = await wallet.read.get(pendingEndorsement?.uri);

        const pendingEndorsementState = {
            user: {
                name: currentLCNUser?.displayName || pendingEndorsement?.from,
                image: currentLCNUser?.image,
            },
            description: pendingEndorsementRequest?.description,
            qualification: pendingEndorsementRequest?.credentialSubject?.endorsementComment,
            mediaAttachments: pendingEndorsementRequest?.credentialSubject?.evidence,
            relationship: pendingEndorsement?.metadata?.relationship,
            status: pendingEndorsement?.received
                ? BoostEndorsementStatusEnum.Approved
                : BoostEndorsementStatusEnum.Pending,
            date: pendingEndorsement?.sent,
            deleted: false,
        };
        setPendingEndorsement(pendingEndorsementState);
    };

    const handleOnSuccess = (endorsementRequest: EndorsementState) => {
        endorsementRequestStore.set.setEndorsementRequest(endorsementRequest);

        if (!isLoggedIn) {
            if (isDesktop) {
                closeAllModals();
            } else {
                closeModal();
                setShowSuccess(true);
            }
        }
    };

    const handleOpenEndorsementRequestForm = () => {
        newModal(
            <EndorsementForm
                credential={credential}
                categoryType={categoryType}
                isRequest
                onSuccess={handleOnSuccess}
                shareLinkInfo={shareLinkInfo}
            />,
            {},
            {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            }
        );
    };

    const loggedOutBGStyles = isLoggedIn
        ? {}
        : {
              background: `url(${DesktopLoginBG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
          };

    if (pendingEndorsement) {
        return (
            <EndorsementDraftRequestSuccess
                credential={credential}
                closeModal={closeModal}
                autoSend={false}
                endorsementState={pendingEndorsement}
            />
        );
    }

    if (showSuccess) {
        return <EndorsementSuccessfullRequestModal />;
    }

    return (
        <div
            className="flex h-full w-full flex-col items-center justify-center px-4"
            style={loggedOutBGStyles}
        >
            {credential ? (
                <div className="flex flex-col items-center justify-center bg-white  w-full max-w-[375px] rounded-[20px] pt-4 relative">
                    {/* endorsement badge */}
                    <img
                        src={EndorsementBadge}
                        alt="Endorsement Badge"
                        className="absolute top-[-50px] left-[50%] -translate-x-1/2"
                    />

                    {/* request info */}
                    <div className="w-full flex flex-col items-center justify-center gap-2 pt-[50px]">
                        <div className="rounded-full w-[60px] h-[60px] overflow-hidden">
                            {issueeProfile?.image ? (
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
                            )}
                        </div>
                        <div className="w-full flex flex-col items-center justify-center border-b-[2px] border-grayscale-100 pb-4 px-[16px]">
                            <p className="text-center w-full text-grayscale-900 text-base">
                                <span className="font-semibold">
                                    {issueeProfile?.displayName || issueeName}
                                </span>{' '}
                                has requested your endorsement for{' '}
                                <span className="font-semibold">{title}</span>
                            </p>
                        </div>
                    </div>
                    {/* boost preview */}
                    <div className="w-full px-2 pb-2 flex items-center justify-center">
                        <EndorsementFormBoostPreviewCard
                            existingEndorsements={existingEndorsements}
                            credential={credential}
                            categoryType={categoryType}
                            className="shadow-none !p-0 !m-0 !gap-2 rounded-b-[20px]"
                            dateFormat="DD MMM, YY"
                            showDetails
                        />
                    </div>
                </div>
            ) : (
                <EndorsementRequestModalSkeletonLoader />
            )}

            {!isLoggedIn && credential && (
                <button
                    onClick={handleOpenEndorsementRequestForm}
                    className={`py-[9px] pl-[20px] pr-[15px] items-center justify-center rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] max-w-[375px] mt-2 bg-white font-semibold z-9999`}
                >
                    <EndorsmentThumbWithCircle
                        className={`w-8 h-8 text-grayscale-700`}
                        fill="#E2E3E9"
                    />
                    Endorse{' '}
                </button>
            )}

            {isLoggedIn && (
                <EndorsementRequestModalFooter handleOnClick={handleOpenEndorsementRequestForm} />
            )}
        </div>
    );
};

export default EndorsementRequestModal;
