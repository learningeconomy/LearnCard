import React, { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { IonFooter, IonLoading, IonToolbar } from '@ionic/react';
import TroopIDPreview from '../TroopsIDCMS/TroopIDPreview/TroopIDPreview';
import X from '../../svgs/X';

import { TroopsCMSTabsEnum } from '../TroopsCMSTabs/TroopsCMSTabs';
import { TroopsCMSEditorModeEnum, TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { isPlatformIOS, useModal, ModalTypes } from 'learn-card-base';

import keyboardStore from 'learn-card-base/stores/keyboardStore';

type TroopsCMSFooterProps = {
    rootViewMode?: TroopsCMSViewModeEnum;
    viewMode: TroopsCMSViewModeEnum;
    state?: TroopsCMSState;
    activeTab: TroopsCMSTabsEnum;
    handleCloseModal: () => void;
    handlePublishBoosts?: () => void;
    handleSaveID?: () => void;
    editorMode?: TroopsCMSEditorModeEnum;
    editIdOnlyMode?: boolean;
};

export const TroopsCMSFooter: React.FC<TroopsCMSFooterProps> = ({
    rootViewMode,
    viewMode,
    state,
    activeTab,
    handleCloseModal,
    handlePublishBoosts,
    handleSaveID,
    editorMode,
    editIdOnlyMode,
}) => {
    const bottomBarRef = useRef<HTMLDivElement>();
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;
    const isInIDMode = isInMemberViewMode || isInLeaderViewMode;
    const isEdit = editorMode === TroopsCMSEditorModeEnum.edit;

    const [isSaving, setIsSaving] = useState(false);

    let actionButtonColor = 'bg-sp-green-forest';

    if (viewMode === TroopsCMSViewModeEnum.troop || viewMode === TroopsCMSViewModeEnum.member) {
        actionButtonColor = 'bg-sp-green-forest';
    } else if (viewMode === TroopsCMSViewModeEnum.network) {
        actionButtonColor = 'bg-sp-fire-red';
    } else {
        actionButtonColor = 'bg-sp-purple-base';
    }

    const { newModal, closeModal: closePreviewModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const openPreview = () => {
        if (!state) return;

        newModal(
            <TroopIDPreview
                rootViewMode={rootViewMode as TroopsCMSViewModeEnum}
                viewMode={viewMode}
                state={state}
                handleCloseModal={() => closePreviewModal()}
            />
        );
    };

    keyboardStore.store.subscribe(({ isOpen }) => {
        if (isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className =
                'w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] pb-[15px] absolute bottom-0 bg-white !max-h-[85px] hidden';
        }
        if (!isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className =
                'w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] pb-[15px] absolute bottom-0 bg-white !max-h-[85px]';
        }
    });

    const footerStyles = isPlatformIOS() ? 'pt-4' : '';

    const isTroopCreationDisabled =
        viewMode === TroopsCMSViewModeEnum.troop && !state?.basicInfo?.name;

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] absolute bottom-0 bg-white !max-h-[85px]"
            ref={bottomBarRef as any}
        >
            <IonToolbar color="transparent" mode="ios">
                {isInIDMode && (
                    <>
                        {editIdOnlyMode && (
                            <IonLoading mode="ios" message="Saving..." isOpen={isSaving} />
                        )}
                        <div className={`w-full flex items-center justify-center ${footerStyles}`}>
                            <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                                <button
                                    onClick={handleCloseModal}
                                    className="rounded-full bg-white shadow-soft-bottom min-h-[52px] min-w-[52px] flex items-center justify-center mr-2"
                                >
                                    <X className="h-auto w-[20px] text-grayscale-80" />
                                </button>
                                <button
                                    onClick={() => openPreview()}
                                    className="bg-white text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                                >
                                    Preview
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            setIsSaving(true);
                                            await handleSaveID?.();
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    className={`text-white text-lg font-bold rounded-full py-[12px] w-full disabled:opacity-60 ${actionButtonColor}`}
                                    disabled={isSaving}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {!isInIDMode && (
                    <div className={`w-full flex items-center justify-center ${footerStyles}`}>
                        <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                            <button
                                onClick={handleCloseModal}
                                className="bg-white text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isTroopCreationDisabled ?? false}
                                onClick={() => handlePublishBoosts?.()}
                                className={`text-white text-lg font-bold rounded-full py-[12px] w-full ${
                                    isTroopCreationDisabled ? 'bg-opacity-50' : ''
                                } ${actionButtonColor}`}
                            >
                                {isEdit ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </div>
                )}
            </IonToolbar>
        </IonFooter>
    );
};

export default TroopsCMSFooter;
