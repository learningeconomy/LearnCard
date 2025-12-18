import React, { useEffect, useState } from 'react';

import { IonPage } from '@ionic/react';
import TroopsCMSLayout from '../TroopsCMSLayout';
import TroopsCMSFooter from '../TroopsCMSFooter/TroopsCMSFooter';
import TroopCMSContentForm from '../TroopsCMSContentForm/TroopsCMSContentForm';
import TroopsAppearanceForm from '../TroopsCMSAppearanceForm/TroopsCMSAppearanceForm';
import TroopsCMSTabs, { TroopsCMSTabsEnum } from '../TroopsCMSTabs/TroopsCMSTabs';
import TroopIDCard from './TroopIDCard';
import IDSleeve from 'learn-card-base/svgs/IDSleeve';

import { TroopsCMSEditorModeEnum, TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';

type TroopsIDCMSProps = {
    rootViewMode: TroopsCMSViewModeEnum; // view mode of the parent IE: Global, Network, Troop
    viewMode: TroopsCMSViewModeEnum;
    editorMode?: TroopsCMSEditorModeEnum;
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    handleCloseModal: () => void;
    handleSaveID?: (state?: TroopsCMSState) => void;
    editIdOnlyMode?: boolean;
};

export const TroopsIDCMS: React.FC<TroopsIDCMSProps> = ({
    rootViewMode,
    viewMode,
    editorMode = TroopsCMSEditorModeEnum.create,
    state,
    setState,
    handleCloseModal,
    handleSaveID,
    editIdOnlyMode,
}) => {
    const [activeTab, setActiveTab] = useState<TroopsCMSTabsEnum>(TroopsCMSTabsEnum.content);

    return (
        <IonPage>
            <TroopsCMSLayout
                state={state}
                viewMode={rootViewMode}
                layoutClassName="!max-w-[375px] vc-preview-modal-safe-area"
            >
                <div className="rounded-t-[20px] shadow-box-bottom overflow-hidden flex flex-col mb-[-2.5px]">
                    <div className="w-full flex items-center justify-center flex-col bg-white bg-opacity-70 backdrop-blur-[10px] rounded-t-[20px]">
                        <div className="w-full py-4 max-w-[335px]">
                            <TroopIDCard
                                idState={state}
                                parentState={state}
                                rootViewMode={rootViewMode}
                                viewMode={viewMode}
                                state={state}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full flex items-center justify-center relative mb-[-2.5px] bg-white bg-opacity-70 backdrop-blur-[10px]">
                    <IDSleeve className="h-auto w-full" />
                </div>

                <div className="bg-white ion-padding rounded-b-[20px] shadow-soft-bottom">
                    <TroopsCMSTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                    {activeTab === TroopsCMSTabsEnum.content ? (
                        <TroopCMSContentForm
                            rootViewMode={rootViewMode}
                            viewMode={viewMode}
                            state={state}
                            setState={setState}
                        />
                    ) : (
                        <TroopsAppearanceForm
                            rootViewMode={rootViewMode}
                            viewMode={viewMode}
                            state={state}
                            setState={setState}
                        />
                    )}
                </div>
            </TroopsCMSLayout>
            <TroopsCMSFooter
                rootViewMode={rootViewMode}
                viewMode={viewMode}
                state={state}
                handleCloseModal={handleCloseModal}
                activeTab={activeTab}
                handleSaveID={handleSaveID}
                editIdOnlyMode={editIdOnlyMode}
            />
        </IonPage>
    );
};

export default TroopsIDCMS;
