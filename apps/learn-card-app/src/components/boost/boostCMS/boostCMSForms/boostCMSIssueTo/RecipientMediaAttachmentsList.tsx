import React from 'react';
import { UserProfilePicture } from 'learn-card-base';
import { BoostCMSMediaAttachment } from 'learn-card-base';
import Plus from 'learn-card-base/svgs/Plus';
import X from 'learn-card-base/svgs/X';

import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import BoostMediaCMSFormPhotoItem from '../boostCMSMedia/BoostMediaCMSFormPhotoItem';
import BoostMediaCMSFormVideoItem from '../boostCMSMedia/BoostMediaCMSFormVideoItem';
import BoostMediaCMSFormDocumentItem from '../boostCMSMedia/BoostMediaCMSFormDocumentItem';
import BoostMediaCMSFormLinkItem from '../boostCMSMedia/BoostMediaCMSFormLinkItem';

type RecipientMediaAttachmentsListProps = {
    recipient: BoostCMSIssueTo;
    recipientMediaState: BoostCMSState;
    setRecipientMediaState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    photos: BoostCMSMediaAttachment[];
    videos: BoostCMSMediaAttachment[];
    documents: BoostCMSMediaAttachment[];
    links: BoostCMSMediaAttachment[];
    onAddMedia: () => void;
    onClose: () => void;
    onDeleteAttachment: (attachment: { title: string }) => void;
};

const RecipientMediaAttachmentsList: React.FC<RecipientMediaAttachmentsListProps> = ({
    recipient,
    recipientMediaState,
    setRecipientMediaState,
    photos,
    videos,
    documents,
    links,
    onAddMedia,
    onClose,
    onDeleteAttachment,
}) => {
    return (
        <section className="w-full max-w-[500px] bg-white rounded-[20px] p-5 font-poppins">
            <div className="flex items-start justify-between pb-4 border-b border-grayscale-200">
                <div className="flex items-center gap-3">
                    <UserProfilePicture
                        customContainerClass="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 rounded-full overflow-hidden text-white font-medium text-2xl"
                        customImageClass="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 rounded-full overflow-hidden object-cover"
                        customSize={164}
                        user={recipient}
                    />
                    <div className="flex flex-col">
                        <p className="text-grayscale-900 font-medium text-lg">
                            {recipient.displayName ?? recipient.profileId}
                        </p>
                        <p className="text-grayscale-500 text-sm">{recipient.profileId}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-grayscale-700 hover:text-grayscale-900 transition-colors"
                >
                    <X className="w-7 h-7" />
                </button>
            </div>

            <div className="pt-5 space-y-4">
                <button
                    type="button"
                    onClick={onAddMedia}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-100 text-grayscale-800 font-medium text-base flex items-center justify-between hover:bg-grayscale-200 transition-colors"
                >
                    Add Media
                    <Plus className="w-7 h-7 text-grayscale-700" />
                </button>

                <div className="space-y-4">
                    {photos.map((photo, index) => (
                        <BoostMediaCMSFormPhotoItem
                            key={photo.url}
                            index={index}
                            state={recipientMediaState}
                            setState={setRecipientMediaState}
                            media={photo}
                            handleDelete={onDeleteAttachment}
                        />
                    ))}
                    {videos.map((video, index) => (
                        <BoostMediaCMSFormVideoItem
                            key={video.url}
                            index={index}
                            state={recipientMediaState}
                            setState={setRecipientMediaState}
                            media={video}
                            handleDelete={onDeleteAttachment}
                        />
                    ))}
                    {documents.map((document, index) => (
                        <BoostMediaCMSFormDocumentItem
                            key={document.url}
                            index={index}
                            state={recipientMediaState}
                            setState={setRecipientMediaState}
                            media={document}
                            handleDelete={onDeleteAttachment}
                        />
                    ))}
                    {links.map((link, index) => (
                        <BoostMediaCMSFormLinkItem
                            key={link.url}
                            index={index}
                            state={recipientMediaState}
                            setState={setRecipientMediaState}
                            media={link}
                            handleDelete={onDeleteAttachment}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecipientMediaAttachmentsList;
