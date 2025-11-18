import React from 'react';
import { ModalTypes, useDeviceTypeByWidth, useModal } from 'learn-card-base';

import { IonCol, IonRow } from '@ionic/react';

import Plus from 'learn-card-base/svgs/Plus';
import BoostCMSMediaOptions from './BoostCMSMediaOptions';
import { BoostCMSState, BoostMediaOptionsEnum, BoostCMSMediaAttachment } from '../../../boost';
import PaperClip from 'apps/learn-card-app/src/components/svgs/PaperClip';
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

type BoostCMSMediaFormProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    disabled?: boolean;
};

export const BoostCMSMediaForm: React.FC<BoostCMSMediaFormProps> = ({
    state,
    setState,
    disabled = false,
}) => {
    const { newModal } = useModal({ mobile: ModalTypes.Center });
    const { isDesktop } = useDeviceTypeByWidth();

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
                    onClick={() =>
                        newModal(
                            <BoostCMSMediaOptions
                                displayType={state?.appearance?.displayType}
                                state={state}
                                setState={setState}
                                showCloseButton={isDesktop}
                                title={
                                    <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                                        Media Attachment
                                    </p>
                                }
                            />,
                            { sectionClassName: '!max-w-[500px]' }
                        )
                    }
                    disabled={disabled}
                >
                    <h1 className="font-poppins text-grayscale-900 text-xl p-0 m-0 flex items-center justify-center">
                        <PaperClip className="h-[30px] w-[30px] mr-1" /> Media Attachments
                    </h1>

                    <div className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-12 h-12 shadow-3xl">
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
