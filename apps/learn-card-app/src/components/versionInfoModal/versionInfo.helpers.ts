/**
 * Reusable version diagnostics (LC-2086 Task 4).
 *
 * Extracted verbatim from `VersionInfoModal.tsx` so the modal and the
 * feedback reporting flow share one collection path. The modal keeps using
 * the full `VersionInfo` object (including support-only fields like the
 * Capgo device id); privacy-sensitive consumers map it onto a narrower
 * subset themselves — see `feedback/reporting/collectFeedbackContext.ts`,
 * which never spreads this object.
 */

import { Capacitor } from '@capacitor/core';
import { App, type AppInfo } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Device, type DeviceInfo } from '@capacitor/device';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export type Platform = 'ios' | 'android' | 'web';

export interface NetworkSummary {
    connected: boolean;
    label: string;
}

/**
 * Shape returned by our `summarizeDevice()` helper — a thinned-down,
 * display-ready projection of `@capacitor/device`'s `DeviceInfo`. We
 * deliberately drop noisy or privacy-adjacent fields (`name`, `memUsed`,
 * `realDiskFree`, `realDiskTotal`) since they're rarely actionable for
 * support and add churn to screenshots.
 */
export interface DeviceSummary {
    /** Internal model identifier (e.g. `iPhone14,5`, `SM-S928U`). */
    model?: string;
    /** `Apple`, `samsung`, `Google`, etc. Raw vendor string from the OS. */
    manufacturer?: string;
    /** Pre-formatted OS string, e.g. `iOS 17.5.1` or `Android 14 (SDK 34)`. */
    osLabel?: string;
    /** WebKit (iOS) / Android System WebView version. Useful for rendering bugs. */
    webViewVersion?: string;
    /** True when running in a simulator / emulator. Only rendered when true. */
    isVirtual?: boolean;
}

export interface VersionInfo {
    platform: Platform;
    isNative: boolean;
    /** Resolved app version — Capgo bundle on native (if live-updated), else package.json. */
    displayVersion: string;
    /** Native binary version (from Info.plist / build.gradle). */
    nativeVersion?: string;
    /** Native build number (iOS CFBundleVersion, Android versionCode). */
    nativeBuild?: string;
    /** Native app bundle id (com.learncard.app, etc.). */
    bundleId?: string;
    /** Capgo OTA bundle version — 'builtin' if running the embedded bundle. */
    bundleVersion?: string;
    /** Capgo bundle ID (internal). */
    bundleInternalId?: string;
    /** Capgo bundle checksum (first chars only). */
    bundleChecksum?: string;
    /** Capgo channel currently assigned to this device. */
    channel?: string;
    /** Capgo-assigned device id (for support). */
    deviceId?: string;
    /** Version of the Capgo updater plugin. */
    pluginVersion?: string;
    /** Version of the JS bundle that shipped in the native binary. */
    builtinVersion?: string;
    /** ISO timestamp of when the current OTA bundle was downloaded. Empty for builtin. */
    lastUpdateApplied?: string;
    /** Connectivity summary (works on web + native). */
    network?: NetworkSummary;
    /** Hardware / OS summary (`@capacitor/device`). Native only. */
    device?: DeviceSummary;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
    ios: 'iOS',
    android: 'Android',
    web: 'Web',
};

/**
 * Anything older than this is almost certainly a sentinel — Capgo occasionally
 * returns epoch 0 / `1970-01-01T00:00:00.000Z` for bundles it hasn't actually
 * delivered OTA (e.g. the builtin bundle, or when the field isn't populated).
 * Treat those as "unset" rather than rendering "Last updated: 12/31/1969".
 */
const MIN_MEANINGFUL_TS = new Date('2020-01-01T00:00:00Z').getTime();

/**
 * Render an ISO timestamp as a friendly relative string ("3 hours ago").
 * Falls back to a locale date string for anything older than a week so the
 * exact day is still visible — useful in support screenshots.
 */
export const formatRelative = (iso: string | undefined): string | undefined => {
    if (!iso) return undefined;

    const ts = new Date(iso).getTime();

    if (Number.isNaN(ts) || ts < MIN_MEANINGFUL_TS) return undefined;

    const ms = Date.now() - ts;
    const sec = Math.floor(ms / 1000);

    if (sec < 60) return 'Just now';

    const min = Math.floor(sec / 60);

    if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;

    const hr = Math.floor(min / 60);

    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;

    const day = Math.floor(hr / 24);

    if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;

    return new Date(iso).toLocaleDateString();
};

export const formatNetwork = (
    status: { connected: boolean; connectionType: string } | null
): NetworkSummary | undefined => {
    if (!status) return undefined;

    if (!status.connected) return { connected: false, label: 'Offline' };

    switch (status.connectionType) {
        case 'wifi':
            return { connected: true, label: 'Wi-Fi · Connected' };
        case 'cellular':
            return { connected: true, label: 'Cellular · Connected' };
        case 'none':
            return { connected: false, label: 'Offline' };
        default:
            return { connected: true, label: 'Connected' };
    }
};

