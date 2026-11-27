import React, { useImperativeHandle, useRef } from 'react';

import type { IonMode } from '../app-shell/ionMode';
import { AppTitle, type AppTitleProps } from './AppTitle';
import { partitionToolbarChildren } from './slots';
import { useChromeMode } from './useChromeMode';
import './chrome.css';

/** Inline styles, plus the toolbar's custom properties (`--background`, `--min-height`, ...). */
export type AppToolbarStyle =
    | React.CSSProperties
    | (React.CSSProperties & { [property: `--${string}`]: string | number | undefined });

export type AppToolbarProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'style'> & {
    style?: AppToolbarStyle;
    /**
     * A theme color name (`primary`, `light`, `grayscale-900`, ...). It sets the toolbar's
     * background and text to the color's base and contrast, as ion-toolbar's `color` did. A name
     * the theme doesn't define leaves the background transparent, as it did with Ionic.
     */
    color?: string;
    /** Platform look. Defaults to the document's Ionic mode; Ionic took the closest `mode`. */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

const hasLargeTitle = (content: React.ReactNode[]): boolean =>
    content.some(
        child =>
            React.isValidElement<AppTitleProps>(child) &&
            child.type === AppTitle &&
            child.props.size === 'large'
    );

/**
 * App-owned replacement for `IonToolbar`. Same DOM as its shadow tree: a background layer under a
 * flex row of `start`, `secondary`, content, `primary` and `end` children. Direct children are
 * placed by their `slot` prop, which is also the reading and tab order.
 *
 * Inside an `AppHeader` the first toolbar takes the top safe-area inset, and inside an `AppFooter`
 * the last takes the bottom one. Every toolbar pads by the left and right insets. The custom
 * properties ion-toolbar read (`--background`, `--color`, `--border-*`, `--padding-*`,
 * `--min-height`, `--opacity`) work the same, so call-site `[--background:...]` utilities keep
 * working.
 */
export const AppToolbar: React.FC<AppToolbarProps> = ({
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
    const { start, secondary, content, primary, end } = partitionToolbarChildren(children);

    const classes = [
        'app-toolbar',
        mode,
        `app-toolbar-${mode}`,
        color && `ion-color ion-color-${color}`,
        hasLargeTitle(content) && 'app-toolbar-title-large',
        className,
    ];

    return (
        <div
            {...rest}
            // Ionic components still inside resolve their mode from the closest `mode` attribute.
            {...(modeProp ? { mode: modeProp } : {})}
            ref={elRef}
            className={classes.filter(Boolean).join(' ')}
        >
            <div className="app-toolbar-background" />
            <div className="app-toolbar-container">
                {start}
                {secondary}
                <div className="app-toolbar-content">{content}</div>
                {primary}
                {end}
            </div>
        </div>
    );
};

export default AppToolbar;
