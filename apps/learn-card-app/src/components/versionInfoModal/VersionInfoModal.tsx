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
 *   - Bottom primary action: "Copy details" — pastes a pre-formatted,
 *     support-ready block to the clipboard.
 *   - Advanced (collapsed by default): device ID, builtin bundle version,
 *     native build number, Capgo plugin version. Hidden unless expanded.
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
    copyOutline,
    informationCircleOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { App, type AppInfo } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

import { useBrandingConfig, useToast, ToastTypeEnum } from 'learn-card-base';

import { useTenantBrandingAssets } from '../../config/brandingAssets';

type Platform = 'ios' | 'android' | 'web';

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

const collectVersionInfo = async (fallbackVersion: string): Promise<VersionInfo> => {
    const platform = Capacitor.getPlatform() as Platform;
    const isNative = Capacitor.isNativePlatform();

    if (!isNative) {
        return {
            platform,
            isNative,
            displayVersion: fallbackVersion,
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
    };
};

const buildCopyPayload = (info: VersionInfo, appName: string): string => {
    const lines = [
        `${appName} — version details`,
        `Platform: ${PLATFORM_LABELS[info.platform]}`,
        `App version: ${info.displayVersion}`,
    ];

    if (info.nativeVersion) lines.push(`Native version: ${info.nativeVersion} (${info.nativeBuild ?? '—'})`);
    if (info.bundleVersion) lines.push(`Content version: ${info.bundleVersion}`);
    if (info.channel) lines.push(`Update channel: ${info.channel}`);
    if (info.bundleId) lines.push(`Bundle id: ${info.bundleId}`);
    if (info.deviceId) lines.push(`Device id: ${info.deviceId}`);
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

    const [info, setInfo] = useState<VersionInfo | null>(null);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

    const appName = brandingConfig?.name ?? 'App';

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
        () => (info ? buildCopyPayload(info, appName) : ''),
        [info, appName],
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
        <div className="font-poppins px-6 pt-6 pb-5 flex flex-col items-center w-full max-w-[400px] mx-auto">
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

            {/* ---- Advanced (collapsible) ---------------------------------------- */}
            {info.isNative && (info.deviceId || info.pluginVersion || info.builtinVersion || info.bundleId || info.bundleInternalId || info.bundleChecksum) ? (
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
                        <div className="mt-1 w-full bg-grayscale-10 border border-grayscale-200 rounded-2xl px-4 py-1">
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
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default VersionInfoModal;
