import React from 'react';

import { IonHeader, IonRow, IonToolbar } from '@ionic/react';
import TroopsNetworkToggle from '../TroopsNetworkToggle/TroopsNetworkToggle';

import {
    getTroopsCMSViewModeDefaults,
    TroopsCMSEditorModeEnum,
    TroopsCMSState,
    TroopsCMSViewModeEnum,
} from '../troopCMSState';

type TroopsCMSHeaderProps = {
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    editorMode?: TroopsCMSEditorModeEnum;
    isParentBoostLoading?: boolean;
};

export const TroopsCMSHeader: React.FC<TroopsCMSHeaderProps> = ({
    state,
    setState,
    viewMode,
    editorMode,
    isParentBoostLoading,
}) => {
    const { title, Icon, color } = getTroopsCMSViewModeDefaults(viewMode);

    const isCreate = editorMode === TroopsCMSEditorModeEnum.create;

    return (
        <IonHeader color="white" className="bg-white">
            <div className="ion-no-border px-2">
                <IonRow className="w-full flex items-center justify-center">
                    <div className="w-full flex flex-col items-start justify-center max-w-[600px] ion-padding">
                        <h2 className="text-grayscale-800 flex items-center justify-center text-[22px] font-notoSans text-graycale-900">
                            <Icon
                                className={`max-w-[40px] max-h-[40px] h-[40px] w-[40px] shrink-1 mr-2 text-${color}`}
                            />
                            {isCreate ? 'New' : 'Edit'}{' '}
                            <span className={`font-semibold text-${color} m-0 p-0 ml-1 mt-[2px]`}>
                                {title}
                            </span>
                        </h2>

                        <TroopsNetworkToggle
                            state={state}
                            setState={setState}
                            viewMode={viewMode}
                            isParentBoostLoading={isParentBoostLoading}
                            enableSwitching={isCreate}
                        />
                    </div>
                </IonRow>
            </div>
        </IonHeader>
    );
};

export default TroopsCMSHeader;
