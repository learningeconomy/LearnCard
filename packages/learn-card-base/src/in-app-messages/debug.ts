import { getLogger } from '../logging/logger';

const log = getLogger('in-app-messages');

const STORAGE_KEY = 'lcb-in-app-messages-debug';

let runtimeOverride: boolean | undefined;

const readPersistedSetting = (): boolean => {
    try {
        if (globalThis.localStorage?.getItem(STORAGE_KEY) === '1') return true;

        const search = globalThis.location?.search;

        if (search && new URLSearchParams(search).get('iamDebug') === '1') return true;
    } catch {
        return false;
    }

    return false;
};

export const isInAppMessagesDebug = (): boolean =>
    runtimeOverride !== undefined ? runtimeOverride : readPersistedSetting();

export const setInAppMessagesDebug = (enabled: boolean): void => {
    runtimeOverride = enabled;

    try {
        if (enabled) globalThis.localStorage?.setItem(STORAGE_KEY, '1');
        else globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
        runtimeOverride = enabled;
    }
};

export const iamDebug = (event: string, data?: unknown): void => {
    if (!isInAppMessagesDebug()) return;

    if (data !== undefined) log.info(`[in-app-messages] ${event}`, data as object);
    else log.info(`[in-app-messages] ${event}`);

    try {
        globalThis.console?.info(`[in-app-messages] ${event}`, data ?? '');
    } catch {
        return;
    }
};
