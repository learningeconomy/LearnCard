import React, { useState, useLayoutEffect } from 'react';
import { useModal } from 'learn-card-base';
import { createPortal } from 'react-dom';

import { IonToolbar, IonHeader } from '@ionic/react';
import X from '../../../../svgs/X';
import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';

import { BoostCMSState, BoostCMSAppearanceDisplayTypeEnum } from '../../../boost';
import { getTopmostCancelPortal } from './boostCMSMedia.helpers';

type BoostCMSMediaOptionsProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    title?: String | React.ReactNode;
    displayType?: BoostCMSAppearanceDisplayTypeEnum;
    showCloseButton?: boolean;
    hideCloseButton?: boolean;
    keepModalOpenOnSave?: boolean;
    onSaveComplete?: () => void;
};

const BoostCMSMediaOptions: React.FC<BoostCMSMediaOptionsProps> = ({
    state,
    setState,
    title,
    displayType,
    showCloseButton,
    hideCloseButton,
    keepModalOpenOnSave = false,
    onSaveComplete,
}) => {
    const { closeModal, closeAllModals } = useModal();
    const [showCloseButtonState, setShowCloseButtonState] = useState<boolean>(
        !hideCloseButton && (showCloseButton ?? true)
    );
    const [sectionPortal, setSectionPortal] = useState<HTMLElement | null>(null);
    useLayoutEffect(() => {
        setSectionPortal(getTopmostCancelPortal());
    }, []);
    return (
        <>
            <section
                id="user-options-modal"
                className="max-w-[500px] flex flex-col items-center justify-center"
            >
                <IonHeader className="ion-no-border bg-white pt-5">
                    <div className="relative">
                        {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
                        {/*
                         * // ! Hotfix: inline X close button rendered directly in the header.
                         *
                         * When BoostCMSMediaOptions is used inside RecipientMediaAttachmentsModal
                         * (the BoostCMS recipient flow), the parent CancelModal is opened with
                         * `hideButton: true` and `hideCloseButton` is passed to this component,
                         * suppressing the portal-based Close button. Without this button there
                         * would be no way for the user to dismiss the modal.
                         *
                         * The portal-based Close button (below) continues to handle all other
                         * flows (e.g. ShortBoostSomeoneScreen) where the parent modal does
                         * render its own action buttons via the section-cancel-portal.
                         */}
                        {hideCloseButton && (
                            <button
                                onClick={() => closeModal()}
                                className="absolute right-4 top-0 p-1 text-grayscale-600 hover:text-grayscale-900 transition-colors z-9999"
                            >
                                <X className="w-6 h-6 text-grayscale-900" />
                            </button>
                        )}
                    </div>
                </IonHeader>

                <CreateMediaAttachmentForm
                    initialState={state}
                    createMode
                    setParentState={setState}
                    displayType={displayType}
                    showCloseButtonState={showCloseButtonState}
                    setShowCloseButtonState={setShowCloseButtonState}
                    keepModalOpenOnSave={keepModalOpenOnSave}
                    onSaveComplete={onSaveComplete}
                />
            </section>
            {sectionPortal &&
                showCloseButtonState &&
                createPortal(
                    <div className="w-full flex items-center justify-center">
                        <div className="flex flex-col justify-center items-center relative !border-none w-full max-w-[500px]">
                            <button
                                onClick={closeModal}
                                className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                            >
                                Close
                            </button>
                        </div>
                    </div>,
                    sectionPortal
                )}
        </>
    );
};

export default BoostCMSMediaOptions;
