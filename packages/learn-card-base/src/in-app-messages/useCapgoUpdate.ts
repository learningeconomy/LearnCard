import { useCallback, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { getLogger } from '../logging/logger';
import { iamDebug } from './debug';

const log = getLogger('in-app-messages-capgo');

export type CapgoUpdateStatus =
    | 'idle'
    | 'checking'
    | 'downloading'
    | 'applying'
    | 'uptodate'
    | 'error';

export interface CapgoUpdateState {
    status: CapgoUpdateStatus;
    progress: number;
    latestVersion: string | null;
    error: string | null;
}

const isUpToDateError = (message: string): boolean =>
    message.includes('No new version') ||
    message.includes('no_new_version_available') ||
    message.includes('Already up to date');

const INITIAL: CapgoUpdateState = {
    status: 'idle',
    progress: 0,
    latestVersion: null,
    error: null,
};

export const useCapgoUpdate = (): CapgoUpdateState & { startUpdate: () => Promise<void> } => {
    const [state, setState] = useState<CapgoUpdateState>(INITIAL);
    const runningRef = useRef(false);

    const startUpdate = useCallback(async () => {
        if (runningRef.current) return;

        if (!Capacitor.isNativePlatform()) {
            setState({ ...INITIAL, status: 'uptodate' });

            return;
        }

        runningRef.current = true;
        iamDebug('capgo:checking');
        setState({ ...INITIAL, status: 'checking' });

        let removeProgress: (() => void) | undefined;

        try {
            const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

            const latest = await CapacitorUpdater.getLatest();
            const version = (latest as { version?: string; url?: string }).version;
            const url = (latest as { version?: string; url?: string }).url;

            if (!version || !url) {
                iamDebug('capgo:uptodate');
                setState({ ...INITIAL, status: 'uptodate' });

                return;
            }

            iamDebug('capgo:downloading', { version });
            setState(s => ({ ...s, status: 'downloading', latestVersion: version, progress: 0 }));

            const handle = await CapacitorUpdater.addListener(
                'download',
                (event: { percent?: number }) => {
                    setState(s => ({
                        ...s,
                        progress: Math.max(0, Math.min(100, event.percent ?? 0)),
                    }));
                }
            );

            removeProgress = () => {
                void handle.remove();
            };

            const bundle = await CapacitorUpdater.download({ version, url });

            iamDebug('capgo:applying', { version });
            setState(s => ({ ...s, status: 'applying', progress: 100 }));

            // Deliberately no terminal "success" state after set(): applying
            // the bundle reloads the webview and tears down this JS context,
            // so the "Installing..." UI is the last frame the user sees. If a
            // non-reloading update path is ever introduced, this needs a
            // success state or the spinner will hang forever.
            await CapacitorUpdater.set({ id: bundle.id });
        } catch (err) {
            const message = (err as { message?: string })?.message ?? '';

            if (isUpToDateError(message)) {
                setState({ ...INITIAL, status: 'uptodate' });
            } else {
                log.warn('capgo update failed', err);
                iamDebug('capgo:error', { message });
                setState(s => ({ ...s, status: 'error', error: message || 'Update failed' }));
            }
        } finally {
            removeProgress?.();
            runningRef.current = false;
        }
    }, []);

    return { ...state, startUpdate };
};
