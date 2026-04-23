import React from 'react';

import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import BoostCMSMediaOptions from '../boostCMSMedia/BoostCMSMediaOptions';

type RecipientMediaAttachmentsModalProps = {
    recipient: BoostCMSIssueTo;
    setIssueTo: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;
};

const RecipientMediaAttachmentsModal: React.FC<RecipientMediaAttachmentsModalProps> = ({
    recipient,
    setIssueTo,
}) => {
    const recipientMediaState = {
        mediaAttachments: recipient.mediaAttachments ?? [],
        appearance: {},
    } as BoostCMSState;

    const setRecipientMediaState: React.Dispatch<React.SetStateAction<BoostCMSState>> = action => {
        const nextState = typeof action === 'function' ? action(recipientMediaState) : action;

        setIssueTo(issueTo =>
            issueTo.map(issuee =>
                issuee.profileId === recipient.profileId
                    ? { ...issuee, mediaAttachments: nextState.mediaAttachments ?? [] }
                    : issuee
            )
        );
    };

    return (
        <BoostCMSMediaOptions
            state={recipientMediaState}
            setState={setRecipientMediaState}
            title={
                <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                    Media Attachments
                </p>
            }
            showCloseButton={true}
        />
    );
};

export default RecipientMediaAttachmentsModal;
