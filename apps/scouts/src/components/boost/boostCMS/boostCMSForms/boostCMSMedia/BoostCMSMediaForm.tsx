import React from 'react';
import { IonCol, IonRow, useIonModal } from '@ionic/react';

import Plus from 'learn-card-base/svgs/Plus';
import BoostCMSMediaOptions from './BoostCMSMediaOptions';
import { BoostCMSState, BoostMediaOptionsEnum, BoostCMSMediaAttachment } from '../../../boost';
import PaperClip from '../../../../../components/svgs/PaperClip';
import BoostMediaCMSFormPhotoItem from './BoostMediaCMSFormPhotoItem';
import BoostMediaCMSFormDocumentItem from './BoostMediaCMSFormDocumentItem';
import BoostMediaCMSFormVideoItem from './BoostMediaCMSFormVideoItem';
import BoostMediaCMSFormLinkItem from './BoostMediaCMSFormLinkItem';

export type BoostMediaCMSFormItemProps = {
    index: number;
    media: BoostCMSMediaAttachment;
    handleDelete: (attachment: BoostCMSMediaAttachment) => void;
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
};

export const BoostCMSMediaForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
}> = ({ state, setState, disabled = false }) => {
    const [presentCenterModal, dismissCenterModal] = useIonModal(BoostCMSMediaOptions, {
        state: state,
        setState: setState,
        handleCloseModal: () => dismissCenterModal(),
        showCloseButton: true,
        title: (
            <p className="flex items-center justify-center text-2xl w-full h-full text-grayscale-900 font-notoSans">
                Media Attachment
            </p>
        ),
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(BoostCMSMediaOptions, {
        state: state,
        setState: setState,
        handleCloseModal: () => dismissSheetModal(),
        showCloseButton: false,
        title: (
            <p className="flex items-center justify-center text-2xl w-full h-full text-grayscale-900 font-notoSans">
                Media Attachment
            </p>
        ),
    });

    const getAttachments = (attachmentType: BoostMediaOptionsEnum): BoostCMSMediaAttachment[] => {
        const attachments =
            state?.mediaAttachments?.filter(attachment => attachment?.type === attachmentType) ||
            [];
        return attachments;
    };

    const photos = getAttachments(BoostMediaOptionsEnum.photo);
    const videos = getAttachments(BoostMediaOptionsEnum.video);
    const documents = getAttachments(BoostMediaOptionsEnum.document);
    const links = getAttachments(BoostMediaOptionsEnum.link);
    const noAttachments = state?.mediaAttachments?.length === 0;
    const removePadding = noAttachments ? '!p-0' : '';

    const handleDeleteonClick = (attachment: BoostCMSMediaAttachment) => {
        setState(state => ({
            ...state,
            mediaAttachments: state.mediaAttachments.filter(a => a.title !== attachment.title),
        }));
    };

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white rounded-[20px]">
                <button
                    className="flex items-center justify-between w-full ion-padding"
                    onClick={() => {
                        const isMobile = window.innerWidth < 992;
                        if (isMobile) {
                            presentSheetModal();
                        } else {
                            presentCenterModal({
                                cssClass: 'center-modal user-options-modal',
                                backdropDismiss: false,
                                showBackdrop: false,
                            });
                        }
                    }}
                    disabled={disabled}
                >
                    <h1 className="text-black text-xl p-0 m-0 flex items-center justify-center font-notoSans">
                        <PaperClip className="h-[30px] w-[30px] mr-1" /> Media Attachments
                    </h1>

                    <div className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-desktop">
                        <Plus className="w-8 h-auto" />
                    </div>

                    <div className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl modal-btn-mobile">
                        <Plus className="w-8 h-auto" />
                    </div>
                </button>
                <div
                    className={`ion-padding pt-0 pb-4 flex items-center justify-center flex-col flex-wrap w-full ${removePadding}`}
                >
                    <div className="pt-0 flex items-center justify-center flex-col flex-wrap w-full">
                        {photos.map((photo, index) => (
                            <BoostMediaCMSFormPhotoItem
                                index={index}
                                state={state}
                                setState={setState}
                                key={photo.url}
                                media={photo}
                                handleDelete={handleDeleteonClick}
                            />
                        ))}
                    </div>

                    <div className="pt-0 flex items-center justify-center flex-col w-full">
                        {videos.map((video, index) => (
                            <BoostMediaCMSFormVideoItem
                                index={index}
                                state={state}
                                setState={setState}
                                key={video.url}
                                media={video}
                                handleDelete={handleDeleteonClick}
                            />
                        ))}
                    </div>

                    <div
                        className={`pt-0 pb-4 flex items-center justify-center flex-col w-full ${removePadding}`}
                    >
                        {documents.map((document, index) => (
                            <BoostMediaCMSFormDocumentItem
                                index={index}
                                state={state}
                                setState={setState}
                                key={document.url}
                                media={document}
                                handleDelete={handleDeleteonClick}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-start w-full">
                        {links.map((link, index) => (
                            <BoostMediaCMSFormLinkItem
                                index={index}
                                state={state}
                                setState={setState}
                                key={link.url}
                                media={link}
                                handleDelete={handleDeleteonClick}
                            />
                        ))}
                    </div>
                </div>
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSMediaForm;
