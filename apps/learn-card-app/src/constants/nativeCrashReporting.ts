import { Capacitor, registerPlugin } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import {
    isSharePrivateSession,
    subscribeSharePrivacy,
} from '../components/share-links/sharePrivacy';

interface NativeCrashReportingPlugin {
    configure(options: {
        enabled?: boolean;
        privateSession?: boolean;
        tags?: Record<string, string>;
    }): Promise<{ enabled: boolean }>;
}

const native = registerPlugin<NativeCrashReportingPlugin>('NativeCrashReporting');
let reportingEnabled = true;
let revision = 0;
let queue: Promise<unknown> = Promise.resolve();
const hasNativeReporter = (): boolean =>
    Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('NativeCrashReporting');

/** Gate autocaptured JS events too; the logger has its own matching preference gate. */
export const canSendCrashReport = (): boolean => reportingEnabled && !isSharePrivateSession();

const configure = (options: Parameters<NativeCrashReportingPlugin['configure']>[0]) => {
    if (!hasNativeReporter()) return Promise.resolve();
    const requestedRevision = revision;
    // Serialize opt-out, private-view entry, and metadata updates so a late
    // initialization response cannot re-enable reporting after an opt-out.
    const result = queue.then(async () => {
        const state = await native.configure({
            ...options,
            privateSession: isSharePrivateSession(),
        });
        if (requestedRevision === revision) reportingEnabled = state.enabled;
    });
    queue = result.catch(() => {
        reportingEnabled = false;
    });
    return queue;
};

/** Native SDKs start before JS, using baked tenant config and native preferences. */
export const initializeNativeCrashReporting = async (): Promise<void> => {
    subscribeSharePrivacy(() => {
        revision++;
        reportingEnabled = false;
        void configure({});
    });
    // Do not overwrite a persisted opt-out while auth/preferences are unresolved.
    await configure({ tags: { web_version: __PACKAGE_VERSION__, web_sha: __BUILD_SHA__ } });
    if (hasNativeReporter()) {
        void CapacitorUpdater.current()
            .then(({ bundle }) => configure({ tags: { ota_bundle: bundle.version } }))
            .catch(() => undefined);
    }
};

export const setCrashReportingEnabled = (enabled: boolean): void => {
    revision++;
    reportingEnabled = enabled && !hasNativeReporter();
    void configure({ enabled });
};

// Only route families; never paths containing IDs, query strings, or share fragments.
export const updateCrashReportingRoute = (pathname: string): void => {
    const group = pathname.split('/')[1] || 'home';
    const allowed = new Set([
        'home',
        'learninghistory',
        'wallet',
        'profile',
        'settings',
        'pathways',
        'notifications',
    ]);
    void configure({ tags: { route_group: allowed.has(group) ? group : 'other' } });
};
