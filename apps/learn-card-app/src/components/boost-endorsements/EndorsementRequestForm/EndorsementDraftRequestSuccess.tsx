import React, { useEffect, useState } from 'react';
import { VC } from '@learncard/types';

import EndorsementRequestFormFooter from './EndorsementRequestFormFooter';
import EndorsementFullView from '../EndorsementsList/EndorsementFullView';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';
import EndorsementFormBoostPreviewCard from '../EndorsementForm/EndorsementFormBoostPreviewCard';

import useJoinLCNetworkModal from '../../network-prompts/hooks/useJoinLCNetworkModal';

import { endorsementsRequestStore } from '../../../stores/endorsementsRequestStore';
import {
    useGetVCInfo,
    CredentialCategoryEnum,
    useModal,
    ModalTypes,
    useGetCurrentLCNUser,
    useIsLoggedIn,
    useWallet,
} from 'learn-card-base';
import {
    BoostEndorsement,
    BoostEndorsementStatusEnum,
    EndorsementModeEnum,
} from '../boost-endorsement.helpers';
import { convertAttachmentsToEvidence } from '../EndorsementForm/endorsement-state.helpers';

export const EndorsementDraftRequestSuccess: React.FC<{
    credential: VC;
    closeModal: () => void;
    categoryType?: CredentialCategoryEnum;
    autoSend?: boolean;
    endorsementState?: BoostEndorsement;
}> = ({ closeModal, credential, categoryType, autoSend = true, endorsementState }) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { newModal, closeModal: close } = useModal({
        mobile: ModalTypes.Right,
        desktop: ModalTypes.Right,
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { issueeName, issueeProfile } = useGetVCInfo(credential, categoryType);
    const draftEndorsementRequest = endorsementsRequestStore.useTracked.endorsementRequest();
    const shareLinkInfo = endorsementsRequestStore.useTracked.credentialInfo();

    const [endorsement, setEndorsement] = useState<BoostEndorsement | null>(null);

    const status = endorsement?.status || false;
    const endorsementStatus = status;

    const _issueeName = issueeProfile?.displayName || issueeName;

    console.log('credential', credential);

    const handleEndorsementPreview = () => {
        newModal(
            <div className="w-full h-full flex flex-col items-start justify-start bg-grayscale-500 bg-opacity-10 px-4 overflow-y-scroll pt-8 pb-[100px]">
                <EndorsementFormBoostPreviewCard
                    credential={credential}
                    categoryType={categoryType}
                />
                <div className="w-full h-[1px] bg-grayscale-300 mt-4 mb-4" />
                <EndorsementFullView
                    credential={credential}
                    categoryType={categoryType}
                    endorsement={endorsement}
                    mode={EndorsementModeEnum.Review}
                    showDeleteButton={false}
                />
                <EndorsementRequestFormFooter />
            </div>,
            {},
            {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            }
        );
    };

    const clearDraftEndorsementRequest = () => {
        endorsementsRequestStore.set.endorsementRequest({
            description: '',
            qualification: '',
            mediaAttachments: [],
            relationship: null,
        });
        endorsementsRequestStore.set.credentialInfo(undefined);
    };

    const handleEndorsementSubmit = async () => {
        /**
         * Opens the Join Network onboarding modal if the user is not in the LC Network.
         * If onboarding completes successfully, the provided callback will be invoked.
         *
         * @example
         * if (!currentLCNUser) {
         *     promptJoinNetwork(() => {
         *         handleEndorsementSubmit();
         *     });
         *     return;
         * }
         */
        if (!currentLCNUser) {
            await handlePresentJoinNetworkModal(handleEndorsementSubmit);
            return;
        }

        try {
            if (isLoggedIn) {
                setIsLoading(true);
                const wallet = await initWallet();

                const evidence = convertAttachmentsToEvidence(
                    draftEndorsementRequest.mediaAttachments
                );

                const endorsementVC = await wallet.invoke.endorseCredential(credential, {
                    endorsementComment: draftEndorsementRequest.qualification,
                    name: `Endorsement of ${credential.id}`,
                    description: draftEndorsementRequest.description,
                    evidence,
                });

                const sentCredential = await wallet.invoke.sendCredential(
                    issueeProfile?.profileId || '',
                    endorsementVC,
                    {
                        type: 'endorsement',
                        sharedUri: `uri=${shareLinkInfo?.uri}&seed=${shareLinkInfo?.seed}&pin=${shareLinkInfo?.pin}`,
                        credentialId: credential.id,
                        relationship: draftEndorsementRequest.relationship,
                    }
                );

                clearDraftEndorsementRequest();

                setIsLoading(false);
            }
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!autoSend && endorsementState) {
            setEndorsement(endorsementState);
        }
    }, [endorsementState]);

    useEffect(() => {
        if (credential?.id && autoSend) {
            setEndorsement({
                ...draftEndorsementRequest,
                user: {
                    name: currentLCNUser?.displayName,
                    image: currentLCNUser?.image,
                },
            });
            handleEndorsementSubmit();
        }
    }, [credential?.id, currentLCNUser, autoSend]);

    let endorsementStatusEl = (
        <>
            {isLoading ? (
                <h1 className="text-center text-[22px] font-semibold text-grayscale-900">
                    Sending
                    <br /> Endorsement...
                </h1>
            ) : (
                <h1 className="text-center text-[22px] font-semibold text-grayscale-900">
                    Thanks! <br /> Endorsement Sent!
                </h1>
            )}

            {!isLoading && (
                <div className="w-full flex items-center justify-center px-4">
                    <div
                        className={`flex items-center justify-between px-2 py-1 rounded-[5px] bg-grayscale-100`}
                    >
                        <p className="text-xs flex items-center font-semibold text-grayscale-700 uppercase">
                            Waiting for review by {_issueeName}
                        </p>
                    </div>
                </div>
            )}
        </>
    );

    if (endorsementStatus === BoostEndorsementStatusEnum.Approved) {
        endorsementStatusEl = (
            <>
                <h1 className="text-center text-[22px] font-semibold text-grayscale-900">
                    Thanks! <br /> Endorsement Approved!
                </h1>
                <div className="w-full flex items-center justify-center px-4">
                    <div
                        className={`flex items-center justify-between px-2 py-1 rounded-[5px] bg-grayscale-100`}
                    >
                        <p className="text-xs flex items-center font-semibold text-grayscale-700 uppercase">
                            Approved by {_issueeName}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white bg-opacity-10 px-4">
            <div className="w-full flex flex-col items-center justify-center  bg-white rounded-[20px] px-4 py-8 gap-2 max-w-[375px]">
                <EndorsmentThumbWithCircle
                    className="w-[50px] h-[50px] text-white"
                    fill="#2DD4BF"
                />
                {endorsementStatusEl}
            </div>

            <EndorsementRequestFormFooter
                handleEndorsementPreview={handleEndorsementPreview}
                showEndorsementPreview
                handleCloseModal={() => {
                    close();
                    clearDraftEndorsementRequest();
                }}
            />
        </div>
    );
};

export default EndorsementDraftRequestSuccess;
