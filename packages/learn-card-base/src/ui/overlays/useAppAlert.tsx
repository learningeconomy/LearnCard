import React, { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';

import { AppAlert, type AppAlertButton, type AppAlertProps } from './AppAlert';

export type AppAlertOptions = Omit<AppAlertProps, 'isOpen'>;

type PresentedAlert = { root: Root; setOpen: (open: boolean) => void };

/** Renders an alert outside the caller's tree (it portals into `ion-app`). */
const ControlledAlert: React.FC<{
    options: AppAlertOptions;
    onRendered: (setOpen: (open: boolean) => void) => void;
}> = ({ options, onRendered }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    React.useLayoutEffect(() => onRendered(setIsOpen), [onRendered]);
    return <AppAlert {...options} isOpen={isOpen} />;
};

/**
 * `useIonAlert` for AppAlert: `present(options)`, or `present(message, buttons)` (an "Ok" button
 * by default), opens an alert; `dismiss()` closes it. As with Ionic's controller, one hook shows
 * one alert at a time (a `present` while it is up is ignored) and the alert outlives the caller.
 */
export const useAppAlert = (): [
    (messageOrOptions: string | AppAlertOptions, buttons?: (AppAlertButton | string)[]) => void,
    () => void,
] => {
    const current = useRef<PresentedAlert | null>(null);

    const present = useCallback(
        (messageOrOptions: string | AppAlertOptions, buttons?: (AppAlertButton | string)[]) => {
            if (current.current) return;
            const options: AppAlertOptions =
                typeof messageOrOptions === 'string'
                    ? { message: messageOrOptions, buttons: buttons ?? [{ text: 'Ok' }] }
                    : messageOrOptions;
            const root = createRoot(document.createElement('div'));
            const alert: PresentedAlert = { root, setOpen: () => undefined };
            current.current = alert;
            const onDidDismiss: AppAlertProps['onDidDismiss'] = event => {
                options.onDidDismiss?.(event);
                if (current.current === alert) current.current = null;
                setTimeout(() => root.unmount(), 0);
            };
            flushSync(() =>
                root.render(
                    <ControlledAlert
                        options={{ ...options, onDidDismiss }}
                        onRendered={setOpen => {
                            alert.setOpen = setOpen;
                        }}
                    />
                )
            );
        },
        []
    );

    const dismiss = useCallback(() => {
        const alert = current.current;
        current.current = null;
        alert?.setOpen(false);
    }, []);

    return [present, dismiss];
};

export default useAppAlert;
