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
} from './endorsement-state.helpers';
import {
    useGetVCInfo,
    useWallet,
    useIsLoggedIn,
    CredentialCategoryEnum,
    useModal,
    ModalTypes,
} from 'learn-card-base';

const endorsementSchema = zod.object({
    relationship: zod.object({
        label: zod.string().min(1, 'Relationship label is required'),
        type: zod.string().min(1, 'Relationship type is required'),
    }),
    description: zod.string().min(1, 'Endorsement is required'),
});

export const EndorsementForm: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
    isRequest?: boolean;
    onSuccess?: (endorsement: EndorsementState) => void;
    mode?: EndorsementFormModeEnum;
    shareLinkInfo?: string;
}> = ({
    credential,
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
    const { issueeProfile } = useGetVCInfo(credential, categoryType);

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
        if (!validateEndorsement()) {
            return;
        }

        if (isLoggedIn) {
            const wallet = await initWallet();
            setSendingEndorsement(true);

            const evidence = convertAttachmentsToEvidence(endorsement.mediaAttachments);

            const endorsementVC = await wallet.invoke.endorseCredential(credential, {
                endorsementComment: endorsement.qualification,
                name: `Endorsement of ${credential.id}`,
                description: endorsement.description,
                evidence,
            });

            const sentCredential = await wallet.invoke.sendCredential(
                issueeProfile?.profileId || '',
                endorsementVC,
                {
                    type: 'endorsement',
                    sharedUri: shareLinkInfo,
                    credentialId: credential.id,
                    relationship: endorsement.relationship,
                }
            );

            setSendingEndorsement(false);

            // onSuccess
            // if logged in -> show success modal
            closeAllModals();
            setTimeout(() => {
                newModal(
                    <EndorsementDraftRequestSuccess
                        closeModal={closeModal}
                        credential={credential}
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
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px]">
                <EndorsementFormHeader
                    credential={credential}
                    categoryType={categoryType}
                    isRequest={isRequest}
                />
                <div className="w-full flex flex-col items-center justify-center px-4 pt-4 pb-[150px] bg-grayscale-100 h-full">
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
                    sendingEndorsement
                }
            />
        </section>
    );
};

export default EndorsementForm;
