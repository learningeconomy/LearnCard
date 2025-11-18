import React from 'react';
import { useIonModal } from '@ionic/react';
import { BoostMediaOptionsEnum, BoostCMSMediaAttachment } from '../../../boost';
import Pencil from '../../../../svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import FileIcon from 'learn-card-base/svgs/FileIcon';
import { CreateMediaAttachmentFormModal } from './CreateMediaAttachmentForm';
import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';

const BoostMediaCMSFormDocumentItem: React.FC<BoostMediaCMSFormItemProps> = ({
    index,
    media,
    handleDelete,
    state,
    setState,
}) => {
    const [presentEditSheetModal, dismissEditSheetModal] = useIonModal(
        CreateMediaAttachmentFormModal,
        {
            initialState: state,
            initialMedia: media,
            initialIndex: index,
            setParentState: setState,
            initialActiveMediaType: BoostMediaOptionsEnum.document,
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
        initialActiveMediaType: BoostMediaOptionsEnum.document,
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

    return (
        <div
            key={index}
            className="flex items-center justify-between w-full bg-grayscale-100 mt-[20px] ion-padding rounded-[20px] relative py-6"
        >
            <a
                href={media.url || ''}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-start w-full text-decoration-none"
                style={{ textDecoration: 'none' }}
            >
                <FileIcon className="text-[#FF3636] h-[35px] min-h-[35px] min-w-[35px] w-[35px] mr-1" />
                <div className="flex items-start justify-center text-left ml-2 flex-col flex-grow">
                    <p className="text-grayscale-800 text-xs text-left line-clamp-1 font-notoSans">
                        {media.title}
                    </p>
                    <div className="w-full overflow-hidden">
                        <span className="line-clamp-1 text-indigo-600 text-base font-semibold font-notoSans">
                            View Document
                        </span>
                    </div>
                </div>
            </a>
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
                <div className="flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] cursor-pointer drop-shadow">
                    <TrashBin
                        className="h-[25px] w-[25px] text-grayscale-800"
                        onClick={e => {
                            e.preventDefault();
                            setState(state => ({
                                ...state,
                                mediaAttachments: state.mediaAttachments.filter(
                                    a => a.url !== media.url
                                ),
                            }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default BoostMediaCMSFormDocumentItem;
