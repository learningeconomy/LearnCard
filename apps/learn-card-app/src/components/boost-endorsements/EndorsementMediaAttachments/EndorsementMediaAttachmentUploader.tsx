import React, { useState } from 'react';

import EndorsementMediaAttachmentButtons from './EndorsementMediaAttachmentButtons';
import EndorsementMediaTypeForm from './EndorsementMediaTypeForm';

import { getAttachmentFileInfo, useFilestack, UploadRes } from 'learn-card-base';
import { IMAGE_MIME_TYPES, VIEWER_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import {
    EndorsementMediaOptionsEnum,
    EndorsementMediaAttachment,
    EndorsementState,
} from '../EndorsementForm/endorsement-state.helpers';

export const EndorsementMediaAttachmentUploader: React.FC<{
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
}> = ({ endorsement, setEndorsement }) => {
    const [activeMediaType, setActiveMediaType] = useState<EndorsementMediaOptionsEnum | undefined>(
        undefined
    );
    const [localMedia, setLocalMedia] = useState<EndorsementMediaAttachment | null>(null);

    const [uploadProgress, setUploadProgress] = useState<number | boolean>(false);

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onImageUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const { handleFileSelect: handleDocumentSelect, isLoading: fileUploadLoading } = useFilestack({
        fileType: VIEWER_MIME_TYPES,
        onUpload: (_url, _file, data) => onDocumentUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const handleSaveMedia = (media: EndorsementMediaAttachment) => {
        setEndorsement(prevState => {
            return {
                ...prevState,
                mediaAttachments: [...prevState.mediaAttachments, media],
            };
        });
    };

    const handleGoBack = () => {
        setLocalMedia(null);
        setActiveMediaType(undefined);
    };

    const onImageUpload = (data: UploadRes) => {
        setUploadProgress(false);

        const fileInfo = getAttachmentFileInfo(data?._file);

        setLocalMedia({
            url: data?.url,
            title: data?.filename,
            type: EndorsementMediaOptionsEnum.photo,
            ...fileInfo,
        });

        setActiveMediaType(EndorsementMediaOptionsEnum.photo);
    };

    const onDocumentUpload = (data: UploadRes) => {
        setUploadProgress(false);

        const fileInfo = getAttachmentFileInfo(data?._file);

        setLocalMedia({
            url: data?.url,
            title: data?.filename,
            type: EndorsementMediaOptionsEnum.document,
            ...fileInfo,
        });

        setActiveMediaType(EndorsementMediaOptionsEnum.document);
    };

    if (activeMediaType) {
        return (
            <EndorsementMediaTypeForm
                media={localMedia}
                setMedia={setLocalMedia}
                handleGoBack={handleGoBack}
                handleSave={handleSaveMedia}
                mediaType={activeMediaType}
            />
        );
    }

    return (
        <EndorsementMediaAttachmentButtons
            handleImageSelect={handleImageSelect}
            handleDocumentSelect={handleDocumentSelect}
            handleMediaTypeSelect={setActiveMediaType}
            loadingProgress={uploadProgress}
        />
    );
};

export default EndorsementMediaAttachmentUploader;
