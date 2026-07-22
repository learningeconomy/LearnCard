import { Capacitor } from '@capacitor/core';

import type { AppStoreAction } from '@learncard/types';

export interface StoreLinkSources {
    platform: string;
    appStoreUrl?: string;
    playStoreUrl?: string;
}

export const resolveStoreUrl = (
    action: AppStoreAction,
    sources: StoreLinkSources
): string | null => {
    const { platform } = sources;

    if (platform === 'ios') return action.iosUrl ?? sources.appStoreUrl ?? null;
    if (platform === 'android') return action.androidUrl ?? sources.playStoreUrl ?? null;

    return action.webUrl ?? action.iosUrl ?? action.androidUrl ?? sources.appStoreUrl ?? null;
};

export const openStoreLink = async (
    action: AppStoreAction,
    sources: StoreLinkSources
): Promise<boolean> => {
    const url = resolveStoreUrl(action, sources);

    if (!url) return false;

    if (Capacitor.isNativePlatform()) {
        const { Browser } = await import('@capacitor/browser');

        await Browser.open({ url });

        return true;
    }

    globalThis.open?.(url, '_blank', 'noopener,noreferrer');

    return true;
};