/**
 * Friendly capitalisation for the lowercase `operatingSystem` string returned
 * by `@capacitor/device`. Falls back to the raw value if we see something
 * unexpected — better to show support a slightly off-brand "windows" than to
 * drop the row entirely.
 */
const OS_LABELS: Record<string, string> = {
    ios: 'iOS',
    android: 'Android',
    mac: 'macOS',
    windows: 'Windows',
    unknown: 'Unknown',
};

/**
 * Distil `DeviceInfo` into the subset of fields we actually surface. Returns
 * `undefined` when no useful field is present (e.g. a web build where
 * `@capacitor/device` degrades to a no-op shim).
 */
export const summarizeDevice = (info: DeviceInfo | null): DeviceSummary | undefined => {
    if (!info) return undefined;

    const osName = OS_LABELS[info.operatingSystem] ?? info.operatingSystem;
    const osVersion = info.osVersion?.trim();

    // Android reports osVersion as a friendly "14" and also exposes the SDK
    // level separately — both are useful so we surface them together.
    let osLabel: string | undefined;

    if (osName && osVersion) {
        osLabel =
            info.operatingSystem === 'android' && info.androidSDKVersion
                ? `${osName} ${osVersion} (SDK ${info.androidSDKVersion})`
                : `${osName} ${osVersion}`;
    } else if (osName && osName !== 'Unknown') {
        osLabel = osName;
    }

    const webViewVersion = info.webViewVersion?.trim() || undefined;

    const summary: DeviceSummary = {
        model: info.model?.trim() || undefined,
        manufacturer: info.manufacturer?.trim() || undefined,
        osLabel,
        webViewVersion,
        isVirtual: info.isVirtual || undefined,
    };

    const hasAnyField = Object.values(summary).some(v => v !== undefined);

    return hasAnyField ? summary : undefined;
};

export const formatBuildDate = (iso: string | undefined): string | undefined => {
    if (!iso) return undefined;

    const ts = new Date(iso).getTime();

    if (Number.isNaN(ts)) return undefined;

    return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const collectVersionInfo = async (fallbackVersion: string): Promise<VersionInfo> => {
    const platform = Capacitor.getPlatform() as Platform;
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
        const networkStatus = await Network.getStatus().catch(() => null);

        return {
            platform,
            isNative,
            displayVersion: fallbackVersion,
            network: formatNetwork(networkStatus),
        };
    }

    // These bridge calls are independent. Start them together so opening a
    // diagnostics consumer waits for the slowest call, not the sum of every
    // native round trip. Each failure remains isolated from the others.
    const [
        networkStatus,
        appInfo,
        bundle,
        channelResult,
        deviceIdResult,
        pluginVersionResult,
        builtinResult,
        deviceInfo,
    ] = await Promise.all([
        Network.getStatus().catch(() => null),
        App.getInfo().catch((): AppInfo | null => null),
        CapacitorUpdater.current().catch(() => null),
        CapacitorUpdater.getChannel().catch(() => null),
        CapacitorUpdater.getDeviceId().catch(() => null),
        CapacitorUpdater.getPluginVersion().catch(() => null),
        CapacitorUpdater.getBuiltinVersion().catch(() => null),
        Device.getInfo().catch((): DeviceInfo | null => null),
    ]);
    const network = formatNetwork(networkStatus);

    const bundleVersion = bundle?.bundle?.version;
    const displayVersion =
        bundleVersion && bundleVersion !== 'builtin' && bundleVersion.trim() !== ''
            ? bundleVersion
            : appInfo?.version ?? fallbackVersion;

    // The current bundle's `downloaded` field is the timestamp the OTA bundle
    // was applied to this device. Capgo returns one of several "unset" values
    // when the bundle hasn't actually been delivered OTA (empty string, epoch
    // 0, or '1970-01-01T00:00:00.000Z'), so we also reject anything before the
    // MIN_MEANINGFUL_TS sentinel rather than rendering "12/31/1969".
    const downloaded = bundle?.bundle?.downloaded;
    const downloadedTs = downloaded ? new Date(downloaded).getTime() : NaN;
    const lastUpdateApplied =
        bundleVersion &&
        bundleVersion !== 'builtin' &&
        downloaded &&
        downloaded.trim() !== '' &&
        !Number.isNaN(downloadedTs) &&
        downloadedTs >= MIN_MEANINGFUL_TS
            ? downloaded
            : undefined;

    return {
        platform,
        isNative,
        displayVersion,
        nativeVersion: appInfo?.version,
        nativeBuild: appInfo?.build,
        bundleId: appInfo?.id,
        bundleVersion,
        bundleInternalId: bundle?.bundle?.id,
        bundleChecksum: bundle?.bundle?.checksum,
        channel: (channelResult as { channel?: string } | null)?.channel,
        deviceId: (deviceIdResult as { deviceId?: string } | null)?.deviceId,
        pluginVersion: (pluginVersionResult as { version?: string } | null)?.version,
        builtinVersion: (builtinResult as { version?: string } | null)?.version,
        lastUpdateApplied,
        network,
        device: summarizeDevice(deviceInfo),
    };
};
