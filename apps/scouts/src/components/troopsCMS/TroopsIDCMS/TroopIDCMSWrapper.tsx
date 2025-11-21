import React, { useEffect, useState } from 'react';

import TroopsIDCMS from './TroopsIDCMS';

import { TroopsCMSEditorModeEnum, TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { getActiveAppearanceTab, getPresetIDStylesSelected } from '../troops.helpers';
import { TroopsAppearanceTabs } from '../TroopsCMSAppearanceForm/TroopsCMSAppearanceTabs';

type TroopsIDCMSWrapperProps = {
    rootViewMode: TroopsCMSViewModeEnum; // view mode of the parent IE: Global, Network, Troop
    viewMode: TroopsCMSViewModeEnum;
    editorMode?: TroopsCMSEditorModeEnum;
    state: TroopsCMSState;
    setState?: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    handleCloseModal: () => void;
    handleSaveOverride?: (state: TroopsCMSState) => Promise<void>;
    editIdOnlyMode?: boolean;
};

export const TroopsIDCMSWrapper: React.FC<TroopsIDCMSWrapperProps> = ({
    rootViewMode,
    viewMode,
    editorMode = TroopsCMSEditorModeEnum.create,
    state,
    setState,
    handleCloseModal,
    handleSaveOverride,
    editIdOnlyMode,
}) => {
    const [_state, _setState] = useState<TroopsCMSState>(state);

    useEffect(() => {
        _setState(prevState => {
            return {
                ...prevState,
                ...getActiveAppearanceTab(_state, viewMode),
            };
        });
    }, []);

    const handleSaveID = () => {
        setState?.(prevState => {
            return {
                ...prevState,
                // override top level state with local state changes
                ..._state,
                ...getPresetIDStylesSelected(_state, viewMode),
            };
        });
        handleCloseModal();
    };

    return (
        <TroopsIDCMS
            handleCloseModal={handleCloseModal}
            rootViewMode={rootViewMode}
            viewMode={viewMode}
            state={_state}
            setState={_setState}
            handleSaveID={handleSaveOverride ? () => handleSaveOverride(_state) : handleSaveID}
            editIdOnlyMode={editIdOnlyMode}
        />
    );
};

export default TroopsIDCMSWrapper;
