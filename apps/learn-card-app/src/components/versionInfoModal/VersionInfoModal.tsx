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

import React, { useEffect, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    chevronDownOutline,
    chevronUpOutline,
    checkmarkCircleOutline,
    cloudDownloadOutline,
    copyOutline,
    informationCircleOutline,
    swapHorizontalOutline,
    warningOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { App, type AppInfo } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { Network } from '@capacitor/network';
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
}

const PLATFORM_LABELS: Record<Platform, string> = {
    ios: 'iOS',
    android: 'Android',
    web: 'Web',
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
    status: { connected: boolean; connectionType: string } | null,
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

    const bundleVersion = bundle?.bundle?.version;
    const displayVersion =
        bundleVersion && bundleVersion !== 'builtin' && bundleVersion.trim() !== ''
            ? bundleVersion
            : (appInfo?.version ?? fallbackVersion);

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

    if (info.nativeVersion) lines.push(`Native version: ${info.nativeVersion} (${info.nativeBuild ?? '—'})`);
    if (info.bundleVersion) lines.push(`Content version: ${info.bundleVersion}`);
    if (info.channel) lines.push(`Update channel: ${info.channel}`);
    if (info.lastUpdateApplied) lines.push(`Last updated: ${info.lastUpdateApplied}`);
    if (info.network) lines.push(`Network: ${info.network.label}`);
    if (ctx.profileId) lines.push(`Account: ${ctx.profileId}`);
    if (ctx.tenantId) lines.push(`Tenant: ${ctx.tenantId}`);
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
    const [showChannelInput, setShowChannelInput] = useState(false);
    const [channelInput, setChannelInput] = useState('');
    const [switchingChannel, setSwitchingChannel] = useState(false);

    const appName = brandingConfig?.name ?? 'App';
    const tenantId = tenantConfig?.tenantId;
    const profileId = currentLCNUser?.profileId;
    const buildSha = typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : undefined;
    const buildDateRaw = typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : undefined;
    const buildDate = formatBuildDate(buildDateRaw);
    const channelSwitcherEnabled = Boolean(flags?.enableChannelSwitcher);

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
        [info, appName, profileId, tenantId, buildSha, buildDateRaw],
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
                { type: ToastTypeEnum.Success, hasDismissButton: true },
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

    /**
     * Switch the device to a different Capgo channel. Two layers of friction:
     *   1. The whole switcher is hidden unless `enableChannelSwitcher` is on in
     *      LaunchDarkly.
     *   2. We require an explicit confirmation dialog before the channel
     *      change goes through, because switching to a channel with an
     *      incompatible native binary will break the app on next reload.
     */
    const handleSwitchChannel = async (): Promise<void> => {
        const next = channelInput.trim();

        if (!next || !info) return;

        if (next === info.channel) {
            presentToast(`Already on channel ${next}.`, { hasDismissButton: true });
            return;
        }

        const ok = await confirm({
            title: 'Switch update channel?',
            text: (
                <span className="text-sm text-grayscale-700 leading-relaxed">
                    This will switch your device to channel{' '}
                    <strong className="text-grayscale-900">{next}</strong>. The app will start
                    receiving updates from that channel and may download a different version of
                    the content. Only do this if support has asked you to.
                </span>
            ),
            confirmText: `Switch to ${next}`,
            cancelText: 'Cancel',
        });

        if (!ok) return;

        setSwitchingChannel(true);

        try {
            await CapacitorUpdater.setChannel({ channel: next, triggerAutoUpdate: true });

            presentToast(`Switched to channel ${next}. Updates will apply on next reload.`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            setShowChannelInput(false);
            setChannelInput('');
            await refreshInfo();
        } catch (err) {
            const msg = (err as { message?: string } | null)?.message ?? 'unknown error';

            presentToast(`Couldn't switch channel: ${msg}`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setSwitchingChannel(false);
        }
    };

    if (!info) {
        return (
            <div className="font-poppins py-10 px-8 flex flex-col items-center gap-3">
                <span className="w-6 h-6 border-2 border-grayscale-200 border-t-grayscale-700 rounded-full animate-spin" />
                <span className="text-sm text-grayscale-500">Gathering version info…</span>
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

            <h2 className="mt-4 text-lg font-semibold text-grayscale-900 text-center">
                {appName}
            </h2>

            <p className="mt-1 text-sm text-grayscale-500 text-center">
                Version <span className="font-medium text-grayscale-700">{info.displayVersion}</span>
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
                    These details help support identify exactly which build you&rsquo;re running
                    if you ever need to report an issue.
                </p>
            </div>

            {/* ---- Core info list ------------------------------------------------ */}
            <div className="mt-4 w-full bg-white border border-grayscale-200 rounded-2xl px-4 py-1">
                <VersionInfoRow label="Platform" value={platformLabel} />
                <VersionInfoRow
                    label="App version"
                    value={info.displayVersion}
                    onCopy={copyString}
                />
                {info.nativeVersion ? (
                    <VersionInfoRow
                        label="Native version"
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
                        label="Content version"
                        value={info.bundleVersion}
                        onCopy={copyString}
                    />
                ) : null}
                {info.channel ? (
                    <VersionInfoRow
                        label="Update channel"
                        value={info.channel}
                        onCopy={copyString}
                    />
                ) : null}
                {info.lastUpdateApplied ? (
                    <VersionInfoRow
                        label="Last updated"
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
                        Copied to clipboard
                    </>
                ) : (
                    <>
                        <IonIcon icon={copyOutline} className="text-base" />
                        Copy details
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
                    <span className="uppercase tracking-wide">Advanced</span>
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
                                <VersionInfoRow
                                    label="Network"
                                    value={info.network.label}
                                />
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
                                <VersionInfoRow
                                    label="Bundle ref"
                                    value={info.bundleInternalId}
                                />
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
                                        Checking…
                                    </>
                                ) : (
                                    <>
                                        <IonIcon icon={cloudDownloadOutline} className="text-base" />
                                        Check for updates
                                    </>
                                )}
                            </button>
                        ) : null}

                        {/* ---- Channel switcher (LaunchDarkly-gated) ------------ */}
                        {channelSwitcherEnabled && info.isNative ? (
                            !showChannelInput ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setChannelInput(info.channel ?? '');
                                        setShowChannelInput(true);
                                    }}
                                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <IonIcon icon={swapHorizontalOutline} className="text-base" />
                                    Switch update channel…
                                </button>
                            ) : (
                                <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-3 flex flex-col gap-2.5">
                                    <div className="flex items-start gap-2">
                                        <IonIcon
                                            icon={warningOutline}
                                            className="text-amber-600 text-base mt-0.5 shrink-0"
                                        />
                                        <p className="text-xs text-amber-900 leading-relaxed">
                                            Switching channels can cause the app to download a
                                            version of the content that&rsquo;s incompatible with
                                            your installed app. Only continue if support has asked
                                            you to.
                                        </p>
                                    </div>

                                    <label className="text-xs font-medium text-grayscale-700 mt-1">
                                        Channel name
                                    </label>
                                    <input
                                        type="text"
                                        value={channelInput}
                                        onChange={e => setChannelInput(e.target.value)}
                                        placeholder="e.g. 1.0.7"
                                        spellCheck={false}
                                        autoCapitalize="off"
                                        autoCorrect="off"
                                        className="w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                    />

                                    <div className="flex gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowChannelInput(false);
                                                setChannelInput('');
                                            }}
                                            className="flex-1 py-2.5 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSwitchChannel}
                                            disabled={
                                                switchingChannel ||
                                                !channelInput.trim() ||
                                                channelInput.trim() === info.channel
                                            }
                                            className="flex-1 py-2.5 px-3 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {switchingChannel ? 'Switching…' : 'Apply'}
                                        </button>
                                    </div>
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
