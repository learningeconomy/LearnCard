/**
 * VersionInfoModal
 *
 * A screenshot-friendly, non-scary "About this app" sheet.
 *
 * Purpose: when a user (or a member of the support team guiding them) taps
 * the version line in the side menu footer, they see a clear summary of
 * which version of the app they're running — friendly on the surface,
 * with enough diagnostic detail underneath an "Advanced" chevron to pin
 * down the exact native binary / OTA bundle / Capgo channel combo.
 *
 * Design intent:
 *   - Top-of-card: app icon, app name, friendly version. This is what the
 *     user sees at a glance and what shows up cleanly in a screenshot.
 *   - Middle: labeled key/value rows for the build. Plain language where
 *     we can use it ("App version", "Update channel"), technical terms only
 *     where they help support ("Content version" = Capgo bundle).
 *   - Primary action: "Copy details" — pastes a pre-formatted, support-ready
 *     block to the clipboard.
 *   - Advanced (collapsed by default): account, tenant, build commit, device
 *     ID, network, plus a "Check for updates" action and a flag-gated
 *     channel switcher.
 *
 * Gracefully degrades on web: fields that require the native
 * CapacitorUpdater plugin are hidden rather than rendered as "—".
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as m from '../../paraglide/messages.js';
import { IonIcon } from '@ionic/react';
import {
    chevronDownOutline,
    chevronUpOutline,
    checkmarkCircleOutline,
    cloudDownloadOutline,
    copyOutline,
    informationCircleOutline,
    radioButtonOnOutline,
    refreshOutline,
    swapHorizontalOutline,
    warningOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { App, type AppInfo } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { Network } from '@capacitor/network';
import { Device, type DeviceInfo } from '@capacitor/device';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    useBrandingConfig,
    useConfirmation,
    useGetCurrentLCNUser,
    useTenantConfig,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { useTenantBrandingAssets } from '../../config/brandingAssets';

type Platform = 'ios' | 'android' | 'web';

interface NetworkSummary {
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
interface DeviceSummary {
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

interface VersionInfo {
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

const PLATFORM_LABELS: Record<Platform, string> = {
    ios: 'iOS',
    android: 'Android',
    web: 'Web',
};

const STAGING_CHANNEL = 'staging';
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const PR_RE = /^pr-(\d+)$/;
const CHANNELS_CACHE_TTL_MS = 60_000;

/**
 * Module-level cache for `listChannels()`. Capgo rate-limits its backend, and
 * the version modal unmounts on close — without this, every open re-hits the
 * API and quickly trips the limit. Survives remounts; `force` bypasses the TTL
 * for the manual refresh button.
 */
let channelsCache: { data: { name: string }[]; at: number } | null = null;

const fetchChannelsCached = async (force = false): Promise<{ name: string }[]> => {
    const fresh = channelsCache && Date.now() - channelsCache.at < CHANNELS_CACHE_TTL_MS;

    if (!force && fresh) return channelsCache!.data;

    const result = await CapacitorUpdater.listChannels();
    const data = result.channels ?? [];

    channelsCache = { data, at: Date.now() };

    return data;
};

// The native Capgo plugin (iOS) can't decode the channel list when the backend
// returns numeric channel ids, surfacing as "could not be decoded" / "isn't in
// the correct format" (Cap-go/capacitor-updater#706). We detect this to offer
// manual channel entry instead of the (unavailable) list.
const isChannelsDecodeError = (raw: string): boolean =>
    /could not be decoded|isn't in the correct format|correct format/i.test(raw);

const friendlyChannelsError = (raw: string): string => {
    if (/rate.?limit/i.test(raw)) {
        return 'Channel list is temporarily rate-limited — showing known channels. Try again in a minute.';
    }

    if (isChannelsDecodeError(raw)) {
        return "Couldn't load the channel list on this device. You can still switch by entering a channel name below.";
    }

    if (/network|timeout|offline|failed to fetch/i.test(raw)) {
        return 'Connection issue loading channels — showing known channels. Check your internet and try again.';
    }

    return "Couldn't load the full channel list — showing known channels.";
};

type ChannelKind = 'production' | 'staging' | 'pr' | 'custom';

