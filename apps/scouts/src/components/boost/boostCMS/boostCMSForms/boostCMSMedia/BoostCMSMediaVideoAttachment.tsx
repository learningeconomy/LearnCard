import React, { useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { IonCol, IonRow, IonInput } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { Updater } from 'use-immer';
import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';
import { BoostCMSMediaAttachment, BoostCMSMediaState } from 'learn-card-base';

const BoostCMSMediaVideoAttachment: React.FC<{
    state: BoostCMSMediaState;
    setState: Updater<BoostCMSMediaAttachment[]>;
    activeMediaType: BoostMediaOptionsEnum | null;
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
    handleCloseModal?: () => void;
    setUploadedPhotos: React.Dispatch<React.SetStateAction<BoostCMSMediaAttachment[]>>;
    handleSave: (mediaState?: BoostCMSMediaState) => void;
    uploadedPhotos: BoostCMSMediaAttachment[];
    initialIndex?: number;
    createMode?: boolean;
    hideBackButton?: boolean;
}> = ({
    state,
    setState,
    activeMediaType,
    setActiveMediaType,
    handleCloseModal,
    uploadedPhotos,
    handleSave,
    initialIndex,
    createMode,
    hideBackButton,
}) => {
    const { id, type, title, color, Icon } = boostMediaOptions.find(
        ({ type }) => type === activeMediaType
    );

    const [currentIndex, setCurrentIndex] = useState<number | undefined>(
        createMode ? undefined : initialIndex
    );

    const [newLinkTitle, setkNewLinkTitle] = useState<string>();
    const [newLinkUrl, setNewLinkUrl] = useState<string>();

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
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base font-notoSans`}
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
            <div className="flex flex-col items-center justify-center w-full mb-4">
                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base font-notoSans`}
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
                className={`flex items-center justify-center rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg bg-grayscale-900 font-notoSans`}
            >
                Save
            </button>
            <div className="w-full flex items-center justify-center mt-[20px]">
                <button
                    onClick={() => {
                        if (!hideBackButton) {
                            setState([]);
                            setActiveMediaType(null);
                        }
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

export default BoostCMSMediaVideoAttachment;
