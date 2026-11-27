import React from 'react';

import '../controls/controls.css';
import './widgets.css';

export type AppTextColor = 'primary' | 'medium' | 'danger';

export type AppTextProps = React.HTMLAttributes<HTMLSpanElement> & {
    /** Palette color (`--app-color-*`). Omitted: inherits the surrounding color. */
    color?: AppTextColor;
    ref?: React.Ref<HTMLSpanElement>;
};

/** App-owned replacement for `IonText`: an inline wrapper that sets the text color. */
export const AppText: React.FC<AppTextProps> = ({ color, className, ...rest }) => {
    const classes = ['app-text', color && `app-color app-color-${color}`, className];
    return <span className={classes.filter(Boolean).join(' ')} {...rest} />;
};

export default AppText;
