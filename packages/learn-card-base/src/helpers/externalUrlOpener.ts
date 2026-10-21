import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { setExternalUrlOpener } from '@learncard/react';

/**
 * Teach `@learncard/react` how to open external URLs inside the native shell.
 *
 * The SDK package has no native dependencies, so it falls back to `window.open`.
 * Inside Capacitor we want the in-app browser instead, which keeps the user in
 * the app rather than bouncing them out to Safari.
 *
 * Call once during app startup, before the React tree mounts.
 */
export const registerExternalUrlOpener = (): void => {
    if (!Capacitor?.isNativePlatform()) return;

    setExternalUrlOpener(async url => {
        await Browser.open({ url });
    });
};
