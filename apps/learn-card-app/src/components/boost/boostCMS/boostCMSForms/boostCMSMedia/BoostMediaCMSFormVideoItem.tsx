import React, { useEffect, useState } from 'react';

import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import Video from 'learn-card-base/svgs/Video';

import { BoostMediaOptionsEnum } from '../../../boost';
import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';
import {
    VideoMetadata,
    getVideoSource,
    getVideoMetadata,
    useModal,
    ModalTypes,
} from 'learn-card-base';

const BoostMediaCMSFormVideoItem: React.FC<BoostMediaCMSFormItemProps> = ({
    index,
    media,
    handleDelete,
    state,
    setState,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const [metaData, setMetaData] = useState<VideoMetadata | null>(null);

    const handleGetVideoMetadata = async () => {
        const metadata = await getVideoMetadata(media.url || '');
        setMetaData(metadata);
    };

    useEffect(() => {
        handleGetVideoMetadata();
    }, [media]);

    const handleEdit = () => {
        newModal(
            <div className="w-full flex flex-col items-center justify-center">
                <CreateMediaAttachmentForm
                    initialState={state}
                    initialMedia={media}
                    initialIndex={index}
                    setParentState={setState}
                    hideBackButton={true}
                    initialActiveMediaType={BoostMediaOptionsEnum.video}
                    handleCloseModal={() => closeModal()}
                    showCloseButton={false}
                    createMode={false}
                    title={
                        <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                            Media Attachment
                        </p>
                    }
                />
            </div>,
            {
                sectionClassName: '!max-w-[500px]',
                hideButton: true,
                usePortal: true,
            }
        );
    };

    return (
        <div
            key={index}
            className="group bg-grayscale-100 rounded-[20px] relative text-xs min-h-[120px] max-h-[120px] w-full flex overflow-hidden mb-4"
        >
            {/* Thumbnail and gradient */}
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
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-10"></div>
                    <Video className="absolute left-2 bottom-2 h-[30px] w-[30px] text-white z-20" />
                </a>
            </div>

            {/* Title and source info, making sure it's clickable */}
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

            {/* TrashBin icon, positioned absolutely to the right bottom corner */}
            <div className="absolute right-1 bottom-1 z-30 cursor-pointer flex flex-col justify-between h-full pt-[10px]">
                <button
                    onClick={() => handleEdit()}
                    type="button"
                    className="text-grayscale-900 flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow"
                >
                    <Pencil className="h-[60%]" />
                </button>
                <div className="flex items-center justify-center bg-white rounded-full h-[35px] w-[35px]">
                    <TrashBin
                        className="h-[25px] w-[25px] text-grayscale-800"
                        onClick={e => {
                            e.stopPropagation(); // Prevent link navigation
                            setState(state => ({
                                ...state,
                                mediaAttachments: state.mediaAttachments.filter(
                                    a => a.title !== media.title
                                ),
                            }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default BoostMediaCMSFormVideoItem;
