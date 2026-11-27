import React from 'react';

import { BREAKPOINTS, useBreakpointMatches, type Breakpoint } from './breakpoints';

export type AppColValue = string | number;

type ColProperty = 'size' | 'offset' | 'pull' | 'push';

export type AppColProps = React.HTMLAttributes<HTMLDivElement> & {
    [K in `${ColProperty}${Breakpoint}`]?: AppColValue;
} & {
    ref?: React.Ref<HTMLDivElement>;
};

/** `calc(N / columns * 100%)`, with columns from `--app-grid-columns`, then `--ion-grid-columns`. */
const columnsToPercent = (columns: AppColValue) =>
    `calc(calc(${columns} / var(--app-grid-columns, var(--ion-grid-columns, 12))) * 100%)`;

/** The value of the largest matching breakpoint that sets `property`, as ion-col's getColumns. */
const getColumns = (
    props: AppColProps,
    property: ColProperty,
    matches: number
): AppColValue | undefined => {
    let matched: AppColValue | undefined;
    BREAKPOINTS.forEach((bp, i) => {
        const value = props[`${property}${bp}`];
        if (matches & (1 << i) && value !== undefined) matched = value;
    });
    return matched;
};

/**
 * ion-col's inline styles: size sets flex / width / max-width, offset a margin, push and pull
 * left / right (sides swapped in RTL). Exported for tests.
 */
export const getColStyle = (
    props: AppColProps,
    matches: number,
    isRTL: boolean
): React.CSSProperties => {
    const style: React.CSSProperties = {};

    const offset = getColumns(props, 'offset', matches);
    if (offset) style[isRTL ? 'marginRight' : 'marginLeft'] = columnsToPercent(offset);
    const pull = getColumns(props, 'pull', matches);
    if (pull) style[isRTL ? 'left' : 'right'] = columnsToPercent(pull);
    const push = getColumns(props, 'push', matches);
    if (push) style[isRTL ? 'right' : 'left'] = columnsToPercent(push);

    const size = getColumns(props, 'size', matches);
    if (size) {
        const colSize = size === 'auto' ? 'auto' : columnsToPercent(size);
        Object.assign(style, { flex: `0 0 ${colSize}`, width: colSize, maxWidth: colSize });
    }
    return style;
};

const COL_PROPS = new Set(
    (['size', 'offset', 'pull', 'push'] as const).flatMap(p => BREAKPOINTS.map(bp => `${p}${bp}`))
);

/**
 * App-owned replacement for `IonCol`. Without a size it grows to share the row equally; `size`,
 * `offset`, `push` and `pull` (each with `Xs`...`Xl` variants) take 1 to 12 columns, or `"auto"` for
 * size, and apply at the largest matching breakpoint. Like ion-col, those become inline styles, so
 * they win over call-site classes and the caller's own `style`.
 */
export const AppCol: React.FC<AppColProps> = props => {
    const matches = useBreakpointMatches();
    const { className, style, ...rest } = props;
    const domProps = Object.fromEntries(
        Object.entries(rest).filter(([key]) => !COL_PROPS.has(key))
    ) as React.HTMLAttributes<HTMLDivElement>;
    const isRTL = typeof document !== 'undefined' && document.dir === 'rtl';

    return (
        <div
            className={className ? `app-col ${className}` : 'app-col'}
            style={{ ...style, ...getColStyle(props, matches, isRTL) }}
            {...domProps}
        />
    );
};

export default AppCol;
