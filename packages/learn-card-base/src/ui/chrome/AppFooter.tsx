import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import type { IonMode } from '../app-shell/ionMode';
import { watchKeyboardVisibility } from './keyboardVisibility';
import { attachScrollFade, footerFadeScale } from './scrollFade';
import { useChromeMode } from './useChromeMode';
import './chrome.css';

export type AppFooterProps = React.HTMLAttributes<HTMLDivElement> & {
    /** iOS only: blur the content scrolling under the footer and make its toolbars 80% opaque. */
    translucent?: boolean;
    /** iOS only: `fade` hides the toolbar backgrounds once the content is scrolled to the end. */
    collapse?: 'fade';
    /** Platform look. Defaults to the document's Ionic mode; Ionic took the closest `mode`. */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

/** Ionic's `footer-toolbar-padding`: the last toolbar pads by the bottom safe-area inset. */
const TOOLBAR_PADDING_CLASS = 'app-footer-toolbar-padding';

/**
 * App-owned replacement for `IonFooter`: the page's bottom bar, last in the page's flex column.
 * Its last `AppToolbar` takes the bottom safe-area inset, except while the native keyboard is up.
 * iOS draws a hairline over the first toolbar, md a drop shadow; `ion-no-border` removes either.
 *
 * Like the ion-footer element, it toggles its own classes with `classList`, so a caller that
 * rewrites `className` on keyboard events (to hide the footer) keeps working.
 */
export const AppFooter: React.FC<AppFooterProps> = ({
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
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    useImperativeHandle(ref, () => elRef.current as HTMLDivElement);

    useEffect(() => watchKeyboardVisibility(setKeyboardVisible), []);

    // No dependency list: a className change makes React rewrite the class attribute.
    useLayoutEffect(() => {
        elRef.current?.classList.toggle(TOOLBAR_PADDING_CLASS, !keyboardVisible);
    });

    useEffect(() => {
        const el = elRef.current;
        if (!el || mode !== 'ios' || collapse !== 'fade') return undefined;
        return attachScrollFade(el, footerFadeScale);
    }, [mode, collapse]);

    const classes = [
        'app-footer',
        mode,
        `app-footer-${mode}`,
        translucent && 'app-footer-translucent',
        translucent && `app-footer-translucent-${mode}`,
        collapse && `app-footer-collapse-${collapse}`,
        className,
    ];

    return (
        <div
            role="contentinfo"
            {...rest}
            {...(modeProp ? { mode: modeProp } : {})}
            ref={elRef}
            // The ion-footer tag selectors' stand-in (survives className rewrites), and the hook
            // learn-card-base's KeyboardFocusManager looks for.
            data-app-footer=""
            data-keyboard-footer=""
            className={classes.filter(Boolean).join(' ')}
        >
            {mode === 'ios' && translucent && <div className="app-footer-background" />}
            {children}
        </div>
    );
};

export default AppFooter;
