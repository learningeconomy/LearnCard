import React, { useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import * as m from '../../../../../paraglide/messages.js';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { Updater } from 'use-immer';
import { boostMediaOptions, BoostMediaOptionsEnum, mediaTypeTitle } from '../../../boost';
import { BoostCMSMediaAttachment, BoostCMSMediaState } from 'learn-card-base';
import { AppInput } from 'learn-card-base/ui/controls/AppInput';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

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
    const { id, type, titleKey, color, Icon } = boostMediaOptions.find(
        ({ type }) => type === activeMediaType
    );

    const [currentIndex, setCurrentIndex] = useState<number | undefined>(
        createMode ? undefined : initialIndex
    );

    const [newLinkTitle, setkNewLinkTitle] = useState<string>();
    const [newLinkUrl, setNewLinkUrl] = useState<string>();

    return (
        <>
            <AppRow className="flex flex-col pb-4">
                <AppCol className="w-full flex items-center justify-between mt-8 mb-2">
                    <h6 className="flex items-center justify-center font-medium text-grayscale-800 text-2xl font-notoSans">
                        {!hideBackButton && (
                            <button
                                className="text-grayscale-50 p-0 mr-[10px]"
                                onClick={() => setActiveMediaType(null)}
                            >
                                <CaretLeft className="rtl-mirror h-auto w-3 text-grayscale-800" />
                            </button>
                        )}
                        {mediaTypeTitle(titleKey)}
                    </h6>

                    <Icon className={`text-${color} h-[40px] max-h-[40px] max-w-[40px]`} />
                </AppCol>
            </AppRow>
            <div className="flex flex-col items-center justify-center w-full mb-4">
                <AppInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base font-notoSans`}
                    placeholder={m['boostCMS.titleField']()}
                    type="text"
                    value={state.videos?.[currentIndex]?.title || newLinkTitle}
                    onValueInput={value => {
                        const stateCopy = structuredClone(state.videos);
                        if (stateCopy[currentIndex]) {
                            stateCopy[currentIndex].title = value;
                            setState(stateCopy);
                        } else {
                            setkNewLinkTitle(value);
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') Keyboard.hide();
                    }}
                />
            </div>
            <div className="flex flex-col items-center justify-center w-full mb-4">
                <AppInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base font-notoSans`}
                    placeholder={m['boostCMS.pasteLink']()}
                    type="text"
                    value={state.videos?.[currentIndex]?.url || newLinkUrl}
                    onValueInput={value => {
                        const stateCopy = structuredClone(state.videos);
                        if (stateCopy[currentIndex]) {
                            stateCopy[currentIndex].url = value;
                            setState(stateCopy);
                        } else {
                            setNewLinkUrl(value);
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
                        const stateCopy = structuredClone(state);
                        const stateUpdate = [
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
                {m['common.save']()}
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
                    {m['common.cancel']()}
                </button>
            </div>
        </>
    );
};

export default BoostCMSMediaVideoAttachment;