interface ChannelOption {
    value: string;
    label: string;
    description?: string;
    kind: ChannelKind;
}

interface GroupedChannels {
    productionLatest?: ChannelOption;
    productionOlder: ChannelOption[];
    staging?: ChannelOption;
    prPreviews: ChannelOption[];
}

const compareSemverDesc = (a: string, b: string): number => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);

    for (let i = 0; i < 3; i += 1) {
        if (pa[i] !== pb[i]) return pb[i] - pa[i];
    }

    return 0;
};

/**
 * Sort the self-assignable channels returned by `CapacitorUpdater.listChannels()`
 * into the four UI buckets. The production stream is semver-named (e.g. `1.0.7`),
 * so the channel matching the build-time `__CAPGO_DEFAULT_CHANNEL__` define is the
 * "Latest" production row; any other semver channels are older production versions
 * (newest first). `staging` and `pr-<n>` channels get their own sections.
 */
const groupChannels = (
    channels: { name: string }[],
    productionChannel: string | undefined
): GroupedChannels => {
    const productionOlder: ChannelOption[] = [];
    const prPreviews: ChannelOption[] = [];
    let productionLatest: ChannelOption | undefined;
    let staging: ChannelOption | undefined;

    const semverChannels = channels
        .map(c => c.name)
        .filter(name => SEMVER_RE.test(name))
        .sort(compareSemverDesc);

    for (const name of semverChannels) {
        if (name === productionChannel) {
            productionLatest = {
                value: name,
                label: 'Production (Latest)',
                description: `Released app store build (\`${name}\`)`,
                kind: 'production',
            };
        } else {
            productionOlder.push({
                value: name,
                label: name,
                description: 'Older production version',
                kind: 'production',
            });
        }
    }

    // If the device's production channel isn't in the self-settable list (e.g.
    // it's locked), still surface it as Latest so users can switch back to it.
    if (!productionLatest && productionChannel) {
        productionLatest = {
            value: productionChannel,
            label: 'Production (Latest)',
            description: `Released app store build (\`${productionChannel}\`)`,
            kind: 'production',
        };
    }

    for (const { name } of channels) {
        if (name === STAGING_CHANNEL) {
            staging = {
                value: name,
                label: 'Staging',
                description: 'Latest merged code on `main`',
                kind: 'staging',
            };
        }

        const prMatch = name.match(PR_RE);

        if (prMatch) {
            prPreviews.push({
                value: name,
                label: `Beta #${prMatch[1]}`,
                description: 'Open beta preview',
                kind: 'pr',
            });
        }
    }

    prPreviews.sort((a, b) => Number(b.value.slice(3)) - Number(a.value.slice(3)));

    return { productionLatest, productionOlder, staging, prPreviews };
};

