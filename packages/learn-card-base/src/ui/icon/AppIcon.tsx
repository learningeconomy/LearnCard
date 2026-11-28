import React from 'react';

import { getIconSvg } from './svgContent';
import './icon.css';

export type AppIconSize = 'small' | 'large';

export type AppIconProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'children'> & {
    /** An `ionicons/icons` export (an inline SVG data URL). */
    icon: string;
    /** An Ionic color name (`primary`, `danger`, `grayscale-800`, ...), as `IonIcon`'s `color`. */
    color?: string;
    /** Ionic's fixed sizes: `small` is 1.125rem, `large` 2rem. Otherwise the icon is 1em square. */
    size?: AppIconSize;
    ref?: React.Ref<HTMLSpanElement>;
};

/**
 * App-owned replacement for `IonIcon` with no shadow DOM, no custom element and no fetches: a 1em
 * inline-block `span` (role `img`, as ion-icon's host) holding the icon's SVG, which takes its fill
 * and stroke from `currentColor`. Size it with `font-size` or `w-* h-*`, color it with `text-*` or
 * `color`.
 */
export const AppIcon: React.FC<AppIconProps> = ({
    icon,
    color,
    size,
    className,
    role = 'img',
    ...rest
}) => {
    const classes = [
        'app-icon',
        color && `ion-color ion-color-${color}`,
        size && `app-icon-${size}`,
        className,
    ];

    return (
        <span className={classes.filter(Boolean).join(' ')} role={role} {...rest}>
            {getIconSvg(icon)}
        </span>
    );
};

export default AppIcon;
