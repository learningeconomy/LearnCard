import React, { createContext, useContext } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import './list.css';

export type AppListLines = 'full' | 'inset' | 'none';

const InAppListContext = createContext(false);

/** True inside an `AppList` (Ionic's `hostContext('ion-list')`): items there get `role="listitem"`. */
export const useInAppList = (): boolean => useContext(InAppListContext);

export type AppListProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Default bottom border of the `AppItem`s inside that set no `lines` themselves. */
    lines?: AppListLines;
    /** Rounded card with 16px margins. */
    inset?: boolean;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonList`: a `role="list"` block (a caller's `role` wins, as it did on
 * `ion-list`) with Ionic 8's md / ios background, md 8px vertical padding and the `lines` defaults
 * for the items inside.
 */
export const AppList: React.FC<AppListProps> = ({
    lines,
    inset = false,
    mode: modeProp,
    className,
    role = 'list',
    children,
    ...rest
}) => {
    const mode = modeProp ?? getIonMode();
    const classes = [
        'app-list',
        `app-list-${mode}`,
        inset && 'app-list-inset',
        lines && `app-list-lines-${lines}`,
        className,
    ];

    return (
        <InAppListContext.Provider value>
            <div role={role} className={classes.filter(Boolean).join(' ')} {...rest}>
                {children}
            </div>
        </InAppListContext.Provider>
    );
};

export default AppList;
