import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';

import type { IonMode } from '../app-shell/ionMode';
import { attachScrollFade, headerFadeScale } from './scrollFade';
import { useChromeMode } from './useChromeMode';
import './chrome.css';

export type AppHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * iOS only: blur the content scrolling under the header and make its toolbars 80% opaque.
     * Pair it with `fullscreen` on the page's IonContent so the content runs under the header.
     */
    translucent?: boolean;
    /** iOS only: `fade` hides the toolbar backgrounds until the content scrolls. */
    collapse?: 'fade';
    /** Platform look. Defaults to the document's Ionic mode; Ionic took the closest `mode`. */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonHeader`: the page's top bar, first in the page's flex column. Its
 * first `AppToolbar` takes the top safe-area inset. iOS draws a hairline under the last toolbar,
 * md a drop shadow; the `ion-no-border` class removes either.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
    translucent = false,
    collapse,
    mode: modeProp,
    className,
    children,
    ref,
    ...rest
}) => {
    const elRef = useRef<HTMLDivElement>(null);
    const mode = useChromeMode(elRef, modeProp);
    useImperativeHandle(ref, () => elRef.current as HTMLDivElement);

    // Ionic gives the header no landmark inside a side menu.
    useLayoutEffect(() => {
        const el = elRef.current;
        if (el && rest.role === undefined && el.closest('ion-menu, .app-menu')) {
            el.setAttribute('role', 'none');
        }
    }, [rest.role]);

    useEffect(() => {
        const el = elRef.current;
        if (!el || mode !== 'ios' || collapse !== 'fade') return undefined;
        return attachScrollFade(el, headerFadeScale);
    }, [mode, collapse]);

    const classes = [
        'app-header',
        mode,
        `app-header-${mode}`,
        `app-header-collapse-${collapse ?? 'none'}`,
        translucent && 'app-header-translucent',
        translucent && `app-header-translucent-${mode}`,
        className,
    ];

    return (
        <div
            role="banner"
            {...rest}
            {...(modeProp ? { mode: modeProp } : {})}
            ref={elRef}
            className={classes.filter(Boolean).join(' ')}
        >
            {mode === 'ios' && translucent && <div className="app-header-background" />}
            {children}
        </div>
    );
};

export default AppHeader;
