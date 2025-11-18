import React, { useState } from 'react';
import { IonCol, IonRow } from '@ionic/react';
import {
    BoostCMSMediaAttachment,
    BoostCMSState,
    boostMediaOptions,
    BoostMediaOptionsEnum,
    getAttachmentFileInfo,
    BoostCMSAppearanceDisplayTypeEnum,
    useModal,
    ModalTypes,
} from 'learn-card-base';
import { Updater } from 'use-immer';
import { curriedStateSlice } from '@learncard/helpers';
import BoostCMSMediaPhotoUpload from './BoostCMSMediaPhotoUpload';
import BoostCMSMediaDocumentUpload from './BoostCMSMediaDocumentUpload';
import BoostCMSMediaLinkAttachment from './BoostCMSMediaLinkAttachment';
import BoostCMSMediaVideoAttachment from './BoostCMSMediaVideoAttachment';
import BoostMediaModalLayoutWrapper from './BoostMediaModalLayoutWrapper';
import BoostCMSAttachmentWarning from './BoostCMSAttachmentWarning';

import {
    useFilestack,
    UploadRes,
    BoostCMSMediaState,
    useBoostCMSMediaState,
} from 'learn-card-base';
import { IMAGE_MIME_TYPES, VIEWER_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

type CreateMediaAttachmentFormProps = {
    initialState?: BoostCMSState;
    initialMedia?: BoostCMSMediaAttachment;
    initialIndex?: number;
    initialActiveMediaType?: BoostMediaOptionsEnum;
    handleSave: (state: BoostCMSMediaState) => void;
    setParentState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    createMode?: boolean;
    hideBackButton?: boolean;
    handleCloseModal?: () => void;
    displayType?: BoostCMSAppearanceDisplayTypeEnum;
};

type BoostCMSMediaTypeSelectorProps = {
    state: BoostCMSMediaState;
    setState: Updater<BoostCMSMediaState>;
    onSave: any;
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | undefined>>;
    handleImageSelect: () => void;
    handleDocumentSelect: () => void;
    displayType?: BoostCMSAppearanceDisplayTypeEnum;
    attachments?: BoostCMSMediaAttachment[];
};

const BoostCMSMediaTypeSelector: React.FC<BoostCMSMediaTypeSelectorProps> = ({
    setActiveMediaType,
    onSave,
    state,
    setState,
    handleImageSelect,
    handleDocumentSelect,
    displayType,
    attachments,
}) => {
    const { newModal } = useModal();

    const existingAttachments = attachments || [];
    const attachment = attachments?.[0];

    return (
        <IonRow className="flex w-full">
            <IonCol className="flex items-center justify-center flex-wrap">
                {boostMediaOptions.map(({ id, type, title, color, Icon }) => {
                    let styles = '';
                    if (
                        displayType === BoostCMSAppearanceDisplayTypeEnum.Media &&
                        type === BoostMediaOptionsEnum.link
                    ) {
                        return null;
                    }

                    if (
                        displayType === BoostCMSAppearanceDisplayTypeEnum.Media &&
                        type === BoostMediaOptionsEnum.video
                    ) {
                        styles = '!w-[100%]';
                    }

                    const handleMediaSelect = () => {
                        if (
                            existingAttachments.length > 0 &&
                            displayType === BoostCMSAppearanceDisplayTypeEnum.Media &&
                            (attachment?.type !== type ||
                                attachment?.type !== BoostMediaOptionsEnum.photo)
                        ) {
                            newModal(
                                <BoostCMSAttachmentWarning />,
                                { sectionClassName: '!max-w-[500px]' },
                                {
                                    desktop: ModalTypes.Cancel,
                                    mobile: ModalTypes.Cancel,
                                }
                            );
                            return;
                        }

                        if (type === BoostMediaOptionsEnum.photo) {
                            handleImageSelect();
                        }
                        if (type === BoostMediaOptionsEnum.document) {
                            handleDocumentSelect();
                        }
                        if (
                            type !== BoostMediaOptionsEnum.photo &&
                            type !== BoostMediaOptionsEnum.document
                        ) {
                            setActiveMediaType(type);
                        }
                    };

                    return (
                        <button
                            key={id}
                            className={`flex flex-col items-center justify-center text-center ion-padding h-[122px] m-2 bg-${color} rounded-[20px] ${styles} w-[45%] xs:!w-[60%]`}
                            onClick={handleMediaSelect}
                        >
                            <Icon className="h-[40px] text-white max-h-[40px] max-w-[40px]" />
                            <p className="font-poppins text-white text-xl tracking-wider">
                                {title}
                            </p>
                        </button>
                    );
                })}
            </IonCol>
        </IonRow>
    );
};

const CreateMediaAttachmentForm: React.FC<CreateMediaAttachmentFormProps> = ({
    initialState,
    initialIndex,
    initialActiveMediaType,
    createMode = false,
    // handleSave,
    handleCloseModal,
    setParentState,
    hideBackButton,
    displayType,
}) => {
    const { closeModal } = useModal();

    const [state, setState] = useBoostCMSMediaState(initialState);
    const [activeMediaType, setActiveMediaType] = useState<BoostMediaOptionsEnum | undefined>(
        initialActiveMediaType
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
        closeModal?.();
        handleCloseModal?.();
    };

    const onUpload = (data: UploadRes) => {
        setUploadProgress(false);

        const fileInfo = getAttachmentFileInfo(data?._file);

        updateSlice('photos', [
            ...state.photos,
            {
                url: data?.url,
                title: data?.filename,
                type: BoostMediaOptionsEnum.photo,
                ...fileInfo,
            },
        ]);
        setActiveMediaType(BoostMediaOptionsEnum.photo);
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const onDocumentUpload = (data: UploadRes) => {
        setUploadProgress(false);

        const fileInfo = getAttachmentFileInfo(data?._file);

        updateSlice('documents', [
            ...state.documents,
            {
                url: data?.url,
                title: data?.filename,
                type: BoostMediaOptionsEnum.document,
                ...fileInfo,
            },
        ]);
        setActiveMediaType(BoostMediaOptionsEnum.document);
    };

    const { handleFileSelect: handleDocumentSelect, isLoading: fileUploadLoading } = useFilestack({
        fileType: VIEWER_MIME_TYPES,
        onUpload: (_url, _file, data) => onDocumentUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

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
                hideBackButton={hideBackButton}
                handleCloseModal={handleCloseModal}
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
                hideBackButton={hideBackButton}
                handleCloseModal={handleCloseModal}
            />
        );
    }

    if (activeMediaType === BoostMediaOptionsEnum.link) {
        return (
            <BoostCMSMediaLinkAttachment
                handleSave={onSave}
                state={state}
                createMode={createMode}
                initialIndex={!createMode ? initialIndex : state.links?.length - 1}
                setState={updateSlice('links')}
                activeMediaType={activeMediaType}
                setActiveMediaType={setActiveMediaType}
                hideBackButton={hideBackButton}
                handleCloseModal={handleCloseModal}
            />
        );
    }

    if (activeMediaType === BoostMediaOptionsEnum.video) {
        return (
            <BoostCMSMediaVideoAttachment
                handleSave={onSave}
                state={state}
                createMode={createMode}
                initialIndex={!createMode ? initialIndex : state.videos?.length - 1}
                setState={updateSlice('videos')}
                activeMediaType={activeMediaType}
                setActiveMediaType={setActiveMediaType}
                hideBackButton={hideBackButton}
                handleCloseModal={handleCloseModal}
            />
        );
    }

    return (
        <>
            {uploadProgress !== false && (
                <div className="flex items-center justify-between w-full mb-4 bg-grayscale-100 ion-padding rounded-[20px]">
                    <div className="flex items-center justify-start w-[80%]">
                        <p className="font-medium text-[#FF3636]">
                            {uploadProgress?.toString?.()}% uploaded
                        </p>
                    </div>
                </div>
            )}
            <BoostCMSMediaTypeSelector
                attachments={initialState?.mediaAttachments || []}
                state={state}
                handleImageSelect={handleImageSelect}
                handleDocumentSelect={handleDocumentSelect}
                setActiveMediaType={setActiveMediaType}
                setState={setState}
                onSave={onSave}
                displayType={displayType}
            />
            <div className="w-full flex items-center justify-center mt-[20px]">
                <button
                    onClick={() => {
                        closeModal?.();
                        handleCloseModal?.();
                    }}
                    className="text-grayscale-900 text-center text-sm"
                >
                    Cancel
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
    handleSave: (state: BoostCMSMediaState) => void;
    setParentState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    hideBackButton?: boolean;
    handleCloseModal?: () => void;
};

export const CreateMediaAttachmentFormModal: React.FC<CreateMediaAttachmentFormModalProps> = ({
    initialIndex,
    initialState,
    setParentState,
    initialActiveMediaType,
    handleSave,
    hideBackButton,
    handleCloseModal,
}) => {
    return (
        <BoostMediaModalLayoutWrapper>
            <CreateMediaAttachmentForm
                hideBackButton={hideBackButton}
                handleCloseModal={handleCloseModal}
                initialIndex={initialIndex}
                setParentState={setParentState}
                initialState={initialState}
                initialActiveMediaType={initialActiveMediaType}
            />
        </BoostMediaModalLayoutWrapper>
    );
};
