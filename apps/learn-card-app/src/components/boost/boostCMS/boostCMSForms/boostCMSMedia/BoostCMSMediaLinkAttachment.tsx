import React, { useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { BoostCMSMediaAttachment, BoostCMSMediaState, useModal } from 'learn-card-base';
import { IonCol, IonRow, IonInput } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { Updater } from 'use-immer';
import { boostMediaOptions, BoostMediaOptionsEnum } from '../../../boost';

type BoostCMSMediaLinkAttachmentProps = {
    state: BoostCMSMediaState;
    setState: Updater<BoostCMSMediaAttachment[]>;
    activeMediaType: BoostMediaOptionsEnum | null;
    setActiveMediaType: React.Dispatch<React.SetStateAction<BoostMediaOptionsEnum | null>>;
    setUploadedPhotos: React.Dispatch<React.SetStateAction<BoostCMSMediaAttachment[]>>;
    handleSave: (mediaState?: BoostCMSMediaState) => void;
    initialIndex?: number;
    createMode?: boolean;
    hideBackButton?: boolean;
    handleCloseModal?: () => void;
};

const BoostCMSMediaLinkAttachment: React.FC<BoostCMSMediaLinkAttachmentProps> = ({
    state,
    setState,
    activeMediaType,
    setActiveMediaType,
    handleSave,
    initialIndex,
    createMode,
    hideBackButton,
    handleCloseModal,
}) => {
    const { closeModal } = useModal();

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
                    <h6 className="flex items-center justify-center font-medium text-grayscale-800 font-poppins text-xl tracking-wide">
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
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                    placeholder="Title"
                    type="text"
                    value={state.links?.[currentIndex]?.title || newLinkTitle}
                    onIonInput={e => {
                        let stateCopy = structuredClone(state.links);
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
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                    placeholder="Paste link..."
                    type="text"
                    value={state.links?.[currentIndex]?.url || newLinkUrl}
                    onIonInput={e => {
                        let stateCopy = structuredClone(state.links);
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
                            ...stateCopy.links,
                            {
                                title: newLinkTitle || newLinkUrl,
                                url: newLinkUrl,
                                type: BoostMediaOptionsEnum.link,
                            },
                        ];
                        stateCopy.links = stateUpdate;
                        setState(stateUpdate);
                        handleSave(stateCopy);
                    } else {
                        handleSave();
                    }
                }}
                className={`flex items-center justify-center rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide bg-grayscale-900`}
            >
                Save
            </button>
            <div className="w-full flex items-center justify-center mt-[20px]">
                <button
                    onClick={() => {
                        setState([]);
                        if (!hideBackButton) {
                            setActiveMediaType(null);
                        }
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

export default BoostCMSMediaLinkAttachment;
