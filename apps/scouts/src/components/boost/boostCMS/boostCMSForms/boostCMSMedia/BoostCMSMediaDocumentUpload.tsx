import React, { useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { useFilestack, UploadRes } from 'learn-card-base';
import { VIEWER_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { IonCol, IonRow, IonInput } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { Updater } from 'use-immer';
import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';
import FileIcon from 'learn-card-base/svgs/FileIcon';
import { BoostCMSMediaAttachment, BoostCMSMediaState } from 'learn-card-base';

import { produce } from 'immer';

const BoostCMSMediaDocumentUpload: React.FC<{
    state: BoostCMSMediaState;
    setState: Updater<BoostCMSMediaAttachment[]>;
    activeMediaType: BoostMediaOptionsEnum | null;
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
    handleCloseModal?: () => void;
    setUploadedPhotos: React.Dispatch<React.SetStateAction<BoostCMSMediaAttachment[]>>;
    handleSave: () => void;
    hideBackButton?: boolean;
}> = ({
    state,
    setState,
    activeMediaType,
    setActiveMediaType,
    handleCloseModal,
    handleSave,
    hideBackButton,
}) => {
    const { id, type, title, color, Icon } = boostMediaOptions.find(
        ({ type }) => type === activeMediaType
    );

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState<number | boolean>(false);

    const onUpload = (data: UploadRes) => {
        setUploadProgress(false);
        // setNewPhotoUrl(data?.url);
        setState(
            produce(state.documents, draft => {
                draft[currentIndex].url = data?.url;
                draft[currentIndex].title = data?.filename;
            })
        );
    };
    const { handleFileSelect: handleDocumentSelect, isLoading: uploadLoading } = useFilestack({
        fileType: VIEWER_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
        options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const documentSrc = state?.documents?.[currentIndex]?.url;

    return (
        <>
            <IonRow className="flex flex-col pb-4">
                <IonCol className="w-full flex items-center justify-between mt-8 mb-2">
                    <h6 className="flex items-center justify-center font-medium text-grayscale-800 text-2xl font-notoSans">
                        {!hideBackButton && (
                            <button
                                className="text-grayscale-50 p-0 mr-[10px]"
                                onClick={() => setActiveMediaType(null)}
                            >
                                <CaretLeft className="h-auto w-3 text-grayscale-800" />
                            </button>
                        )}
                        {title}
                    </h6>
                    <Icon className={`text-${color} h-[40px] max-h-[40px] max-w-[40px]`} />
                </IonCol>
            </IonRow>
            <div className="flex flex-col items-center justify-center w-full mb-4">
                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base font-notoSans`}
                    placeholder="Title"
                    type="text"
                    value={state?.documents?.[currentIndex]?.title}
                    onIonInput={e => {
                        let stateCopy = structuredClone(state.documents);
                        if (stateCopy[currentIndex]) {
                            stateCopy[currentIndex].title = e.detail.value as string;
                            setState(stateCopy);
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') Keyboard.hide();
                    }}
                />
            </div>

            <div className="flex items-center justify-between w-full mb-4 bg-grayscale-100 ion-padding rounded-[20px]">
                <div className="flex items-center justify-start w-[80%]">
                    {documentSrc && uploadProgress === false && (
                        <>
                            <FileIcon className="text-[#FF3636] h-[40px] min-h-[40px] min-w-[40px] w-[40px] mr-2" />
                            <a
                                className="line-clamp-1 text-indigo-600 text-base font-semibold"
                                target="_blank"
                                rel="noreferrer"
                                href={documentSrc}
                            >
                                {documentSrc}
                            </a>
                        </>
                    )}

                    {uploadProgress !== false && (
                        <p className="font-medium text-[#FF3636]">
                            {uploadProgress?.toString?.()}% uploaded
                        </p>
                    )}
                </div>

                {/* <button
                onClick={handleDeleteDocumentUploaded}
                className="flex items-center justify-center rounded-full bg-white h-[40px] w-[40px]"
            >
                <TrashBin className="text-grayscale-800 h-[30px] w-[30px]" />
            </button> */}
            </div>

            <button
                onClick={() => {
                    handleSave();
                }}
                className={`flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-notoSans`}
            >
                Save
            </button>

            {documentSrc && (
                <button
                    onClick={handleDocumentSelect}
                    className="flex items-center mt-[20px] justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-notoSans"
                >
                    Change Document
                </button>
            )}

            <div className="w-full flex items-center justify-center mt-[20px]">
                <button
                    onClick={() => {
                        if (!hideBackButton) {
                            setState([]);
                            setActiveMediaType(null);
                        }
                        handleCloseModal?.();
                    }}
                    className="text-grayscale-900 text-center text-sm font-notoSans"
                >
                    Cancel
                </button>
            </div>
        </>
    );
};

export default BoostCMSMediaDocumentUpload;
