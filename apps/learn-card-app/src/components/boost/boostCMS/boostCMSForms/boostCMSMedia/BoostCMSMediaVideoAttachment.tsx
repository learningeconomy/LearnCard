import React, { useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { createPortal } from 'react-dom';
import { Updater } from 'use-immer';

import { IonCol, IonRow, IonInput } from '@ionic/react';

import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';
import { BoostCMSMediaAttachment, BoostCMSMediaState } from 'learn-card-base';

type BoostCMSMediaVideoAttachmentProps = {
    state: BoostCMSMediaState;
    setState: Updater<BoostCMSMediaAttachment[]>;
    activeMediaType: BoostMediaOptionsEnum | null;
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
    setUploadedPhotos: React.Dispatch<React.SetStateAction<BoostCMSMediaAttachment[]>>;
    handleSave: (mediaState?: BoostCMSMediaState) => void;
    uploadedPhotos: BoostCMSMediaAttachment[];
    initialIndex?: number;
    createMode?: boolean;
    hideBackButton?: boolean;
    handleCloseModal?: () => void;
    setShowCloseButtonState?: React.Dispatch<React.SetStateAction<boolean>>;
};

const BoostCMSMediaVideoAttachment: React.FC<BoostCMSMediaVideoAttachmentProps> = ({
    state,
    setState,
    activeMediaType,
    setActiveMediaType,
    uploadedPhotos,
    handleSave,
    initialIndex,
    createMode,
    hideBackButton,
    handleCloseModal,
    setShowCloseButtonState,
}) => {
    const sectionPortal = document.getElementById('section-cancel-portal');

    const { title, Icon } = boostMediaOptions.find(({ type }) => type === activeMediaType);

    const [currentIndex, setCurrentIndex] = useState<number | undefined>(
        createMode ? undefined : initialIndex
    );

    const [newLinkTitle, setkNewLinkTitle] = useState<string>();
    const [newLinkUrl, setNewLinkUrl] = useState<string>();

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
            <div className="flex flex-col items-center justify-center w-full mb-4 px-[20px]">
                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                    placeholder="Title"
                    type="text"
                    value={state.videos?.[currentIndex]?.title || newLinkTitle}
                    onIonInput={e => {
                        let stateCopy = structuredClone(state.videos);
                        if (stateCopy[currentIndex]) {
                            stateCopy[currentIndex].title = e.detail.value as string;
                            setState(stateCopy);
                        } else {
                            setkNewLinkTitle(e.detail.value as string);
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') Keyboard.hide();
                    }}
                />
            </div>
            <div className="flex flex-col items-center justify-center w-full mb-4 px-[20px] pb-[20px]">
                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                    placeholder="Paste link..."
                    type="text"
                    value={state.videos?.[currentIndex]?.url || newLinkUrl}
                    onIonInput={e => {
                        let stateCopy = structuredClone(state.videos);
                        if (stateCopy[currentIndex]) {
                            stateCopy[currentIndex].url = e.detail.value as string;
                            setState(stateCopy);
                        } else {
                            setNewLinkUrl(e.detail.value as string);
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
                            <button
                                onClick={() => {
                                    if (newLinkUrl) {
                                        let stateCopy = structuredClone(state);
                                        let stateUpdate = [
                                            ...stateCopy.videos,
                                            {
                                                title: newLinkTitle || newLinkUrl,
                                                url: newLinkUrl,
                                                type: BoostMediaOptionsEnum.video,
                                            },
                                        ];
                                        stateCopy.videos = stateUpdate;
                                        setState(stateUpdate);
                                        handleSave(stateCopy);
                                    } else {
                                        handleSave();
                                    }
                                }}
                                className={`flex flex-1 items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide`}
                            >
                                Save
                            </button>
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

export default BoostCMSMediaVideoAttachment;
