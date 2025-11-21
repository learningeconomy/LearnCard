import React, { useEffect } from 'react';

import Plus from 'learn-card-base/svgs/Plus';
import LockBold from 'learn-card-base/svgs/LockBold';
import { IonCol, IonRow, IonToggle } from '@ionic/react';
import BoostCMSMediaOptions from './BoostCMSMediaOptions';
import BoostMediaCMSFormLinkItem from './BoostMediaCMSFormLinkItem';
import BoostMediaCMSFormPhotoItem from './BoostMediaCMSFormPhotoItem';
import BoostMediaCMSFormVideoItem from './BoostMediaCMSFormVideoItem';
import PaperClip from 'apps/learn-card-app/src/components/svgs/PaperClip';
import BoostMediaCMSFormDocumentItem from './BoostMediaCMSFormDocumentItem';

import {
    BoostCMSState,
    BoostMediaOptionsEnum,
    BoostCMSMediaAttachment,
    BoostCMSAppearancePreviewTypeEnum,
} from '../../../boost';
import { useTheme } from '../../../../../theme/hooks/useTheme';
import { ModalTypes, useModal } from 'learn-card-base';

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
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });

    const appearance = state?.appearance;
    const displayType = appearance?.displayType;
    const mediaAttachments = state?.mediaAttachments;
    const hasMediaAttachments = mediaAttachments?.length > 0;
    const isMediaDisplayType = displayType === 'media';

    const getAttachments = (attachmentType: BoostMediaOptionsEnum): BoostCMSMediaAttachment[] => {
        const attachments =
            state?.mediaAttachments?.filter(attachment => attachment?.type === attachmentType) ||
            [];
        return attachments;
    };

    useEffect(() => {
        // If there are no media attachments, set the preview type to default
        // this handles the case where the user removes all media attachments
        // and the preview type is still set to media
        if (!hasMediaAttachments) {
            setState(state => ({
                ...state,
                appearance: {
                    ...state.appearance,
                    previewType: BoostCMSAppearancePreviewTypeEnum.Default,
                },
            }));
        }
    }, [mediaAttachments]);

    const photos = getAttachments(BoostMediaOptionsEnum.photo);
    const videos = getAttachments(BoostMediaOptionsEnum.video);
    const documents = getAttachments(BoostMediaOptionsEnum.document);
    const links = getAttachments(BoostMediaOptionsEnum.link);

    const noAttachments = state?.mediaAttachments?.length === 0;
    const hasAttachments = state?.mediaAttachments?.length > 0;
    const removePadding = noAttachments ? '!p-0' : '';

    const handleDeleteonClick = (attachment: BoostCMSMediaAttachment) => {
        setState(state => ({
            ...state,
            mediaAttachments: state.mediaAttachments.filter(a => a.title !== attachment.title),
        }));
    };

    const isMediaPreviewType = appearance?.previewType === BoostCMSAppearancePreviewTypeEnum.Media;
    let isToggleDisabled =
        isMediaDisplayType || noAttachments || (isMediaPreviewType && !hasAttachments);
    let showAddMediaText =
        (isMediaDisplayType && noAttachments) || (!isMediaDisplayType && !hasAttachments);
    let isChecked = appearance?.previewType !== BoostCMSAppearancePreviewTypeEnum.Default;
    if (isMediaDisplayType) isChecked = true;

    let toggleRequirementsText = isMediaDisplayType
        ? 'Required for Media Display type.'
        : 'Add media to enable option.';
    let addMediaText = isMediaDisplayType
        ? 'Add media to continue.'
        : 'When on, this credential will show the attached media instead of the default layout.';

    let lockIconPosition = '';
    if (isToggleDisabled && isMediaDisplayType) lockIconPosition = 'right-[6px]';
    if (isToggleDisabled && !isMediaDisplayType) lockIconPosition = 'left-[6px]';

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white rounded-[20px]">
                <button className="flex items-center justify-between w-full ion-padding">
                    <h1 className="font-poppins text-grayscale-900 text-xl p-0 m-0 flex items-center justify-center">
                        <PaperClip className="h-[30px] w-[30px] mr-1" /> Media Attachments
                    </h1>
                </button>

                <div className="w-full flex items-center justify-between px-4">
                    <div>
                        <p className="font-poppins text-grayscale-900 text-[17px] p-0 m-0">
                            Show only media for
                            <br /> credential display
                        </p>
                        <p className="font-poppins text-grayscale-600 font-semibold text-xs p-0 m-0">
                            {toggleRequirementsText}
                        </p>
                    </div>

                    <div className="flex items-center justify-center relative rounded-full">
                        <IonToggle
                            onIonChange={e => {
                                if (e.detail.checked) {
                                    setState(state => ({
                                        ...state,
                                        appearance: {
                                            ...state.appearance,
                                            previewType: BoostCMSAppearancePreviewTypeEnum.Media,
                                        },
                                    }));
                                } else {
                                    setState(state => ({
                                        ...state,
                                        appearance: {
                                            ...state.appearance,
                                            previewType: BoostCMSAppearancePreviewTypeEnum.Default,
                                        },
                                    }));
                                }
                            }}
                            checked={isChecked}
                            disabled={isToggleDisabled}
                            mode="ios"
                            className={`rounded-full ${
                                isChecked ? `bg-${primaryColor}` : 'bg-grayscale-100'
                            } ${isToggleDisabled ? 'opacity-50' : ''}`}
                        />
                        {isToggleDisabled && (
                            <LockBold
                                className={`h-[18px] w-[18px] text-grayscale-700/80 absolute ${lockIconPosition} z-10`}
                            />
                        )}
                    </div>
                </div>

                {showAddMediaText && (
                    <div className="w-full flex text-let px-4 my-2">
                        <p
                            className={`font-poppins  p-0 m-0 ${
                                isMediaDisplayType
                                    ? 'text-rose-600 font-semibold text-sm'
                                    : 'text-grayscale-700 text-xs'
                            }`}
                        >
                            {addMediaText}
                        </p>
                    </div>
                )}

                <div className="w-full flex items-center justify-between px-4 my-4">
                    <button
                        onClick={() =>
                            newModal(
                                <BoostCMSMediaOptions
                                    displayType={state?.appearance?.displayType}
                                    state={state}
                                    setState={setState}
                                    title={
                                        <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                                            Select Media Type
                                        </p>
                                    }
                                />,
                                {
                                    sectionClassName: '!max-w-[500px]',
                                    hideButton: true,
                                    usePortal: true,
                                }
                            )
                        }
                        disabled={disabled}
                        className="w-full flex items-center justify-between p-4 bg-grayscale-100 text-grayscale-800 text-base rounded-[10px]"
                    >
                        Add Media <Plus className="h-[30px] w-[30px] text-grayscale-700" />
                    </button>
                </div>

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
