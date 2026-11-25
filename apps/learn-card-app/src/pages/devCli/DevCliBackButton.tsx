import React from 'react';
import { IonBackButton } from '@ionic/react';

import { useAppGoBack } from '../../components/app-shell/AppShellRouter';

/**
 * DevCli's toolbar back button. Keeps `IonBackButton` for its look, but supplies the click
 * handler: without IonReactRouter its built-in handler would hard-navigate
 * (`window.location.href = defaultHref`). `useAppGoBack` keeps IonReactRouter's behavior — go
 * back to the in-app page that opened the CLI, otherwise replace with `defaultHref`.
 */
export const DevCliBackButton: React.FC<{ defaultHref: string; className?: string }> = ({
    defaultHref,
    className,
}) => {
    const goBack = useAppGoBack(defaultHref);

    // IonBackButton renders `{ onClick: itsOwnHandler, ...props }`, so an `onClick` prop replaces
    // its handler. Its prop types don't declare `onClick`, hence the spread.
    const clickOverride = {
        onClick: (event: React.MouseEvent): void => {
            event.stopPropagation();
            goBack();
        },
    };

    return <IonBackButton defaultHref={defaultHref} className={className} {...clickOverride} />;
};

export default DevCliBackButton;
