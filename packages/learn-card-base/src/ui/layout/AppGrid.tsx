import React from 'react';

export type AppGridProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Fixed width per breakpoint (`--ion-grid-width-*`, 540/720/960/1140px), as `IonGrid`'s `fixed`. */
    fixed?: boolean;
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonGrid`: a centered block with Ionic's responsive padding
 * (`--app-grid-padding-*`, falling back to `--ion-grid-padding-*`, 5px by default). Styles come from
 * `layout.css`, which `src/tailwind.css` imports.
 */
export const AppGrid: React.FC<AppGridProps> = ({ fixed = false, className, ...rest }) => {
    const classes = ['app-grid', fixed && 'app-grid-fixed', className];

    return <div className={classes.filter(Boolean).join(' ')} {...rest} />;
};

export default AppGrid;
