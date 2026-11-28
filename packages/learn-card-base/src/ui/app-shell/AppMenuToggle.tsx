import React, { useEffect, useRef, useState } from 'react';

import { appMenuController, useAppMenu } from './appMenuController';
import { getIonMode } from './ionMode';
import './app-shell.css';

export type AppMenuToggleProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Menu id to toggle (`menuId` on `AppMenu`); omit for the app's menu. */
    menu?: string;
    /**
     * Hide the toggle while the menu can't be toggled (no menu, disabled, or docked in the split
     * pane). Defaults to `true`, like `IonMenuToggle`.
     */
    autoHide?: boolean;
};

/**
 * App-owned replacement for `IonMenuToggle`: any click inside it toggles the side menu (a no-op
 * while the menu is docked or absent). Renders as an inline wrapper like the `ion-menu-toggle`
 * custom element, so layout utilities passed in `className` behave the same.
 */
export const AppMenuToggle: React.FC<AppMenuToggleProps> = ({
    menu,
    autoHide = true,
    className,
    children,
    ...rest
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const { isActive } = useAppMenu(menu);
    const [mode] = useState(getIonMode);
    const hidden = autoHide && !isActive;

    // Native listener on the element (like the Stencil host listener), so it runs before any
    // React `onClick` passed by the caller, as it did with IonMenuToggle.
    useEffect(() => {
        const element = ref.current;
        if (!element) return undefined;
        const onClick = (): void => appMenuController.toggle(menu);
        element.addEventListener('click', onClick);
        return () => element.removeEventListener('click', onClick);
    }, [menu]);

    const classes = ['app-menu-toggle', mode, hidden ? 'menu-toggle-hidden' : '', className ?? '']
        .filter(Boolean)
        .join(' ');

    return (
        <div ref={ref} className={classes} aria-hidden={hidden ? 'true' : undefined} {...rest}>
            {children}
        </div>
    );
};

export default AppMenuToggle;