const shorten = (value: string | undefined, head = 6, tail = 4): string => {
    if (!value) return '';
    if (value.length <= head + tail + 1) return value;

    return `${value.slice(0, head)}…${value.slice(-tail)}`;
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
const formatRelative = (iso: string | undefined): string | undefined => {
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

const formatNetwork = (
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
const summarizeDevice = (info: DeviceInfo | null): DeviceSummary | undefined => {
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

const formatBuildDate = (iso: string | undefined): string | undefined => {
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

const collectVersionInfo = async (fallbackVersion: string): Promise<VersionInfo> => {
    const platform = Capacitor.getPlatform() as Platform;
    const isNative = Capacitor.isNativePlatform();

    // Network status works on both web and native, so collect it unconditionally.
    const networkStatus = await Network.getStatus().catch(() => null);
    const network = formatNetwork(networkStatus);

    if (!isNative) {
        return {
            platform,
            isNative,
            displayVersion: fallbackVersion,
            network,
        };
    }

    // Each of these is wrapped individually so one failing plugin call
    // doesn't blank the whole modal.
    const appInfo = await App.getInfo().catch((): AppInfo | null => null);
    const bundle = await CapacitorUpdater.current().catch(() => null);
    const channelResult = await CapacitorUpdater.getChannel().catch(() => null);
    const deviceIdResult = await CapacitorUpdater.getDeviceId().catch(() => null);
    const pluginVersionResult = await CapacitorUpdater.getPluginVersion().catch(() => null);
    const builtinResult = await CapacitorUpdater.getBuiltinVersion().catch(() => null);
    const deviceInfo = await Device.getInfo().catch((): DeviceInfo | null => null);

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

interface CopyPayloadContext {
    appName: string;
    profileId?: string;
    tenantId?: string;
    buildSha?: string;
    buildDate?: string;
}

const buildCopyPayload = (info: VersionInfo, ctx: CopyPayloadContext): string => {
    const lines = [
        `${ctx.appName} — version details`,
        `Platform: ${PLATFORM_LABELS[info.platform]}`,
        `App version: ${info.displayVersion}`,
    ];

    if (info.nativeVersion)
        lines.push(`Native version: ${info.nativeVersion} (${info.nativeBuild ?? '—'})`);
    if (info.bundleVersion) lines.push(`Content version: ${info.bundleVersion}`);
    if (info.channel) lines.push(`Update channel: ${info.channel}`);
    if (info.lastUpdateApplied) lines.push(`Last updated: ${info.lastUpdateApplied}`);
    if (info.network) lines.push(`Network: ${info.network.label}`);
    if (ctx.profileId) lines.push(`Account: ${ctx.profileId}`);
    if (ctx.tenantId) lines.push(`Tenant: ${ctx.tenantId}`);
    if (info.device?.manufacturer || info.device?.model) {
        lines.push(
            `Device: ${[info.device?.manufacturer, info.device?.model].filter(Boolean).join(' ')}`
        );
    }
    if (info.device?.osLabel) lines.push(`OS: ${info.device.osLabel}`);
    if (info.device?.webViewVersion) lines.push(`WebView: ${info.device.webViewVersion}`);
    if (info.device?.isVirtual) lines.push(`Simulator: yes`);
    if (info.bundleId) lines.push(`Bundle id: ${info.bundleId}`);
    if (info.deviceId) lines.push(`Device id: ${info.deviceId}`);
    if (ctx.buildSha) lines.push(`Build commit: ${ctx.buildSha}`);
    if (ctx.buildDate) lines.push(`Build date: ${ctx.buildDate}`);
    if (info.pluginVersion) lines.push(`Updater plugin: v${info.pluginVersion}`);
    if (info.builtinVersion) lines.push(`Shipped bundle: ${info.builtinVersion}`);
    lines.push(`Captured: ${new Date().toISOString()}`);

    return lines.join('\n');
};

interface VersionInfoRowProps {
    label: string;
    value: string | undefined;
    copyValue?: string;
    onCopy?: (value: string, label: string) => void;
}

const VersionInfoRow: React.FC<VersionInfoRowProps> = ({ label, value, copyValue, onCopy }) => {
    if (!value) return null;

    const handleCopy = (): void => {
        if (onCopy) onCopy(copyValue ?? value, label);
    };

    return (
        <div className="flex items-start justify-between gap-3 py-2.5 border-b border-grayscale-100 last:border-b-0">
            <span className="text-xs font-medium text-grayscale-500 uppercase tracking-wide shrink-0 pt-0.5">
                {label}
            </span>

            <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-grayscale-900 font-medium text-right truncate">
                    {value}
                </span>

                {onCopy ? (
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label={`Copy ${label}`}
                        className="shrink-0 text-grayscale-400 hover:text-grayscale-700 transition-colors p-1 -mr-1"
                    >
                        <IonIcon icon={copyOutline} className="text-base" />
                    </button>
                ) : null}
            </div>
        </div>
    );
};

interface ChannelPickerSectionProps {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

const ChannelPickerSection: React.FC<ChannelPickerSectionProps> = ({ title, action, children }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                {title}
            </span>
            {action}
        </div>
        <div className="flex flex-col gap-1.5">{children}</div>
    </div>
);

interface ChannelRowProps {
    option: ChannelOption;
    currentChannel: string | undefined;
    pending: boolean;
    disabled: boolean;
    onClick: () => void;
}

const ChannelRow: React.FC<ChannelRowProps> = ({
    option,
    currentChannel,
    pending,
    disabled,
    onClick,
}) => {
    const isCurrent = currentChannel === option.value;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || isCurrent}
            aria-current={isCurrent ? 'true' : undefined}
            className={`w-full py-2.5 px-3 rounded-xl border text-left flex items-center gap-3 transition-colors disabled:cursor-not-allowed ${
                isCurrent
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-grayscale-200 bg-white hover:bg-grayscale-10 disabled:opacity-60'
            }`}
        >
            <IonIcon
                icon={radioButtonOnOutline}
                className={`text-base shrink-0 ${
                    isCurrent ? 'text-emerald-500' : 'text-grayscale-300'
                }`}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-grayscale-900 truncate">
                        {option.label}
                    </span>
                    {isCurrent ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5">
                            Current
                        </span>
                    ) : null}
                </div>
                <div className="text-xs text-grayscale-500 truncate">
                    {option.description ?? option.value}
                </div>
            </div>
            {pending ? (
                <span className="shrink-0 w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
            ) : null}
        </button>
    );
};

interface VersionInfoModalProps {
    /** The version string currently rendered in the footer — used as a fallback on web. */
    fallbackVersion: string;
}

const VersionInfoModal: React.FC<VersionInfoModalProps> = ({ fallbackVersion }) => {
    const brandingConfig = useBrandingConfig();
    const { appIcon } = useTenantBrandingAssets();
    const { presentToast } = useToast();
    const tenantConfig = useTenantConfig();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const flags = useFlags();
    const confirm = useConfirmation();

    const [info, setInfo] = useState<VersionInfo | null>(null);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [checkingForUpdate, setCheckingForUpdate] = useState(false);
    const [showChannelPicker, setShowChannelPicker] = useState(false);
    const [switchingChannel, setSwitchingChannel] = useState<string | null>(null);
    const [channels, setChannels] = useState<{ name: string }[] | null>(null);
    const [channelsLoading, setChannelsLoading] = useState(false);
    const [channelsError, setChannelsError] = useState<string | null>(null);
    const [channelsDecodeFailed, setChannelsDecodeFailed] = useState(false);
    const [manualChannel, setManualChannel] = useState('');

    const appName = brandingConfig?.name ?? 'App';
    const tenantId = tenantConfig?.tenantId;
    const profileId = currentLCNUser?.profileId;
    const buildSha = typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : undefined;
    const buildDateRaw = typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : undefined;
    const buildDate = formatBuildDate(buildDateRaw);
    const channelSwitcherEnabled = Boolean(flags?.enableChannelSwitcher);
    const productionChannel =
        typeof __CAPGO_DEFAULT_CHANNEL__ === 'string' && __CAPGO_DEFAULT_CHANNEL__.trim() !== ''
            ? __CAPGO_DEFAULT_CHANNEL__
            : undefined;
    const grouped = useMemo(
        () => groupChannels(channels ?? [], productionChannel),
        [channels, productionChannel]
    );

    const refreshInfo = async (): Promise<void> => {
        const next = await collectVersionInfo(fallbackVersion);

        setInfo(next);
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const next = await collectVersionInfo(fallbackVersion);

            if (!cancelled) setInfo(next);
        })();

        return () => {
            cancelled = true;
        };
    }, [fallbackVersion]);

    const copyPayload = useMemo(
        () =>
            info
                ? buildCopyPayload(info, {
                      appName,
                      profileId,
                      tenantId,
                      buildSha,
                      buildDate: buildDateRaw,
                  })
                : '',
        [info, appName, profileId, tenantId, buildSha, buildDateRaw]
    );

    const copyString = async (value: string, label: string): Promise<void> => {
        try {
            await Clipboard.write({ string: value });

            presentToast(`${label} copied`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch {
            presentToast('Could not copy to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleCopyAll = async (): Promise<void> => {
        if (!copyPayload) return;

        try {
            await Clipboard.write({ string: copyPayload });
            setCopyState('copied');
            window.setTimeout(() => setCopyState('idle'), 2000);
        } catch {
            presentToast('Could not copy to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    /**
     * Manually ask Capgo whether a newer bundle is available on the assigned
     * channel. Capgo's `getLatest()` throws a non-error "No new version available"
     * when the device is already up to date — we catch that specifically and
     * surface a friendly success toast.
     */
    const handleCheckForUpdates = async (): Promise<void> => {
        if (!Capacitor.isNativePlatform()) {
            presentToast('Update checks only run on the installed app.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }

        setCheckingForUpdate(true);

        try {
            const latest = await CapacitorUpdater.getLatest();
            const version = (latest as { version?: string } | null)?.version;

            presentToast(
                version
                    ? `Update available: v${version}. It will install next time you reopen the app.`
                    : `An update is available. It will install next time you reopen the app.`,
                { type: ToastTypeEnum.Success, hasDismissButton: true }
            );
        } catch (err) {
            const msg = (err as { message?: string } | null)?.message ?? '';
            const upToDate =
                msg.includes('No new version') ||
                msg.includes('no_new_version_available') ||
                msg.includes('Already up to date');

            if (upToDate) {
                presentToast(`You're on the latest version.`, {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });
            } else {
                presentToast(`Couldn't check for updates${msg ? `: ${msg}` : '.'}`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        } finally {
            setCheckingForUpdate(false);
        }
    };

    const loadChannels = useCallback(async (force = false): Promise<void> => {
        setChannelsLoading(true);
        setChannelsError(null);
        setChannelsDecodeFailed(false);

        try {
            setChannels(await fetchChannelsCached(force));
        } catch (err) {
            const msg = (err as { message?: string } | null)?.message ?? 'unknown error';

            // Degrade gracefully: keep whatever we already have (cache or prior
            // state) so Production/Staging from the build-time define still show.
            setChannels(prev => prev ?? channelsCache?.data ?? []);
            setChannelsError(friendlyChannelsError(msg));
            setChannelsDecodeFailed(isChannelsDecodeError(msg));
        } finally {
            setChannelsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!showChannelPicker || channels !== null || channelsLoading) return;

        void loadChannels();
    }, [showChannelPicker, channels, channelsLoading, loadChannels]);

    /**
     * Switch the device to a different Capgo channel.
     *
     * Friction layers (deliberately kept — switching to a channel whose bundle
     * targets a different native binary will break the app on next reload):
     *   1. The whole switcher is hidden unless `enableChannelSwitcher` is on in
     *      LaunchDarkly.
     *   2. Every switch goes through an explicit confirmation dialog.
     */
    const handleSwitchChannel = async (next: string): Promise<void> => {
        const target = next.trim();

        if (!target || !info) return;

        if (target === info.channel) {
            presentToast(`Already on channel ${target}.`, { hasDismissButton: true });
            return;
        }

        const ok = await confirm({
            title: 'Switch update channel?',
            text: (
                <span className="text-sm text-grayscale-700 leading-relaxed">
                    This will switch your device to channel{' '}
                    <strong className="text-grayscale-900">{target}</strong>. The app will start
                    receiving updates from that channel and may download a different version of the
                    content. Only do this if support has asked you to.
                </span>
            ),
            confirmText: `Switch to ${target}`,
            cancelText: 'Cancel',
        });

        if (!ok) return;

        setSwitchingChannel(target);

        try {
            await CapacitorUpdater.setChannel({ channel: target, triggerAutoUpdate: true });

            presentToast(`Switched to channel ${target}. Updates will apply on next reload.`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            setShowChannelPicker(false);
            setManualChannel('');
            await refreshInfo();
        } catch (err) {
            const msg = (err as { message?: string } | null)?.message ?? 'unknown error';

            presentToast(`Couldn't switch channel: ${msg}`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setSwitchingChannel(null);
        }
    };

    if (!info) {
        return (
            <div className="font-poppins py-10 px-8 flex flex-col items-center gap-3">
                <span className="w-6 h-6 border-2 border-grayscale-200 border-t-grayscale-700 rounded-full animate-spin" />
                <span className="text-sm text-grayscale-500">{m['versionInfo.gathering']()}</span>
            </div>
        );
    }

    const platformLabel = PLATFORM_LABELS[info.platform];

    return (
        <div
            className="font-poppins px-6 pb-5 flex flex-col items-center w-full max-w-[400px] mx-auto"
            style={{
                // Match the app-wide pattern (AppStoreDetailModal, ShareCredentialModal
                // etc.): respect the iOS notch/dynamic-island inset when the modal is
                // rendered as a fullscreen cancel sheet, fall back to 1.5rem elsewhere.
                paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
            }}
        >
            {/* ---- Hero ---------------------------------------------------------- */}
            <img
                src={appIcon}
                alt={`${appName} icon`}
                className="h-[56px] w-[56px] rounded-[14px] shadow-sm"
            />

            <h2 className="mt-4 text-lg font-semibold text-grayscale-900 text-center">{appName}</h2>

            <p className="mt-1 text-sm text-grayscale-500 text-center">
                {m['versionInfo.version']()}{' '}
                <span className="font-medium text-grayscale-700">{info.displayVersion}</span>
                <span className="mx-1.5 text-grayscale-300">·</span>
                {platformLabel}
            </p>

            {/* ---- Friendly reassurance ------------------------------------------ */}
            <div className="mt-4 w-full flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl py-2.5 px-3">
                <IonIcon
                    icon={informationCircleOutline}
                    className="text-emerald-500 text-base mt-0.5 shrink-0"
                />
                <p className="text-xs text-emerald-900 leading-relaxed">
                    {m['versionInfo.supportBlurb']()}
                </p>
            </div>

            {/* ---- Core info list ------------------------------------------------ */}
            <div className="mt-4 w-full bg-white border border-grayscale-200 rounded-2xl px-4 py-1">
                <VersionInfoRow label={m['versionInfo.platform']()} value={platformLabel} />
                <VersionInfoRow
                    label={m['versionInfo.appVersion']()}
                    value={info.displayVersion}
                    onCopy={copyString}
                />
                {info.nativeVersion ? (
                    <VersionInfoRow
                        label={m['versionInfo.nativeVersion']()}
                        value={
                            info.nativeBuild
                                ? `${info.nativeVersion} (${info.nativeBuild})`
                                : info.nativeVersion
                        }
                        copyValue={
                            info.nativeBuild
                                ? `${info.nativeVersion} (${info.nativeBuild})`
                                : info.nativeVersion
                        }
                        onCopy={copyString}
                    />
                ) : null}
                {info.bundleVersion ? (
                    <VersionInfoRow
                        label={m['versionInfo.contentVersion']()}
                        value={info.bundleVersion}
                        onCopy={copyString}
                    />
                ) : null}
                {info.channel ? (
                    <VersionInfoRow
                        label={m['versionInfo.updateChannel']()}
                        value={info.channel}
                        onCopy={copyString}
                    />
                ) : null}
                {info.lastUpdateApplied ? (
                    <VersionInfoRow
                        label={m['versionInfo.lastUpdated']()}
                        value={formatRelative(info.lastUpdateApplied)}
                        copyValue={info.lastUpdateApplied}
                        onCopy={copyString}
                    />
                ) : null}
            </div>

            {/* ---- Primary action ------------------------------------------------ */}
            <button
                type="button"
                onClick={handleCopyAll}
                className="mt-5 w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
                {copyState === 'copied' ? (
                    <>
                        <IonIcon icon={checkmarkCircleOutline} className="text-base" />
                        {m['versionInfo.copiedToClipboard']()}
                    </>
                ) : (
                    <>
                        <IonIcon icon={copyOutline} className="text-base" />
                        {m['versionInfo.copyDetails']()}
                    </>
                )}
            </button>

            {/* ---- Advanced (collapsible) ----------------------------------------
             * Always rendered (even on web): some fields like `network`, `tenant`,
             * `account`, and the build commit make sense in every environment.
             */}
            <div className="mt-4 w-full">
                <button
                    type="button"
                    onClick={() => setAdvancedOpen(o => !o)}
                    aria-expanded={advancedOpen}
                    className="w-full flex items-center justify-between py-2 px-1 text-xs font-medium text-grayscale-500 hover:text-grayscale-700 transition-colors"
                >
                    <span className="uppercase tracking-wide">{m['versionInfo.advanced']()}</span>
                    <IonIcon
                        icon={advancedOpen ? chevronUpOutline : chevronDownOutline}
                        className="text-base"
                    />
                </button>

                {advancedOpen ? (
                    <div className="mt-1 w-full flex flex-col gap-3">
                        <div className="w-full bg-grayscale-10 border border-grayscale-200 rounded-2xl px-4 py-1">
                            {profileId ? (
                                <VersionInfoRow
                                    label="Account"
                                    value={shorten(profileId, 8, 6)}
                                    copyValue={profileId}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {tenantId ? (
                                <VersionInfoRow
                                    label="Tenant"
                                    value={tenantId}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.device?.model || info.device?.manufacturer ? (
                                <VersionInfoRow
                                    label="Device"
                                    value={[info.device?.manufacturer, info.device?.model]
                                        .filter(Boolean)
                                        .join(' ')}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.device?.osLabel ? (
                                <VersionInfoRow
                                    label="OS"
                                    value={info.device.osLabel}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.device?.webViewVersion ? (
                                <VersionInfoRow
                                    label="WebView"
                                    value={info.device.webViewVersion}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.device?.isVirtual ? (
                                <VersionInfoRow label="Simulator" value="Yes" />
                            ) : null}
                            {info.bundleId ? (
                                <VersionInfoRow
                                    label="Bundle ID"
                                    value={info.bundleId}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.deviceId ? (
                                <VersionInfoRow
                                    label="Device ID"
                                    value={shorten(info.deviceId)}
                                    copyValue={info.deviceId}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.network ? (
                                <VersionInfoRow label="Network" value={info.network.label} />
                            ) : null}
                            {buildSha ? (
                                <VersionInfoRow
                                    label="Build commit"
                                    value={buildSha}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {buildDate ? (
                                <VersionInfoRow
                                    label="Build date"
                                    value={buildDate}
                                    copyValue={buildDateRaw}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.builtinVersion ? (
                                <VersionInfoRow
                                    label="Shipped bundle"
                                    value={info.builtinVersion}
                                />
                            ) : null}
                            {info.bundleInternalId ? (
                                <VersionInfoRow label="Bundle ref" value={info.bundleInternalId} />
                            ) : null}
                            {info.bundleChecksum ? (
                                <VersionInfoRow
                                    label="Checksum"
                                    value={shorten(info.bundleChecksum, 8, 4)}
                                    copyValue={info.bundleChecksum}
                                    onCopy={copyString}
                                />
                            ) : null}
                            {info.pluginVersion ? (
                                <VersionInfoRow
                                    label="Updater plugin"
                                    value={`v${info.pluginVersion}`}
                                />
                            ) : null}
                        </div>

                        {/* ---- Check-for-updates action ------------------------- */}
                        {info.isNative ? (
                            <button
                                type="button"
                                onClick={handleCheckForUpdates}
                                disabled={checkingForUpdate}
                                className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {checkingForUpdate ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                                        {m['versionInfo.checking']()}
                                    </>
                                ) : (
                                    <>
                                        <IonIcon
                                            icon={cloudDownloadOutline}
                                            className="text-base"
                                        />
                                        {m['versionInfo.checkForUpdates']()}
                                    </>
                                )}
                            </button>
                        ) : null}

                        {channelSwitcherEnabled && info.isNative ? (
                            !showChannelPicker ? (
                                <button
                                    type="button"
                                    onClick={() => setShowChannelPicker(true)}
                                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <IonIcon icon={swapHorizontalOutline} className="text-base" />
                                    Switch update channel…
                                </button>
                            ) : (
                                <div className="w-full bg-white border border-grayscale-200 rounded-2xl p-3 flex flex-col gap-3">
                                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                                        <IonIcon
                                            icon={warningOutline}
                                            className="text-amber-600 text-base mt-0.5 shrink-0"
                                        />
                                        <p className="text-xs text-amber-900 leading-relaxed">
                                            Switching channels can download content that&rsquo;s
                                            incompatible with your installed app. Only continue if
                                            you know what you&rsquo;re doing.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-end -mb-1">
                                        <button
                                            type="button"
                                            onClick={() => void loadChannels(true)}
                                            disabled={channelsLoading}
                                            aria-label="Refresh channels"
                                            className="text-grayscale-400 hover:text-grayscale-700 transition-colors p-1"
                                        >
                                            <IonIcon
                                                icon={refreshOutline}
                                                className={`text-base ${
                                                    channelsLoading ? 'animate-spin' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {channelsLoading && channels === null ? (
                                        <div className="text-xs text-grayscale-500 py-2 px-1">
                                            Loading channels…
                                        </div>
                                    ) : (
                                        <>
                                            {channelsError ? (
                                                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl py-2 px-2.5">
                                                    {channelsError}
                                                </div>
                                            ) : null}

                                            {channelsDecodeFailed ? (
                                                <ChannelPickerSection title="Enter channel manually">
                                                    <div className="flex flex-col gap-2 px-1 py-1">
                                                        <input
                                                            type="text"
                                                            value={manualChannel}
                                                            onChange={e =>
                                                                setManualChannel(e.target.value)
                                                            }
                                                            placeholder="e.g. staging or pr-123"
                                                            autoCapitalize="none"
                                                            autoCorrect="off"
                                                            spellCheck={false}
                                                            disabled={switchingChannel !== null}
                                                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white disabled:opacity-50"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSwitchChannel(manualChannel)
                                                            }
                                                            disabled={
                                                                switchingChannel !== null ||
                                                                manualChannel.trim() === ''
                                                            }
                                                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            {switchingChannel !== null ? (
                                                                <span className="flex items-center justify-center gap-2">
                                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    Switching…
                                                                </span>
                                                            ) : (
                                                                'Switch to this channel'
                                                            )}
                                                        </button>
                                                    </div>
                                                </ChannelPickerSection>
                                            ) : null}

                                            {grouped.productionLatest ? (
                                                <ChannelPickerSection title="Production">
                                                    <ChannelRow
                                                        option={grouped.productionLatest}
                                                        currentChannel={info.channel}
                                                        pending={
                                                            switchingChannel ===
                                                            grouped.productionLatest.value
                                                        }
                                                        disabled={switchingChannel !== null}
                                                        onClick={() =>
                                                            handleSwitchChannel(
                                                                grouped.productionLatest!.value
                                                            )
                                                        }
                                                    />
                                                </ChannelPickerSection>
                                            ) : null}

                                            {grouped.productionOlder.length > 0 ? (
                                                <ChannelPickerSection title="Other production versions">
                                                    {grouped.productionOlder.map(opt => (
                                                        <ChannelRow
                                                            key={opt.value}
                                                            option={opt}
                                                            currentChannel={info.channel}
                                                            pending={switchingChannel === opt.value}
                                                            disabled={switchingChannel !== null}
                                                            onClick={() =>
                                                                handleSwitchChannel(opt.value)
                                                            }
                                                        />
                                                    ))}
                                                </ChannelPickerSection>
                                            ) : null}

                                            {grouped.staging ? (
                                                <ChannelPickerSection title="Staging">
                                                    <ChannelRow
                                                        option={grouped.staging}
                                                        currentChannel={info.channel}
                                                        pending={
                                                            switchingChannel ===
                                                            grouped.staging.value
                                                        }
                                                        disabled={switchingChannel !== null}
                                                        onClick={() =>
                                                            handleSwitchChannel(
                                                                grouped.staging!.value
                                                            )
                                                        }
                                                    />
                                                </ChannelPickerSection>
                                            ) : null}

                                            <ChannelPickerSection title="Beta Releases">
                                                {grouped.prPreviews.length === 0 ? (
                                                    <div className="text-xs text-grayscale-500 py-2 px-1">
                                                        No open beta releases have a preview right
                                                        now.
                                                    </div>
                                                ) : (
                                                    grouped.prPreviews.map(opt => (
                                                        <ChannelRow
                                                            key={opt.value}
                                                            option={opt}
                                                            currentChannel={info.channel}
                                                            pending={switchingChannel === opt.value}
                                                            disabled={switchingChannel !== null}
                                                            onClick={() =>
                                                                handleSwitchChannel(opt.value)
                                                            }
                                                        />
                                                    ))
                                                )}
                                            </ChannelPickerSection>
                                        </>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowChannelPicker(false);
                                            setManualChannel('');
                                        }}
                                        className="w-full py-2.5 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default VersionInfoModal;
