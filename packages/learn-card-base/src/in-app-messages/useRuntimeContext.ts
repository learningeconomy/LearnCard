import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import type { InAppMessagePlatform } from '@learncard/types';

import { getLogger } from '../logging/logger';
import { useGetCurrentUserRole } from '../hooks/useGetCurrentUserRole';
import type { InAppMessageRuntimeContext } from './predicates';

const log = getLogger('in-app-messages');

declare const __APP_VERSION__: string | undefined;

const getWebVersion = (): string | undefined => {
    try {
        return typeof __APP_VERSION__ === 'string' && __APP_VERSION__ ? __APP_VERSION__ : undefined;
    } catch {
        return undefined;
    }
};

const collectNativeVersions = async (): Promise<{ native?: string; capgo?: string }> => {
    const versions: { native?: string; capgo?: string } = {};

    try {
        const { App } = await import('@capacitor/app');
        const info = await App.getInfo();

        versions.native = info?.version;
    } catch (err) {
        log.debug('in-app-messages: App.getInfo failed', err);
    }

    try {
        const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
        const current = await CapacitorUpdater.current();
        const version = current?.bundle?.version;

        if (version && version !== 'builtin') versions.capgo = version;
    } catch (err) {
        log.debug('in-app-messages: CapacitorUpdater.current failed', err);
    }

    return versions;
};

export const useInAppMessageRuntimeContext = (): {
    context: InAppMessageRuntimeContext | null;
    ready: boolean;
} => {
    const role = useGetCurrentUserRole();
    const [versions, setVersions] = useState<InAppMessageRuntimeContext['versions'] | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const isNative = Capacitor.isNativePlatform();
            const next: InAppMessageRuntimeContext['versions'] = { web: getWebVersion() };

            if (isNative) Object.assign(next, await collectNativeVersions());

            if (!cancelled) setVersions(next);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (versions === null) return { context: null, ready: false };

    const context: InAppMessageRuntimeContext = {
        platform: Capacitor.getPlatform() as InAppMessagePlatform,
        role,
        versions,
    };

    return { context, ready: true };
};
