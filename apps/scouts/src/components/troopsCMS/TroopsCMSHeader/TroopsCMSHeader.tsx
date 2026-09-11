import React from 'react';

import { IonHeader, IonRow, IonToolbar } from '@ionic/react';
import TroopsNetworkToggle from '../TroopsNetworkToggle/TroopsNetworkToggle';
import TransP, { type ParaglideMessage } from '../../../i18n/TransP';
import * as m from '../../../paraglide/messages.js';

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
    const { Icon, color } = getTroopsCMSViewModeDefaults(viewMode);

    const isCreate = editorMode === TroopsCMSEditorModeEnum.create;
    const headingMessages: Record<TroopsCMSViewModeEnum, ParaglideMessage> = {
        [TroopsCMSViewModeEnum.global]: isCreate
            ? m['troops.editor.newGlobalNetwork']
            : m['troops.editor.editGlobalNetwork'],
        [TroopsCMSViewModeEnum.network]: isCreate
            ? m['troops.editor.newNationalNetwork']
            : m['troops.editor.editNationalNetwork'],
        [TroopsCMSViewModeEnum.troop]: isCreate
            ? m['troops.editor.newTroop']
            : m['troops.editor.editTroop'],
        [TroopsCMSViewModeEnum.leader]: isCreate
            ? m['troops.editor.newLeader']
            : m['troops.editor.editLeader'],
        [TroopsCMSViewModeEnum.member]: isCreate
            ? m['troops.editor.newMember']
            : m['troops.editor.editMember'],
    };

    return (
        <IonHeader color="white" className="bg-white">
            <div className="ion-no-border px-2">
                <IonRow className="w-full flex items-center justify-center">
                    <div className="w-full flex flex-col items-start justify-center max-w-[600px] ion-padding">
                        <h2 className="text-grayscale-800 flex items-center justify-center text-[22px] font-notoSans text-graycale-900">
                            <Icon
                                className={`max-w-[40px] max-h-[40px] h-[40px] w-[40px] shrink-1 mr-2 text-${color}`}
                            />
                            <TransP
                                m={headingMessages[viewMode]}
                                components={[
                                    <span
                                        className={`font-semibold text-${color} m-0 p-0 ml-1 mt-[2px]`}
                                    />,
                                ]}
                            />
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
