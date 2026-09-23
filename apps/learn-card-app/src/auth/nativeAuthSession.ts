import { App } from '@capacitor/app';
import type { URLOpenListenerEvent } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AuthSessionError } from '@learncard/types';
import { getLogger } from 'learn-card-base';

const log = getLogger('native-auth-session');

/** Android/fallback: the user may be reading a Keycloak error page inside Custom Tabs. */
const OVERALL_TIMEOUT_MS = 5 * 60 * 1000;
/** iOS: every native hop is a silent ticket redeem (~1-2 s); anything longer is a stuck sheet. */
const WEB_AUTH_SESSION_TIMEOUT_MS = 60 * 1000;
/** Grace window after the browser closes before treating it as a cancellation. */
const BROWSER_FINISHED_GRACE_MS = 750;

export interface WebAuthSessionStartOptions {
    url: string;
    callbackScheme: string;
    ephemeral?: boolean;
}

export interface WebAuthSessionResult {
    url: string;
}

/** Native counterpart of the iOS `WebAuthSessionPlugin.swift` local plugin. */
export interface WebAuthSessionPlugin {
    start(options: WebAuthSessionStartOptions): Promise<WebAuthSessionResult>;
    cancel(): Promise<void>;
}

export interface OpenNativeAuthSessionOptions {
    /** The full callback URL must start with this (typically the redirect URI). */
    callbackUrlPrefix: string;
    /** Custom scheme the OS routes the callback URL to (the tenant bundle ID). */
    callbackScheme: string;
}

const WebAuthSession = registerPlugin<WebAuthSessionPlugin>('WebAuthSession');

const getErrorCode = (error: unknown): string | undefined =>
    (error as { code?: string } | undefined)?.code;

const openViaWebAuthSession = async (
    plugin: WebAuthSessionPlugin,
    url: string,
    callbackScheme: string
): Promise<string> => {
    let timedOut = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    // ASWebAuthenticationSession can return true from start() yet never present
    // or call back; without a watchdog the sign-in form would spin forever.
    const expiry = new Promise<never>((_, reject) => {
        watchdog = setTimeout(() => {
            timedOut = true;
            plugin.cancel().catch(error => log.debug('Failed to cancel auth sheet', error));
            reject(new AuthSessionError('Sign-in expired. Please try again.', 'expired'));
        }, WEB_AUTH_SESSION_TIMEOUT_MS);
    });

    try {
        const result = await Promise.race([
            plugin.start({ url, callbackScheme, ephemeral: true }),
            expiry,
        ]);
        return result.url;
    } catch (error) {
        if (timedOut) {
            throw new AuthSessionError('Sign-in expired. Please try again.', 'expired');
        }
        if (getErrorCode(error) === 'CANCELED') {
            throw new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session');
        }
        throw error;
    } finally {
        if (watchdog !== undefined) clearTimeout(watchdog);
    }
};

/** Android (and the iOS fallback): Custom Tabs / SFSafariViewController + a deep-link listener. */
const openViaSystemBrowser = async (
    url: string,
    { callbackUrlPrefix }: OpenNativeAuthSessionOptions
): Promise<string> => {
    let urlListener: PluginListenerHandle | undefined;
    let finishedListener: PluginListenerHandle | undefined;
    let overallTimer: ReturnType<typeof setTimeout> | undefined;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;

    const result = new Promise<string>((resolve, reject) => {
        overallTimer = setTimeout(() => {
            reject(new AuthSessionError('Sign-in expired. Please try again.', 'expired'));
        }, OVERALL_TIMEOUT_MS);

        const setup = async (): Promise<void> => {
            // Listener must be live before the browser opens: the redirect can
            // return before this function would otherwise finish awaiting setup.
            urlListener = await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
                if (event.url.startsWith(callbackUrlPrefix)) resolve(event.url);
            });
            finishedListener = await Browser.addListener('browserFinished', () => {
                graceTimer = setTimeout(() => {
                    reject(
                        new AuthSessionError('Sign-in cancelled. Please try again.', 'no_session')
                    );
                }, BROWSER_FINISHED_GRACE_MS);
            });
            await Browser.open({ url });
        };

        setup().catch(reject);
    });

    try {
        return await result;
    } finally {
        if (overallTimer !== undefined) clearTimeout(overallTimer);
        if (graceTimer !== undefined) clearTimeout(graceTimer);
        try {
            await urlListener?.remove();
        } catch (error) {
            log.debug('Failed to remove appUrlOpen listener', error);
        }
        try {
            await finishedListener?.remove();
        } catch (error) {
            log.debug('Failed to remove browserFinished listener', error);
        }
        try {
            await Browser.close();
        } catch (error) {
            log.debug('Failed to close in-app browser', error);
        }
    }
};

/**
 * Open `url` in a system auth sheet and resolve with the full callback URL.
 * iOS uses the local `WebAuthSession` plugin (`ASWebAuthenticationSession`)
 * when available; Android, and iOS without the plugin, fall back to
 * `@capacitor/browser` + an `appUrlOpen` listener.
 */
export const openNativeAuthSession = async (
    url: string,
    options: OpenNativeAuthSessionOptions
): Promise<string> => {
    if (Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('WebAuthSession')) {
        return openViaWebAuthSession(WebAuthSession, url, options.callbackScheme);
    }
    return openViaSystemBrowser(url, options);
};
