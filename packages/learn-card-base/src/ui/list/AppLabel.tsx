import React from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import './list.css';

export type AppLabelProps = React.HTMLAttributes<HTMLSpanElement> & {
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    ref?: React.Ref<HTMLSpanElement>;
};

/**
 * App-owned replacement for `IonLabel`: inline text outside an `AppItem` (as the unstyled
 * `ion-label` element was); inside one, a block that fills the row. Headings and paragraphs
 * inside get Ionic's md / ios label typography.
 */
export const AppLabel: React.FC<AppLabelProps> = ({
    mode: modeProp,
    className,
    children,
    ...rest
}) => {
    const mode = modeProp ?? getIonMode();
    const classes = ['app-label', `app-label-${mode}`, className];

    return (
        <span className={classes.filter(Boolean).join(' ')} {...rest}>
            {children}
        </span>
    );
};

export default AppLabel;
