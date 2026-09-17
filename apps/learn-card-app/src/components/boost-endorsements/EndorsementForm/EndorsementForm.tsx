import React, { useState } from 'react';
import zod from 'zod';

import EndorsementTextForm from './EndorsementTextForm';
import EndorsementFormHeader from './EndorsementFormHeader';
import EndorsementFormFooter from './EndorsementFormFooter';
import EndorsementRelationshipForm from './EndorsementRelationshipForm';
import EndorsementFormBoostPreviewCard from './EndorsementFormBoostPreviewCard';
import EndorsementQualificationsTextForm from './EndorsementQualificationsTextForm';
import EndorsementMediaForm from '../EndorsementMediaAttachments/EndorsementMediaForm';
import EndorsementDraftRequestSuccess from '../EndorsementRequestForm/EndorsementDraftRequestSuccess';

import { VC } from '@learncard/types';
import {
    initialEndorsementState,
    EndorsementState,
    EndorsementFormModeEnum,
    convertAttachmentsToEvidence,
    getEndorsementTarget,
} from './endorsement-state.helpers';
import {
    useGetVCInfo,
    useWallet,
    useIsLoggedIn,
    CredentialCategoryEnum,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
    getLogger,
} from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';

const log = getLogger('endorsement-form');

const endorsementSchema = zod.object({
    relationship: zod.object({
        label: zod.string().min(1, 'Relationship label is required'),
        type: zod.string().min(1, 'Relationship type is required'),
    }),
    description: zod.string().min(1, 'Endorsement is required'),
});

export const EndorsementForm: React.FC<{
    credential: VC;
    targetCredential?: VC;
    categoryType: CredentialCategoryEnum;
    isRequest?: boolean;
    onSuccess?: (endorsement: EndorsementState) => void;
    mode?: EndorsementFormModeEnum;
    shareLinkInfo?: string;
}> = ({
    credential,
    targetCredential = credential,
    categoryType,
    isRequest,
    onSuccess,
    mode = EndorsementFormModeEnum.create,
    shareLinkInfo,
}) => {
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const { closeModal, closeAllModals, newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { issueeProfile, loading: isCredentialInfoLoading } = useGetVCInfo(
        credential,
        categoryType
    );
    const { presentToast } = useToast();

    const [sendingEndorsement, setSendingEndorsement] = useState<boolean>(false);
    const [endorsement, setEdorsement] = useState<EndorsementState>(initialEndorsementState);

    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const validateEndorsement = () => {
        const result = endorsementSchema.safeParse(endorsement);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors);
            return false;
        }
        return true;
    };

    const handleEndorsementSubmit = async () => {
        if (!validateEndorsement()) return;

        if (isLoggedIn) {
            setSendingEndorsement(true);

            try {
                const recipientProfileId = issueeProfile?.profileId;
                if (!recipientProfileId) {
                    throw new Error('Unable to resolve the endorsement recipient profile');
                }

                const wallet = await initWallet();
                const evidence = convertAttachmentsToEvidence(endorsement.mediaAttachments);
                const target = getEndorsementTarget(credential, targetCredential);
                const endorsementVC = await wallet.invoke.endorseCredential(targetCredential, {
                    endorsementComment: endorsement.qualification,
                    name: `Endorsement of ${target.name}`,
                    description: endorsement.description,
                    evidence,
                });

                await wallet.invoke.sendCredential(recipientProfileId, endorsementVC, {
                    type: 'endorsement',
                    sharedUri: shareLinkInfo,
                    credentialId: target.id,
                    relationship: endorsement.relationship,
                });
            } catch (error) {
                log.error('endorsement.send.failed', error);
                presentToast(m['toasts.boost.endorsementRequestFailed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                return;
            } finally {
                setSendingEndorsement(false);
            }

            closeAllModals();
            setTimeout(() => {
                newModal(
                    <EndorsementDraftRequestSuccess
                        closeModal={closeModal}
                        credential={credential}
                        targetCredential={targetCredential}
                        categoryType={categoryType}
                        autoSend={false}
                        endorsementState={endorsement}
                    />,
                    {},
                    {
                        desktop: ModalTypes.FullScreen,
                        mobile: ModalTypes.FullScreen,
                    }
                );
            }, 1000);
            return;
        }

        // if logged out -> show login modal
        onSuccess?.(endorsement);
    };

    const relationship = endorsement.relationship;
    const description = endorsement.description;

    return (
        <section className="relative h-full w-full flex items-start justify-center overflow-hidden pt-4">
            <section className="bg-white max-w-[800px] w-full h-full overflow-y-auto rounded-[20px]">
                <EndorsementFormHeader
                    credential={credential}
                    categoryType={categoryType}
                    isRequest={isRequest}
                />
                <div className="w-full flex flex-col items-center justify-center px-4 pt-4 pb-[200px] bg-grayscale-100 h-full">
                    <EndorsementFormBoostPreviewCard
                        credential={credential}
                        categoryType={categoryType}
                    />
                    <div className="w-full h-[1px] bg-grayscale-300 mt-4 mb-2" />
                    <EndorsementRelationshipForm
                        credential={credential}
                        categoryType={categoryType}
                        endorsement={endorsement}
                        setEndorsement={setEdorsement}
                    />
                    <EndorsementTextForm
                        credential={credential}
                        categoryType={categoryType}
                        endorsement={endorsement}
                        setEndorsement={setEdorsement}
                        errors={errors}
                        setErrors={setErrors}
                    />
                    <EndorsementQualificationsTextForm
                        endorsement={endorsement}
                        setEndorsement={setEdorsement}
                        errors={errors}
                    />
                    <EndorsementMediaForm
                        endorsement={endorsement}
                        setEndorsement={setEdorsement}
                        errors={errors}
                    />
                </div>
            </section>
            <EndorsementFormFooter
                isLoading={sendingEndorsement}
                handleEndorsementSubmit={handleEndorsementSubmit}
                isDisabled={
                    relationship?.label.length === 0 ||
                    relationship?.type.length === 0 ||
                    description.length === 0 ||
                    isCredentialInfoLoading ||
                    sendingEndorsement
                }
            />
        </section>
    );
};

export default EndorsementForm;
