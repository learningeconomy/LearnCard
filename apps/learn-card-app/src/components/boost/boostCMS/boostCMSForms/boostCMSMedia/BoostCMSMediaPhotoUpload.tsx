import React, { useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { createPortal } from 'react-dom';
import { Updater } from 'use-immer';
import { produce } from 'immer';

import { IonCol, IonRow, IonInput } from '@ionic/react';

import { useFilestack, UploadRes, BoostCMSMediaState, useModal } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';
import { BoostCMSMediaAttachment } from 'learn-card-base';

type BoostCMSMediaPhotoUploadProps = {
    state: BoostCMSMediaState;
    setState: Updater<BoostCMSMediaAttachment[]>;
    activeMediaType: BoostMediaOptionsEnum | null;
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
    setUploadedPhotos: React.Dispatch<React.SetStateAction<BoostCMSMediaAttachment[]>>;
    handleSave: () => void;
    uploadedPhotos: BoostCMSMediaAttachment[];
    initialIndex?: number;
    hideBackButton?: boolean;
    handleCloseModal?: () => void;
    createMode?: boolean;
    setShowCloseButtonState?: React.Dispatch<React.SetStateAction<boolean>>;
};

const BoostCMSMediaPhotoUpload: React.FC<BoostCMSMediaPhotoUploadProps> = ({
    state,
    setState,
    activeMediaType,
    setActiveMediaType,
    uploadedPhotos,
    handleSave,
    initialIndex,
    hideBackButton,
    handleCloseModal,
    createMode,
    setShowCloseButtonState,
}) => {
    const sectionPortal = document.getElementById('section-cancel-portal');
    const { closeModal } = useModal();

    const { id, type, title, color, Icon } = boostMediaOptions.find(
        ({ type }) => type === activeMediaType
    );

    const [newPhotoTitle, setNewPhotoTitle] = useState<string>();
    const [currentIndex, setCurrentIndex] = useState<number>(initialIndex || 0);
    const [newPhotoUrl, setNewPhotoUrl] = useState<string>();

    const onUpload = (data: UploadRes) => {
        setState(
            produce(state.photos, draft => {
                draft[currentIndex].url = data?.url;
            })
        );
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploadLoading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => onUpload(data),
    });

    const photoSrc = state?.photos?.[currentIndex]?.url;

    return (
        <>
            <IonRow className="flex flex-col pb-4">
                <IonCol className="w-full flex items-center justify-between mt-8 mb-2">
                    <Icon
                        version="outlined"
                        className={`text-grayscale-800 h-[40px] max-h-[40px] max-w-[40px] mr-2`}
                    />
                    <h6 className="flex items-center justify-center font-medium text-grayscale-800 font-poppins text-xl tracking-wide">
                        {title}
                    </h6>
                </IonCol>
            </IonRow>
            <div className="flex flex-col items-center justify-center w-full mb-4 px-[20px] pb-[20px]">
                <div className="image-preview max-h-[250px] mb-[20px]">
                    <img
                        alt="Uploaded Image Preview"
                        className="max-h-[250px]"
                        src={photoSrc}
                        onClick={handleImageSelect}
                        referrerPolicy="no-referrer"
                    />
                </div>

                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                    placeholder="Title"
                    type="text"
                    value={state.photos?.[currentIndex]?.title}
                    onIonInput={e => {
                        let stateCopy = structuredClone(state.photos);
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

            {sectionPortal &&
                createPortal(
                    <div className="w-full flex flex-col items-center justify-center">
                        <div className="flex justify-center gap-[10px] items-center relative !border-none w-full max-w-[500px]">
                            {!imageUploadLoading ? (
                                <button
                                    onClick={() => {
                                        handleSave();
                                    }}
                                    className={`flex flex-1  items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide`}
                                >
                                    Save
                                </button>
                            ) : (
                                <button className="flex flex-1 items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide">
                                    {imageUploadLoading ? 'Uploading...' : 'Upload'}
                                </button>
                            )}

                            {photoSrc && (
                                <button
                                    onClick={handleImageSelect}
                                    className="flex flex-1 items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide"
                                >
                                    Change Photo
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col justify-center items-center relative !border-none w-full max-w-[500px]">
                            <button
                                onClick={() => {
                                    if (createMode) {
                                        setActiveMediaType(null);
                                        setShowCloseButtonState?.(true);
                                    } else {
                                        handleCloseModal?.();
                                    }
                                }}
                                className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                            >
                                Back
                            </button>
                        </div>
                    </div>,
                    sectionPortal
                )}
        </>
    );
};

export default BoostCMSMediaPhotoUpload;
