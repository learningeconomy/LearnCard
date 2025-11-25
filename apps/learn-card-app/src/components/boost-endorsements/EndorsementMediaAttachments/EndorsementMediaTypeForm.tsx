import React, { useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';

import { IonCol, IonRow, IonInput } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import FileIcon from 'learn-card-base/svgs/FileIcon';

import useTheme from '../../../theme/hooks/useTheme';
import {
    endorsementMediaOptions,
    EndorsementMediaOptionsEnum,
    EndorsementMediaAttachment,
} from '../EndorsementForm/endorsement-state.helpers';
import { useFilestack, UploadRes, useModal, getAttachmentFileInfo } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

const EndorsementMediaTypeForm: React.FC<{
    media: EndorsementMediaAttachment;
    setMedia: React.Dispatch<React.SetStateAction<EndorsementMediaAttachment>>;
    mediaType: EndorsementMediaOptionsEnum;
    handleGoBack?: () => void;
    handleSave: (media: EndorsementMediaAttachment) => void;
}> = ({ media, setMedia, mediaType, handleGoBack, handleSave }) => {
    const { closeModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { Icon, color, title } =
        endorsementMediaOptions.find(option => option.type === mediaType) || {};

    const [uploadProgress, setUploadProgress] = useState<number | boolean>(false);
    const [mediaTitle, setMediaTitle] = useState<string>(media?.title ?? '');
    const [mediaUrl, setMediaUrl] = useState<string>(media?.url ?? '');

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const onUpload = (data: UploadRes) => {
        const fileInfo = getAttachmentFileInfo(data?._file);

        setMedia({
            url: data?.url,
            title: data?.filename,
            type: mediaType,
            ...fileInfo,
        });
    };

    const onSave = () => {
        handleSave({ ...media, title: mediaTitle, url: mediaUrl, type: mediaType });
        closeModal();
    };

    const isDocument = mediaType === EndorsementMediaOptionsEnum.document;
    const isPhoto = mediaType === EndorsementMediaOptionsEnum.photo;
    const isVideo = mediaType === EndorsementMediaOptionsEnum.video;
    const isLink = mediaType === EndorsementMediaOptionsEnum.link;

    return (
        <div className="px-4 py-4">
            <IonRow className="flex flex-col pb-4">
                <IonCol className="w-full flex items-center justify-between mt-8 mb-2">
                    <h6 className="flex items-center justify-center font-medium text-grayscale-800 font-poppins text-xl tracking-wide">
                        {handleGoBack && (
                            <button
                                className="text-grayscale-50 p-0 mr-[10px]"
                                onClick={handleGoBack}
                            >
                                <CaretLeft className="h-auto w-3 text-grayscale-800" />
                            </button>
                        )}
                        {title} Attachment
                    </h6>
                    {Icon && (
                        <Icon className={`text-${color} h-[40px] max-h-[40px] max-w-[40px]`} />
                    )}
                </IonCol>
            </IonRow>
            <div className="flex flex-col items-center justify-center w-full mb-4">
                {isPhoto && (
                    <div className="image-preview max-h-[250px] mb-[20px]">
                        <img
                            alt="Uploaded Image Preview"
                            className="max-h-[250px]"
                            src={media?.url!}
                            onClick={handleImageSelect}
                            referrerPolicy="no-referrer"
                        />
                    </div>
                )}

                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                    placeholder="Title"
                    type="text"
                    value={mediaTitle}
                    onIonInput={e => setMediaTitle(e.detail.value!)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            Keyboard.hide();
                        }
                    }}
                />

                {(isLink || isVideo) && (
                    <IonInput
                        autocapitalize="on"
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mt-4`}
                        placeholder="Paste link..."
                        type="text"
                        value={mediaUrl}
                        onIonInput={e => setMediaUrl(e.detail.value!)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                Keyboard.hide();
                            }
                        }}
                    />
                )}
            </div>

            {isDocument && (
                <div className="flex items-center justify-between w-full mb-4 bg-grayscale-100 ion-padding rounded-[20px]">
                    <div className="flex items-center justify-start w-[80%]">
                        {media?.url && uploadProgress === false && (
                            <>
                                <FileIcon className="text-[#FF3636] h-[40px] min-h-[40px] min-w-[40px] w-[40px] mr-2" />
                                <a
                                    className={`line-clamp-1 text-${primaryColor} text-base font-semibold`}
                                    target="_blank"
                                    rel="noreferrer"
                                    href={media?.url}
                                >
                                    {media?.url}
                                </a>
                            </>
                        )}

                        {uploadProgress !== false && (
                            <p className="font-medium text-[#FF3636]">
                                {uploadProgress?.toString?.()}% uploaded
                            </p>
                        )}
                    </div>
                </div>
            )}

            {!imageUploadLoading ? (
                <button
                    onClick={() => {
                        onSave();
                    }}
                    className={`flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide`}
                >
                    Save
                </button>
            ) : (
                <button className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide">
                    {imageUploadLoading ? 'Uploading...' : 'Upload'}
                </button>
            )}

            {(isPhoto || isDocument) && media?.url && (
                <button
                    onClick={handleImageSelect}
                    className="flex items-center mt-[20px] justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide"
                >
                    Change {title}
                </button>
            )}
        </div>
    );
};

export default EndorsementMediaTypeForm;
