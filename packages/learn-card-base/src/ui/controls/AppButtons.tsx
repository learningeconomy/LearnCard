import React, { createContext, useContext } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import './controls.css';

/** True inside an `AppButtons` group: AppButton then defaults to `fill="clear"`, as in ion-buttons. */
const AppButtonsContext = createContext(false);

export const useInAppButtons = (): boolean => useContext(AppButtonsContext);

export type AppButtonsProps = {
    /**
     * Toolbar slot (`AppToolbar` places its children by their `slot` prop), or `buttons`
     * for AppDatetime's `buttons` (ion-datetime's `slot="buttons"`).
     */
    slot?: 'start' | 'end' | 'buttons';
    /** Platform look. Defaults to the document's Ionic mode; Ionic took the closest `mode`. */
    mode?: IonMode;
    className?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonButtons`: a flex row of toolbar buttons. Inside an `AppToolbar`
 * it gets the toolbar's ion-buttons styling (ios 38px min-height, md start/end margins) and its
 * `AppButton` children get Ionic's in-buttons look (clear fill, toolbar color, compact padding).
 */
export const AppButtons: React.FC<AppButtonsProps> = ({
    slot,
    mode: modeProp,
    className,
    children,
}) => {
    const mode = modeProp ?? getIonMode();

    return (
        <AppButtonsContext.Provider value>
            <div slot={slot} className={['app-buttons', mode, className].filter(Boolean).join(' ')}>
                {children}
            </div>
        </AppButtonsContext.Provider>
    );
};

export default AppButtons;
