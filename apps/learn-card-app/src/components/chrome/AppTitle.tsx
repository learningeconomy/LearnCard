import React, { useImperativeHandle, useRef } from 'react';

import type { IonMode } from '../app-shell/ionMode';
import { useChromeMode } from './useChromeMode';
import './chrome.css';

export type AppTitleProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> & {
    /** `large` is the iOS collapsible large title, `small` the subtitle size. */
    size?: 'large' | 'small';
    /** A theme color name for the text, as ion-title's `color`. */
    color?: string;
    /** Platform look. Defaults to the document's Ionic mode. */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonTitle`: a toolbar title that truncates with an ellipsis. In iOS
 * mode it is centered across the whole toolbar, under the start and end buttons, as ion-title was.
 */
export const AppTitle: React.FC<AppTitleProps> = ({
    size,
    color,
    mode: modeProp,
    className,
    children,
    ref,
    ...rest
}) => {
    const elRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => elRef.current as HTMLDivElement);
    const mode = useChromeMode(elRef, modeProp);
    const classes = [
        'app-title',
        mode,
        `app-title-${mode}`,
        `app-title-${size ?? 'default'}`,
        color && `ion-color ion-color-${color}`,
        className,
    ];

    return (
        <div {...rest} ref={elRef} className={classes.filter(Boolean).join(' ')}>
            <div className="app-title-inner">{children}</div>
        </div>
    );
};

export default AppTitle;
