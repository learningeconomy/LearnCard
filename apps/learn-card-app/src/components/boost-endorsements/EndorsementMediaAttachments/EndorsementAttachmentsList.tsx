import React from 'react';

import { IonRow } from '@ionic/react';
import EndorsementAttachmentListItem from './EndorsementAttachmentListItem';

import {
    EndorsementState,
    EndorsementMediaOptionsEnum,
    EndorsementMediaAttachment,
} from '../EndorsementForm/endorsement-state.helpers';

export const EndorsementAttachmentsList: React.FC<{
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
    showDeleteButton?: boolean;
}> = ({ endorsement, setEndorsement, showDeleteButton = false }) => {
    const getAttachments = (
        attachmentType: EndorsementMediaOptionsEnum
    ): EndorsementMediaAttachment[] => {
        const attachments =
            endorsement?.mediaAttachments?.filter(
                attachment => attachment?.type === attachmentType
            ) || [];
        return attachments;
    };

    const photos = getAttachments(EndorsementMediaOptionsEnum.photo);
    const videos = getAttachments(EndorsementMediaOptionsEnum.video);
    const documents = getAttachments(EndorsementMediaOptionsEnum.document);
    const links = getAttachments(EndorsementMediaOptionsEnum.link);

    const attachments = [...photos, ...videos, ...documents, ...links];

    return (
        <IonRow className="w-full flex flex-col items-center justify-center gap-2">
            {attachments.map((attachment, index) => (
                <EndorsementAttachmentListItem
                    key={attachment?.url || index}
                    media={attachment}
                    endorsement={endorsement}
                    setEndorsement={setEndorsement}
                    showDeleteButton={showDeleteButton}
                />
            ))}
        </IonRow>
    );
};

export default EndorsementAttachmentsList;
