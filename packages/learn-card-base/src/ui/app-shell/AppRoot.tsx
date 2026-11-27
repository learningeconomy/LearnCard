import React, { useState } from 'react';

import { getIonMode } from './ionMode';
import './app-shell.css';

export type AppRootProps = {
    className?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonApp`: the full-screen `.ion-page` box every page, menu and
 * overlay renders inside. Overlays portal into it (`getOverlayRoot`). Call `initAppPlatform()`
 * before the first render so `<html mode>` is set.
 */
export const AppRoot: React.FC<AppRootProps> = ({ className, children }) => {
    const [mode] = useState(getIonMode);
    return (
        <div className={['app-root', 'ion-page', mode, className].filter(Boolean).join(' ')}>
            {children}
        </div>
    );
};

export default AppRoot;
