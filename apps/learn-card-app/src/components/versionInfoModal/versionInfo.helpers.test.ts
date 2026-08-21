/**
 * Tests for the version diagnostics helpers extracted from VersionInfoModal
 * (LC-2086 Task 4).
 *
 * These lock in the exact collection behavior the modal relied on so the
 * extraction is a pure move:
 *
 *   - web fallback (no native plugin calls, fallbackVersion wins),
 *   - per-plugin failure isolation (one rejecting call never blanks the rest),
 *   - Capgo bundle version selection rules (live bundle > native > fallback),
 *   - `lastUpdateApplied` sentinel rejection,
 *   - the small formatting helpers used by the modal.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { capacitorMock, networkMock, appMock, deviceMock, updaterMock } = vi.hoisted(() => ({
    capacitorMock: { getPlatform: vi.fn(), isNativePlatform: vi.fn() },
    networkMock: { getStatus: vi.fn() },
    appMock: { getInfo: vi.fn() },
    deviceMock: { getInfo: vi.fn() },
    updaterMock: {
        current: vi.fn(),
        getChannel: vi.fn(),
        getDeviceId: vi.fn(),
        getPluginVersion: vi.fn(),
        getBuiltinVersion: vi.fn(),
    },
}));

vi.mock('@capacitor/core', () => ({ Capacitor: capacitorMock }));
vi.mock('@capacitor/network', () => ({ Network: networkMock }));
vi.mock('@capacitor/app', () => ({ App: appMock }));
vi.mock('@capacitor/device', () => ({ Device: deviceMock }));
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: updaterMock }));

import {
    collectVersionInfo,
    formatBuildDate,
    formatNetwork,
    formatRelative,
    summarizeDevice,
} from './versionInfo.helpers';
import type { DeviceInfo } from '@capacitor/device';

const WIFI = { connected: true, connectionType: 'wifi' };
const OFFLINE = { connected: false, connectionType: 'none' };

const nativeDevice = {
    model: 'iPhone14,5',
    manufacturer: 'Apple',
    operatingSystem: 'ios',
    osVersion: '17.5.1',
    webViewVersion: '17.5',
    isVirtual: false,
} as unknown as DeviceInfo;

const resolveAllPlugins = (): void => {
    updaterMock.current.mockResolvedValue({ bundle: { version: 'builtin' } });
    updaterMock.getChannel.mockResolvedValue({ channel: 'production' });
    updaterMock.getDeviceId.mockResolvedValue({ deviceId: 'capgo-device-id' });
    updaterMock.getPluginVersion.mockResolvedValue({ version: '6.2.5' });
    updaterMock.getBuiltinVersion.mockResolvedValue({ version: '1.98.0' });
    deviceMock.getInfo.mockResolvedValue(nativeDevice);
};

beforeEach(() => {
    vi.clearAllMocks();
    networkMock.getStatus.mockResolvedValue(WIFI);
    appMock.getInfo.mockResolvedValue({ version: '1.98.0', build: '42', id: 'com.learncard.app' });
    resolveAllPlugins();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('collectVersionInfo', () => {
    it('falls back to the web summary without touching native plugins', async () => {
        capacitorMock.getPlatform.mockReturnValue('web');
        capacitorMock.isNativePlatform.mockReturnValue(false);

        const info = await collectVersionInfo('1.98.3');

        expect(info).toEqual({
            platform: 'web',
            isNative: false,
            displayVersion: '1.98.3',
            network: { connected: true, label: 'Wi-Fi · Connected' },
        });
        expect(appMock.getInfo).not.toHaveBeenCalled();
        expect(updaterMock.current).not.toHaveBeenCalled();
        expect(deviceMock.getInfo).not.toHaveBeenCalled();
    });

    it('isolates a single failing native plugin without blanking the summary', async () => {
        capacitorMock.getPlatform.mockReturnValue('ios');
        capacitorMock.isNativePlatform.mockReturnValue(true);
        updaterMock.current.mockRejectedValue(new Error('plugin not available'));
        deviceMock.getInfo.mockRejectedValue(new Error('plugin not available'));
        networkMock.getStatus.mockResolvedValue(OFFLINE);

        const info = await collectVersionInfo('1.98.3');

        expect(info).toMatchObject({
            platform: 'ios',
            isNative: true,
            displayVersion: '1.98.0',
            nativeVersion: '1.98.0',
            nativeBuild: '42',
            bundleVersion: undefined,
            channel: 'production',
            network: { connected: false, label: 'Offline' },
            device: undefined,
        });
    });

    describe('Capgo version selection', () => {
        beforeEach(() => {
            capacitorMock.getPlatform.mockReturnValue('ios');
            capacitorMock.isNativePlatform.mockReturnValue(true);
        });

        it('prefers a live OTA bundle version over the native version', async () => {
            updaterMock.current.mockResolvedValue({
                bundle: { version: '2026.08.20', downloaded: '2026-08-19T10:00:00.000Z' },
            });

            const info = await collectVersionInfo('1.98.3');

            expect(info.displayVersion).toBe('2026.08.20');
            expect(info.bundleVersion).toBe('2026.08.20');
            expect(info.lastUpdateApplied).toBe('2026-08-19T10:00:00.000Z');
        });

        it.each([
            ['builtin bundle', 'builtin'],
            ['blank bundle version', '   '],
            ['missing bundle version', undefined],
        ])('falls back to the native version for %s', async (_label, bundleVersion) => {
            updaterMock.current.mockResolvedValue({ bundle: { version: bundleVersion } });

            const info = await collectVersionInfo('1.98.3');

            expect(info.displayVersion).toBe('1.98.0');
            expect(info.lastUpdateApplied).toBeUndefined();
        });

        it('falls back to the provided version when the app and bundle calls fail', async () => {
            appMock.getInfo.mockRejectedValue(new Error('unavailable'));
            updaterMock.current.mockRejectedValue(new Error('unavailable'));

            const info = await collectVersionInfo('1.98.3');

            expect(info.displayVersion).toBe('1.98.3');
        });
    });

    it('rejects pre-2020 downloaded timestamps as unset', async () => {
        capacitorMock.getPlatform.mockReturnValue('android');
        capacitorMock.isNativePlatform.mockReturnValue(true);
        updaterMock.current.mockResolvedValue({
            bundle: { version: '2026.08.20', downloaded: '1970-01-01T00:00:00.000Z' },
        });

        const info = await collectVersionInfo('1.98.3');

        expect(info.lastUpdateApplied).toBeUndefined();
    });
});

describe('formatNetwork', () => {
    it.each([
        ['wifi', { connected: true, label: 'Wi-Fi · Connected' }],
        ['cellular', { connected: true, label: 'Cellular · Connected' }],
        ['none', { connected: false, label: 'Offline' }],
        ['unknown', { connected: true, label: 'Connected' }],
    ])('maps %s', (connectionType, expected) => {
        expect(formatNetwork({ connected: connectionType !== 'none', connectionType })).toEqual(
            expected
        );
    });

    it('reports offline when disconnected regardless of connection type', () => {
        expect(formatNetwork({ connected: false, connectionType: 'wifi' })).toEqual({
            connected: false,
            label: 'Offline',
        });
    });

    it('returns undefined for a null status', () => {
        expect(formatNetwork(null)).toBeUndefined();
    });
});

describe('summarizeDevice', () => {
    it('composes the Android OS label with the SDK level', () => {
        const summary = summarizeDevice({
            operatingSystem: 'android',
            osVersion: '14',
            androidSDKVersion: 34,
            model: 'SM-S928U',
            manufacturer: 'samsung',
        } as unknown as DeviceInfo);

        expect(summary).toMatchObject({ osLabel: 'Android 14 (SDK 34)', model: 'SM-S928U' });
    });

    it('returns undefined when the device shim has nothing useful', () => {
        expect(summarizeDevice({} as DeviceInfo)).toBeUndefined();
        expect(summarizeDevice(null)).toBeUndefined();
    });
});

describe('formatRelative', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-20T12:00:00Z'));
    });

    it.each([
        ['2026-08-20T11:59:30Z', 'Just now'],
        ['2026-08-20T11:30:00Z', '30 minutes ago'],
        ['2026-08-20T09:00:00Z', '3 hours ago'],
        ['2026-08-19T12:00:00Z', '1 day ago'],
    ])('renders %s as %s', (iso, expected) => {
        expect(formatRelative(iso)).toBe(expected);
    });

    it('returns undefined for missing, invalid, or sentinel timestamps', () => {
        expect(formatRelative(undefined)).toBeUndefined();
        expect(formatRelative('not-a-date')).toBeUndefined();
        expect(formatRelative('1970-01-01T00:00:00.000Z')).toBeUndefined();
    });
});

describe('formatBuildDate', () => {
    it('returns undefined for missing or invalid timestamps', () => {
        expect(formatBuildDate(undefined)).toBeUndefined();
        expect(formatBuildDate('not-a-date')).toBeUndefined();
    });

    it('formats a valid ISO timestamp', () => {
        expect(formatBuildDate('2026-08-20T14:30:00.000Z')).toMatch(/Aug/);
    });
});
