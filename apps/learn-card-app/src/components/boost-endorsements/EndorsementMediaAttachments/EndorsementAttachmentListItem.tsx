import React, { useEffect, useState } from 'react';

import Video from 'learn-card-base/svgs/Video';
import Camera from 'learn-card-base/svgs/Camera';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import FileIcon from 'learn-card-base/svgs/FileIcon';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import EndorsementMediaTypeForm from './EndorsementMediaTypeForm';
import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';

import {
    useModal,
    ModalTypes,
    VideoMetadata,
    getVideoSource,
    getVideoMetadata,
} from 'learn-card-base';

import {
    EndorsementState,
    EndorsementMediaOptionsEnum,
    EndorsementMediaAttachment,
} from '../EndorsementForm/endorsement-state.helpers';

import useTheme from '../../../theme/hooks/useTheme';

const EndorsementAttachmentListItem: React.FC<{
    media: EndorsementMediaAttachment;
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
    showEditButton?: boolean;
    showDeleteButton?: boolean;
}> = ({ media, endorsement, setEndorsement, showEditButton, showDeleteButton }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });

    const mediaType = media.type as EndorsementMediaOptionsEnum;
    const isDocument = mediaType === EndorsementMediaOptionsEnum.document;
    const isPhoto = mediaType === EndorsementMediaOptionsEnum.photo;
    const isVideo = mediaType === EndorsementMediaOptionsEnum.video;
    const isLink = mediaType === EndorsementMediaOptionsEnum.link;

    const [metaData, setMetaData] = useState<VideoMetadata | null>(null);
    const [localMedia, setLocalMedia] = useState<EndorsementMediaAttachment>(media);
    const index = endorsement?.mediaAttachments?.findIndex(
        attachment => attachment.url === media.url
    );

    const handleGetVideoMetadata = async () => {
        const metadata = await getVideoMetadata(media.url || '');
        setMetaData(metadata);
    };

    useEffect(() => {
        handleGetVideoMetadata();
    }, [media]);

    const handleDelete = () => {
        setEndorsement({
            ...endorsement,
            mediaAttachments: endorsement.mediaAttachments.filter(
                attachment => attachment.url !== media.url
            ),
        });
    };

    const handleSaveMedia = (media: EndorsementMediaAttachment) => {
        setEndorsement(prevState => ({
            ...prevState,
            mediaAttachments: prevState.mediaAttachments.map((attachment, i) => {
                if (i === index) {
                    return media;
                }
                return attachment;
            }),
        }));
    };

    const handleEdit = () => {
        newModal(
            <EndorsementMediaTypeForm
                media={localMedia}
                setMedia={setLocalMedia}
                handleSave={handleSaveMedia}
                mediaType={mediaType}
            />
        );
    };

    const mediaHeight =
        isPhoto || isVideo ? 'min-h-[120px] max-h-[120px]' : 'min-h-[80px] max-h-[80px]';

    return (
        <div className={`flex bg-grayscale-100 rounded-[20px] relative ${mediaHeight} w-full`}>
            {isPhoto && (
                <>
                    <div className="w-2/5 shrink-0 overflow-hidden rounded-[20px] shadow-3xl min-h-[120px] max-h-[120px] relative">
                        <img
                            alt="media attachment"
                            src={media.url || ''}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent"></div>

                        <Camera className="absolute right-2 bottom-2 h-[30px] w-[30px] text-white" />
                    </div>
                    <div className="flex flex-1 ion-padding rounded-r-[20px] flex-col justify-between">
                        <p className="break-all line-clamp-3 pr-2 text-left text-xs leading-4 text-grayscale-900">
                            {media.title}
                        </p>
                    </div>
                </>
            )}

            {isVideo && (
                <>
                    <div className="w-2/5 relative overflow-hidden rounded-[20px] shadow-3xl min-h-[120px] max-h-[120px] flex-shrink-0">
                        <a
                            href={media.url || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-full "
                        >
                            <img
                                src={metaData?.thumbnailUrl || EmptyImage}
                                alt={media.title || 'Video Cover'}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent"></div>
                            <Video className="absolute right-2 bottom-2 h-[30px] w-[30px] text-white" />
                        </a>
                    </div>

                    <a
                        href={media.url || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 ion-padding rounded-r-[20px] flex-col justify-between z-10 mr-[30px]"
                        style={{ textDecoration: 'none' }}
                    >
                        <p className="line-clamp-3 pr-2 text-left text-grayscale-900 break-all">
                            {media.title}
                        </p>
                        <p className="text-xs text-gray-400 self-start break-all">
                            {getVideoSource(media.url || '')}
                        </p>
                    </a>
                </>
            )}

            {isDocument && (
                <a
                    href={media.url || ''}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-start w-full text-decoration-none"
                    style={{ textDecoration: 'none' }}
                >
                    <FileIcon className="text-[#FF3636] h-[45px] min-h-[45px] min-w-[45px] w-[45px] ml-2" />
                    <div className="flex items-start justify-center text-left ml-2 flex-col flex-grow">
                        <p className="text-grayscale-800 text-xs text-left line-clamp-1">
                            {media.title}
                        </p>
                        <div className="w-full overflow-hidden">
                            <span
                                className={`line-clamp-1 text-${primaryColor} text-base font-semibold`}
                            >
                                View Document
                            </span>
                        </div>
                    </div>
                </a>
            )}

            {isLink && (
                <a
                    href={media.url || ''}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between w-full text-decoration-none"
                    style={{ textDecoration: 'none' }}
                >
                    <div className="flex items-center justify-start">
                        <LinkChain className={`text-${primaryColor} h-[45px] w-[45px] ml-2`} />
                        <div className="flex items-start justify-center text-left ml-2 flex-col flex-grow">
                            <p className="text-grayscale-800 text-xs text-left line-clamp-1 break-all">
                                {media.title}
                            </p>
                            <span
                                className={`line-clamp-1 text-${primaryColor} text-base font-semibold`}
                            >
                                Visit Link
                            </span>
                        </div>
                    </div>
                </a>
            )}

            <div className="absolute right-1 bottom-1 cursor-pointer flex flex-col justify-between h-full pt-[10px]">
                {showEditButton && (
                    <button
                        onClick={handleEdit}
                        type="button"
                        className="text-grayscale-900 flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow"
                    >
                        <Pencil className="h-[60%]" />
                    </button>
                )}
                {showDeleteButton && (
                    <div
                        className="flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow"
                        onClick={handleDelete}
                    >
                        <TrashBin className="h-[25px] w-[25px] text-grayscale-800" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EndorsementAttachmentListItem;
