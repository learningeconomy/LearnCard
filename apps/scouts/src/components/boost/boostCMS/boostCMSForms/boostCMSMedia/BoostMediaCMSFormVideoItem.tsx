import React from 'react';
import { BoostMediaOptionsEnum } from '../../../boost';
import Pencil from '../../../../svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import Video from 'learn-card-base/svgs/Video';
// @ts-ignore
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import { CreateMediaAttachmentFormModal } from './CreateMediaAttachmentForm';
import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';
import { useModal, ModalTypes } from 'learn-card-base';

const BoostMediaCMSFormVideoItem: React.FC<BoostMediaCMSFormItemProps> = ({
    index,
    media,
    handleDelete,
    state,
    setState,
}) => {
    const isYoutubeUrl = (url: string) => {
        try {
            const youtubeUrl = new URL(url);
            return youtubeUrl.hostname === 'www.youtube.com';
        } catch (e) {
            console.log('error', e);
            return false;
        }
    };

    const getYoutubeVideoId = (url: string) => {
        const regex = /(?:\?v=|\.com\/embed\/)([^&]+)/;
        const match = url.match(regex);
        return match ? match[1] : '';
    };

    const getCoverImageUrl = (youtubeWatchUrl: string) => {
        if (!isYoutubeUrl(youtubeWatchUrl)) {
            return '';
        }

        const videoId = getYoutubeVideoId(youtubeWatchUrl);
        return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    };

    const getVideoSource = (url: string) => {
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname;

            if (hostname.includes('drive.google')) {
                return 'Google Drive';
            }

            hostname = hostname.replace(/^www\./, '');
            return hostname.toLowerCase();
        } catch (e) {
            console.error('Invalid URL', e);
            return '';
        }
    };

    const { newModal: newEditModal, closeModal: closeEditModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Cancel,
    });

    const handleEdit = () => {
        newEditModal(
            <CreateMediaAttachmentFormModal
                initialState={state}
                initialMedia={media}
                initialIndex={index}
                setParentState={setState}
                hideBackButton={true}
                initialActiveMediaType={BoostMediaOptionsEnum.video}
                handleCloseModal={() => closeEditModal()}
                showCloseButton={false}
                title={
                    <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                        Media Attachment
                    </p>
                }
            />
        );
    };

    return (
        <div
            key={index}
            className="group bg-grayscale-100 rounded-[20px] relative text-xs min-h-[120px] max-h-[120px] w-full flex overflow-hidden mb-4"
        >
            <div className="w-2/5 relative overflow-hidden rounded-[20px] shadow-3xl min-h-[120px] max-h-[120px] flex-shrink-0">
                <a
                    href={media.url || ''}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full "
                >
                    <img
                        src={getCoverImageUrl(media.url || EmptyImage)}
                        alt={media.title || 'Video Cover'}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-10"></div>
                    <Video className="absolute left-2 bottom-2 h-[30px] w-[30px] text-white z-20" />
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
                            e.stopPropagation();
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
