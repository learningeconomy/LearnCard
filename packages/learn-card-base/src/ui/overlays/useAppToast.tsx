import React, { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';

import { AppToast, type AppToastProps } from './AppToast';

export type AppToastOptions = Omit<AppToastProps, 'isOpen'>;

type PresentedToast = { root: Root; setOpen: (open: boolean) => void };

/** Renders a toast outside the caller's tree (it portals into the app root (`AppRoot`) like inline toasts). */
const ControlledToast: React.FC<{
    options: AppToastOptions;
    onRendered: (setOpen: (open: boolean) => void) => void;
}> = ({ options, onRendered }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    React.useLayoutEffect(() => onRendered(setIsOpen), [onRendered]);
    return <AppToast {...options} isOpen={isOpen} />;
};

/**
 * `useIonToast` for AppToast: `present(options)` or `present(message, duration)` opens a toast,
 * `dismiss()` closes it. As with Ionic's controller, one hook shows one toast at a time (a
 * `present` while its toast is still up is ignored), and the toast outlives the calling
 * component's unmount.
 */
export const useAppToast = (): [
    (messageOrOptions: string | AppToastOptions, duration?: number) => void,
    () => void,
] => {
    const current = useRef<PresentedToast | null>(null);

    const present = useCallback((messageOrOptions: string | AppToastOptions, duration?: number) => {
        if (current.current) return;
        const options: AppToastOptions =
            typeof messageOrOptions === 'string'
                ? { message: messageOrOptions, duration }
                : messageOrOptions;
        const container = document.createElement('div');
        const root = createRoot(container);
        const toast: PresentedToast = { root, setOpen: () => undefined };
        current.current = toast;
        const onDidDismiss: AppToastProps['onDidDismiss'] = event => {
            options.onDidDismiss?.(event);
            if (current.current === toast) current.current = null;
            // Unmount after AppToast finishes its own dismiss bookkeeping.
            setTimeout(() => root.unmount(), 0);
        };
        flushSync(() =>
            root.render(
                <ControlledToast
                    options={{ ...options, onDidDismiss }}
                    onRendered={setOpen => {
                        toast.setOpen = setOpen;
                    }}
                />
            )
        );
    }, []);

    const dismiss = useCallback(() => {
        const toast = current.current;
        current.current = null;
        toast?.setOpen(false);
    }, []);

    return [present, dismiss];
};

export default useAppToast;
