import React from 'react';
import { useIonModal } from '@ionic/react';

import { BoostMediaOptionsEnum } from '../../../boost';
import Pencil from '../../../../svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import Video from 'learn-card-base/svgs/Video';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import { CreateMediaAttachmentFormModal } from './CreateMediaAttachmentForm';
import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';

const BoostMediaCMSFormVideoItem: React.FC<BoostMediaCMSFormItemProps> = ({
    index,
    media,
    handleDelete,
    state,
    setState,
}) => {
    // Function to determine if the URL is from YouTube
    const isYoutubeUrl = (url: string) => {
        try {
            const youtubeUrl = new URL(url);
            return youtubeUrl.hostname === 'www.youtube.com';
        } catch (e) {
            console.log('error', e);
            return false;
        }
    };

    // Function to get the YouTube video ID from the URL
    const getYoutubeVideoId = (url: string) => {
        const regex = /(?:\?v=|\.com\/embed\/)([^&]+)/;
        const match = url.match(regex);
        return match ? match[1] : '';
    };

    // Function to get the cover image URL for YouTube videos
    const getCoverImageUrl = (youtubeWatchUrl: string) => {
        if (!isYoutubeUrl(youtubeWatchUrl)) {
            return ''; // Return an empty string if the URL is not a YouTube URL
        }

        const videoId = getYoutubeVideoId(youtubeWatchUrl);
        // Construct and return the URL for the video's cover image
        // This URL fetches the highest resolution image available
        return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    };

    // Function to get the source of the video
    const getVideoSource = (url: string) => {
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname;

            // Special handling for Google Drive links
            if (hostname.includes('drive.google')) {
                return 'Google Drive';
            }

            // Remove 'www' if present
            hostname = hostname.replace(/^www\./, '');

            // Return the adjusted hostname in lowercase, preserving the domain extension
            return hostname.toLowerCase();
        } catch (e) {
            console.error('Invalid URL', e);
            return ''; // Handle the error or return a default value
        }
    };

    const [presentEditSheetModal, dismissEditSheetModal] = useIonModal(
        CreateMediaAttachmentFormModal,
        {
            initialState: state,
            initialMedia: media,
            initialIndex: index,
            setParentState: setState,
            initialActiveMediaType: BoostMediaOptionsEnum.video,
            handleCloseModal: () => dismissEditSheetModal(),
            showCloseButton: false,
            hideBackButton: true,
            title: (
                <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                    Media Attachment
                </p>
            ),
        }
    );

    const [presentCenterModal, dismissCenterModal] = useIonModal(CreateMediaAttachmentFormModal, {
        initialState: state,
        initialMedia: media,
        initialIndex: index,
        setParentState: setState,
        hideBackButton: true,
        initialActiveMediaType: BoostMediaOptionsEnum.video,
        handleCloseModal: () => dismissCenterModal(),
        showCloseButton: false,
        title: (
            <p className="font-mouse flex items-center justify-center text-3xl w-full h-full text-grayscale-900">
                Media Attachment
            </p>
        ),
    });

    const handleEditMobile = () => {
        presentEditSheetModal({
            cssClass: 'mobile-modal user-options-modal',
            initialBreakpoint: 0.9,
            handleBehavior: 'none',
        });
    };

    const handleEditDesktop = () => {
        presentCenterModal({
            cssClass: 'center-modal user-options-modal',
            backdropDismiss: false,
            showBackdrop: false,
        });
    };

    const handleCloseModal = () => {
        dismissEditSheetModal();
        dismissCenterModal();
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
                        src={getCoverImageUrl(media.url || EmptyImage)}
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
                    onClick={() => handleEditDesktop()}
                    type="button"
                    className="text-grayscale-900 flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow modal-btn-desktop"
                >
                    <Pencil className="h-[60%]" />
                </button>
                <button
                    onClick={() => handleEditMobile()}
                    type="button"
                    className="text-grayscale-900 flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow modal-btn-mobile"
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
