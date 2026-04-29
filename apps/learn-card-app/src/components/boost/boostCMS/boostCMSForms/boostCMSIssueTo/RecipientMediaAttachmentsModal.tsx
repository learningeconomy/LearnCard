import React from 'react';
import { useMemo, useState } from 'react';
import { useModal } from 'learn-card-base';

import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import BoostCMSMediaOptions from '../boostCMSMedia/BoostCMSMediaOptions';
import RecipientMediaAttachmentsList from './RecipientMediaAttachmentsList';

type RecipientMediaAttachmentsModalProps = {
    recipient: BoostCMSIssueTo;
    setIssueTo: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;
};

const RecipientMediaAttachmentsModal: React.FC<RecipientMediaAttachmentsModalProps> = ({
    recipient,
    setIssueTo,
}) => {
    const { closeModal } = useModal();
    const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
    const [mediaAttachments, setMediaAttachments] = useState(
        recipient.mediaAttachments ?? []
    );
    const recipientMediaState = {
        mediaAttachments,
        appearance: {},
    } as BoostCMSState;

    const setRecipientMediaState: React.Dispatch<React.SetStateAction<BoostCMSState>> = action => {
        const nextState = typeof action === 'function' ? action(recipientMediaState) : action;
        const nextAttachments = nextState.mediaAttachments ?? [];
        setMediaAttachments(nextAttachments);

        setIssueTo(issueTo =>
            issueTo.map(issuee =>
                issuee.profileId === recipient.profileId
                    ? { ...issuee, mediaAttachments: nextAttachments }
                    : issuee
            )
        );
    };

    const attachments = recipientMediaState.mediaAttachments ?? [];
    const hasAttachments = attachments.length > 0;

    const photos = useMemo(
        () => attachments.filter(attachment => attachment?.type === 'photo'),
        [attachments]
    );
    const videos = useMemo(
        () => attachments.filter(attachment => attachment?.type === 'video'),
        [attachments]
    );
    const documents = useMemo(
        () => attachments.filter(attachment => attachment?.type === 'document'),
        [attachments]
    );
    const links = useMemo(
        () => attachments.filter(attachment => attachment?.type === 'link'),
        [attachments]
    );

    const handleDeleteOnClick = (attachment: { title: string }) => {
        setRecipientMediaState(prevState => ({
            ...prevState,
            mediaAttachments: prevState.mediaAttachments.filter(a => a.title !== attachment.title),
        }));
    };

    const openMediaOptions = () => setViewMode('add');

    if (hasAttachments && viewMode === 'list') {
        return (
            <RecipientMediaAttachmentsList
                recipient={recipient}
                recipientMediaState={recipientMediaState}
                setRecipientMediaState={setRecipientMediaState}
                photos={photos}
                videos={videos}
                documents={documents}
                links={links}
                onAddMedia={openMediaOptions}
                onClose={closeModal}
                onDeleteAttachment={handleDeleteOnClick}
            />
        );
    }

    return (
        <BoostCMSMediaOptions
            state={recipientMediaState}
            setState={setRecipientMediaState}
            title={
                <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                    {hasAttachments ? 'Select Media Type' : 'Media Attachments'}
                </p>
            }
            hideCloseButton={true}
            keepModalOpenOnSave={hasAttachments}
            onSaveComplete={() => {
                if (hasAttachments) {
                    setViewMode('list');
                }
            }}
        />
    );
};

export default RecipientMediaAttachmentsModal;
