import React, { useEffect, useRef } from 'react';
import { reorderThreeOutline, reorderTwoSharp } from 'ionicons/icons';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { AppIcon } from '../icon';
import { REORDER_GROUP_SELECTOR } from './AppReorderGroup';
import './reorder.css';

export type AppReorderProps = {
    /** Platform look of the default icon (`ios`: three lines, `md`: two). Defaults to the document's Ionic mode. */
    mode?: IonMode;
    className?: string;
    /** A custom handle. Without children it shows Ionic's reorder icon. */
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonReorder`, a port of @ionic/core 8.7.2 ion-reorder: the drag handle
 * for the `AppReorderGroup` item it's in. In an enabled group it's a block with a grab cursor and
 * `touch-action: none`, and a click on it doesn't reach the item (or anything else). It isn't
 * focusable and has no role, as with Ionic, so there's no keyboard reordering.
 */
export const AppReorder: React.FC<AppReorderProps> = ({ mode: modeProp, className, children }) => {
    const mode = modeProp ?? getIonMode();
    const ref = useRef<HTMLDivElement>(null);

    // ion-reorder's capture-phase click listener: keep the click from the item's own handlers,
    // unless the group is disabled (so a disabled list's rows stay clickable).
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const onClick = (ev: MouseEvent) => {
            const group = el.closest(REORDER_GROUP_SELECTOR);
            ev.preventDefault();
            if (!group || group.classList.contains('reorder-enabled')) {
                ev.stopImmediatePropagation();
            }
        };
        el.addEventListener('click', onClick, true);
        return () => el.removeEventListener('click', onClick, true);
    }, []);

    return (
        <div ref={ref} className={['app-reorder', mode, className].filter(Boolean).join(' ')}>
            {children ?? (
                <AppIcon
                    icon={mode === 'ios' ? reorderThreeOutline : reorderTwoSharp}
                    className="app-reorder-icon"
                    aria-hidden="true"
                />
            )}
        </div>
    );
};

export default AppReorder;
