import React from 'react';

import './skeleton-progress.css';

/** React's CSS properties plus custom properties (`--background`, `--background-rgb`, `--border-radius`). */
export type AppSkeletonTextStyle = React.CSSProperties & {
    [customProperty: `--${string}`]: string | number | undefined;
};

export type AppSkeletonTextProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> & {
    /** Run the shimmer. ion-skeleton-text default: `false`. */
    animated?: boolean;
    style?: AppSkeletonTextStyle;
};

/**
 * App-owned replacement for `IonSkeletonText` (@ionic/core 8.7.2): a full-width block with one line of
 * height (a non-breaking space at a 10px line height), 4px vertical margins, and the same translucent
 * fill and moving gradient. Call-site classes and inline styles override the defaults, as they did on
 * the Ionic host. Inside `ion-avatar` or `ion-thumbnail` it drops its margins and fills the height
 * (Ionic's `in-media`). It is a `span` so it stays valid inside `<p>` and headings.
 */
export const AppSkeletonText: React.FC<AppSkeletonTextProps> = ({
    animated = false,
    className,
    ...rest
}) => (
    <span
        {...rest}
        className={[className, 'app-skeleton-text', animated ? 'app-skeleton-text-animated' : '']
            .filter(Boolean)
            .join(' ')}
    >
        <span className="app-skeleton-text-space">{'\u00A0'}</span>
    </span>
);

export default AppSkeletonText;
