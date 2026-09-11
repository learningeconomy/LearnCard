import React, { useState } from 'react';
import * as m from '../../../../../paraglide/messages.js';
import { BoostCMSMediaAttachment, BoostCMSState } from 'learn-card-base';
import { BoostMediaOptionsEnum } from '../../../boost';
import { curriedStateSlice } from '@learncard/helpers';
import BoostCMSMediaPhotoUpload from './BoostCMSMediaPhotoUpload';
import BoostCMSMediaDocumentUpload from './BoostCMSMediaDocumentUpload';
import BoostCMSMediaLinkAttachment from './BoostCMSMediaLinkAttachment';
import BoostCMSMediaVideoAttachment from './BoostCMSMediaVideoAttachment';
import {
    useImageUpload,
    UploadRes,
    BoostCMSMediaState,
    useBoostCMSMediaState,
} from 'learn-card-base';
import { IMAGE_MIME_TYPES, VIEWER_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import BoostMediaModalLayoutWrapper from './BoostMediaModalLayoutWrapper';
import BoostCMSMediaTypeSelector from './BoostCMSMediaTypeSelector';

type CreateMediaAttachmentFormProps = {
    initialState?: BoostCMSState;
    initialMedia?: BoostCMSMediaAttachment;
    initialIndex?: number;
    initialActiveMediaType?: BoostMediaOptionsEnum;
    handleCloseModal?: () => void;
    handleSave: (state: BoostCMSMediaState) => void;
    setParentState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    createMode?: boolean;
    hideBackButton?: boolean;
};

const CreateMediaAttachmentForm: React.FC<CreateMediaAttachmentFormProps> = ({
    initialState,
    initialIndex,
    initialActiveMediaType,
    createMode = false,
    handleCloseModal,
    // handleSave,
    setParentState,
    hideBackButton,
}) => {
    const [state, setState] = useBoostCMSMediaState(initialState);
    const [activeMediaType, setActiveMediaType] = useState<BoostMediaOptionsEnum | null>(
        initialActiveMediaType ?? null
    );
    const [uploadProgress, setUploadProgress] = useState<number | boolean>(false);
    const [uploadedPhotos, setUploadedPhotos] = useState<BoostCMSMediaAttachment[]>([]);

    const updateSlice = curriedStateSlice(setState);

    // Save media state to main BoostCMSState

    const handleSave = (mediaState: BoostCMSMediaState, mergePrevState: boolean = false) => {
        setParentState(prevState => {
            return {
                ...prevState,
                mediaAttachments: mergePrevState
                    ? [
                          ...prevState.mediaAttachments,
                          ...mediaState.documents,
                          ...mediaState.links,
                          ...mediaState.photos,
                          ...mediaState.videos,
                      ]
                    : [
                          ...mediaState.documents,
                          ...mediaState.links,
                          ...mediaState.photos,
                          ...mediaState.videos,
                      ],
            };
        });
    };

    const onSave = (newState?: BoostCMSMediaState) => {
        if (newState) {
            handleSave(newState);
        } else {
            handleSave(state);
        }
        handleCloseModal?.();
    };

    const onUpload = (data: UploadRes) => {
        setUploadProgress(false);

        updateSlice('photos', [
            ...state.photos,
            { url: data?.url, title: data?.filename, type: BoostMediaOptionsEnum.photo },
        ]);
        setActiveMediaType(BoostMediaOptionsEnum.photo);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useImageUpload({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const onDocumentUpload = (data: UploadRes) => {
        setUploadProgress(false);

        updateSlice('documents', [
            ...state.documents,
            { url: data?.url, title: data?.filename, type: BoostMediaOptionsEnum.document },
        ]);
        setActiveMediaType(BoostMediaOptionsEnum.document);
    };

    const { handleFileSelect: handleDocumentSelect, isLoading: fileUploadLoading } = useImageUpload(
        {
            fileType: VIEWER_MIME_TYPES,
            onUpload: (_url, _file, data) => onDocumentUpload(data),
            options: { onProgress: event => setUploadProgress(event.totalPercent) },
        }
    );

    if (activeMediaType === BoostMediaOptionsEnum.photo) {
        return (
            <BoostCMSMediaPhotoUpload
                handleSave={onSave}
                createMode={createMode}
                initialIndex={!createMode ? initialIndex : state.photos?.length - 1}
                state={state}
                setState={updateSlice('photos')}
                activeMediaType={activeMediaType}
                setActiveMediaType={setActiveMediaType}
                handleCloseModal={handleCloseModal}
                hideBackButton={hideBackButton}
            />
        );
    }

    if (activeMediaType === BoostMediaOptionsEnum.document) {
        return (
            <BoostCMSMediaDocumentUpload
                uploadedPhotos={uploadedPhotos}
                createMode={createMode}
                setUploadedPhotos={setUploadedPhotos}
                handleSave={onSave}
                state={state}
                initialIndex={!createMode ? initialIndex : state.documents?.length - 1}
                setState={updateSlice('documents')}
                activeMediaType={activeMediaType}
                setActiveMediaType={setActiveMediaType}
                handleCloseModal={handleCloseModal}
                hideBackButton={hideBackButton}
            />
        );
    }

    if (activeMediaType === BoostMediaOptionsEnum.link) {
        return (
            <BoostCMSMediaLinkAttachment
                handleSave={onSave}
                state={state}
                createMode={createMode}
                handleCloseModal={handleCloseModal}
                initialIndex={!createMode ? initialIndex : state.links?.length - 1}
                setState={updateSlice('links')}
                activeMediaType={activeMediaType}
                setActiveMediaType={setActiveMediaType}
                hideBackButton={hideBackButton}
            />
        );
    }

    if (activeMediaType === BoostMediaOptionsEnum.video) {
        return (
            <BoostCMSMediaVideoAttachment
                handleSave={onSave}
                state={state}
                createMode={createMode}
                handleCloseModal={handleCloseModal}
                initialIndex={!createMode ? initialIndex : state.videos?.length - 1}
                setState={updateSlice('videos')}
                activeMediaType={activeMediaType}
                setActiveMediaType={setActiveMediaType}
                hideBackButton={hideBackButton}
            />
        );
    }

    return (
        <>
            {uploadProgress !== false && (
                <div className="flex items-center justify-between w-full mb-4 bg-grayscale-100 ion-padding rounded-[20px]">
                    <div className="flex items-center justify-start w-[80%]">
                        <p className="font-medium text-[#FF3636]">
                            {m['boostCMS.uploadProgress']({ progress: uploadProgress as number })}
                        </p>
                    </div>
                </div>
            )}
            <BoostCMSMediaTypeSelector
                handleImageSelect={handleImageSelect}
                handleDocumentSelect={handleDocumentSelect}
                setActiveMediaType={setActiveMediaType}
            />
            <div className="w-full flex items-center justify-center mt-[20px]">
                <button
                    onClick={() => handleCloseModal?.()}
                    className="text-grayscale-900 text-center text-sm"
                >
                    {m['common.cancel']()}
                </button>
            </div>
        </>
    );
};

export default CreateMediaAttachmentForm;

type CreateMediaAttachmentFormModalProps = {
    initialState?: BoostCMSState;
    initialActiveMediaType?: BoostMediaOptionsEnum;
    initialIndex?: number;
    handleCloseModal?: () => void;
    handleSave: (state: BoostCMSMediaState) => void;
    setParentState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    hideBackButton?: boolean;
};

export const CreateMediaAttachmentFormModal: React.FC<CreateMediaAttachmentFormModalProps> = ({
    initialIndex,
    initialState,
    setParentState,
    initialActiveMediaType,
    handleCloseModal,
    handleSave,
    hideBackButton,
}) => {
    return (
        <BoostMediaModalLayoutWrapper handleCloseModal={handleCloseModal}>
            <CreateMediaAttachmentForm
                hideBackButton={hideBackButton}
                initialIndex={initialIndex}
                handleCloseModal={handleCloseModal}
                setParentState={setParentState}
                initialState={initialState}
                initialActiveMediaType={initialActiveMediaType}
            />
        </BoostMediaModalLayoutWrapper>
    );
};
