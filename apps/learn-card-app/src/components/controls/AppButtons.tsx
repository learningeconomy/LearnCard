import React, { createContext, useContext } from 'react';

import { getIonMode } from '../app-shell/ionMode';
import './controls.css';

/** True inside an `AppButtons` group: AppButton then defaults to `fill="clear"`, as in ion-buttons. */
const AppButtonsContext = createContext(false);

export const useInAppButtons = (): boolean => useContext(AppButtonsContext);

export type AppButtonsProps = {
    /** Toolbar slot. `ion-toolbar` still places children by their `slot` attribute. */
    slot?: 'start' | 'end';
    className?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonButtons`: a flex row of toolbar buttons. Inside an `IonToolbar`
 * it gets the toolbar's ion-buttons styling (ios 38px min-height, md start/end margins) and its
 * `AppButton` children get Ionic's in-buttons look (clear fill, toolbar color, compact padding).
 */
export const AppButtons: React.FC<AppButtonsProps> = ({ slot, className, children }) => {
    const mode = getIonMode();

    return (
        <AppButtonsContext.Provider value>
            <div slot={slot} className={['app-buttons', mode, className].filter(Boolean).join(' ')}>
                {children}
            </div>
        </AppButtonsContext.Provider>
    );
};

export default AppButtons;
