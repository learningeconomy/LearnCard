/**
 * Tests for the privacy-safe feedback report context (LC-2086 Task 4).
 *
 * The context is redacted by construction: `collectFeedbackContext` maps a
 * full `VersionInfo` (which deliberately contains support-only fields like
 * the Capgo device id and bundle checksum) onto the narrow subset a feedback
 * report is allowed to carry. These tests lock in:
 *
 *   - exact enumeration of the allowed `app` keys (never a spread),
 *   - bug vs idea collection differences,
 *   - route-history handling including the location fallback,
 *   - the default diagnostic-log dependency.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearDiagnosticLogs, recordDiagnosticLog } from 'learn-card-base';

import { collectFeedbackContext } from './collectFeedbackContext';
import type { VersionInfo } from '../../components/versionInfoModal/versionInfo.helpers';

/**
 * The `learn-card-base` barrel transitively pulls web UI modules that fail to
 * evaluate under vitest, so stub it with the REAL diagnostic log buffer (same
 * pattern as `test-utils/mockLearnCardBase.ts`). Sharing the source module
 * keeps the buffer singleton identical between the SUT and the test.
 */
vi.mock('learn-card-base', async () => ({
    ...(await import('learn-card-base/logging/diagnosticLogBuffer')),
}));

/**
 * `normalizeScreenName` lives in `useScreenView.ts` next to the analytics
 * context, whose import chain is unrelated to route normalization. Stub the
 * context module so the pure helper can load without the analytics stack.
 */
vi.mock('../../analytics/context', () => ({}));

const fullVersionInfo = (): VersionInfo => ({
    platform: 'ios',
    isNative: true,
    displayVersion: '1.98.3',
    nativeVersion: '1.98.0',
    nativeBuild: '42',
    bundleId: 'com.learncard.app',
    bundleVersion: '2026.08.20',
    bundleInternalId: 'must-not-leak-internal-id',
    bundleChecksum: 'must-not-leak-checksum',
    channel: 'production',
    deviceId: 'must-not-leak-device-id',
    pluginVersion: '6.2.5',
    builtinVersion: '1.98.0',
    lastUpdateApplied: '2026-08-19T10:00:00.000Z',
    network: { connected: true, label: 'Wi-Fi · Connected' },
    device: { model: 'iPhone14,5', manufacturer: 'Apple', osLabel: 'iOS 19' },
});

const deps = {
    collectVersionInfo: vi.fn(async (): Promise<VersionInfo> => fullVersionInfo()),
    getRoutes: vi.fn((): string[] => ['/wallet', '/credential/:id']),
    getLogs: vi.fn((): [] => []),
};

beforeEach(() => {
    vi.clearAllMocks();
    deps.collectVersionInfo.mockImplementation(async () => fullVersionInfo());
    deps.getRoutes.mockImplementation(() => ['/wallet', '/credential/:id']);
    deps.getLogs.mockImplementation(() => []);
    clearDiagnosticLogs();
});

afterEach(() => {
    clearDiagnosticLogs();
});

describe('collectFeedbackContext', () => {
    it('maps only the approved diagnostic subset', async () => {
        const context = await collectFeedbackContext(
            { kind: 'bug', fallbackVersion: '1.98.3', tenantId: 'learncard' },
            deps
        );

        expect(JSON.stringify(context)).not.toContain('must-not-leak');
        expect(context.currentRoute).toBe('/credential/:id');
        expect(context.recentRoutes).toEqual(['/wallet', '/credential/:id']);
        expect(context.tenantId).toBe('learncard');
        expect(context.app).toEqual({
            platform: 'ios',
            displayVersion: '1.98.3',
            nativeVersion: '1.98.0',
            nativeBuild: '42',
            bundleVersion: '2026.08.20',
            channel: 'production',
        });
        expect(context.device).toEqual({
            model: 'iPhone14,5',
            manufacturer: 'Apple',
            osLabel: 'iOS 19',
        });
        expect(context.network).toEqual({ connected: true, label: 'Wi-Fi · Connected' });
    });

    it('never copies support-only VersionInfo fields into the report context', async () => {
        const context = await collectFeedbackContext(
            { kind: 'bug', fallbackVersion: '1.98.3' },
            deps
        );

        const serialized = JSON.stringify(context);

        expect(serialized).not.toContain('com.learncard.app');
        expect(serialized).not.toContain('6.2.5');
        expect(serialized).not.toContain('lastUpdateApplied');
        expect(Object.keys(context.app ?? {})).toEqual([
            'platform',
            'displayVersion',
            'nativeVersion',
            'nativeBuild',
            'bundleVersion',
            'channel',
        ]);
    });

    it('omits logs and device details for ideas', async () => {
        const context = await collectFeedbackContext(
            { kind: 'idea', fallbackVersion: '1.98.3', tenantId: 'learncard' },
            deps
        );

        expect(context.logs).toBeUndefined();
        expect(context.device).toBeUndefined();
        expect(context.network).toBeUndefined();
        // Ideas still carry the normalized route, tenant, and app version.
        expect(context.currentRoute).toBe('/credential/:id');
        expect(context.app?.displayVersion).toBe('1.98.3');
    });

    it('includes the buffered diagnostic logs for bugs', async () => {
        const logs = [
            { timestamp: '2026-08-20T12:00:00.000Z', level: 'info' as const, message: 'hello' },
        ];

        const context = await collectFeedbackContext(
            { kind: 'bug', fallbackVersion: '1.98.3' },
            { ...deps, getLogs: () => logs }
        );

        expect(context.logs).toBe(logs);
    });

    it('falls back to the normalized current location when no route history exists', async () => {
        const originalLocation = window.location;

        Object.defineProperty(window, 'location', {
            value: { pathname: '/profile/did:key:z6MkHidden' },
            configurable: true,
            writable: true,
        });

        try {
            const context = await collectFeedbackContext(
                { kind: 'bug', fallbackVersion: '1.98.3' },
                { ...deps, getRoutes: () => [] }
            );

            expect(context.currentRoute).toBe('/profile/:id');
            expect(context.recentRoutes).toEqual([]);
        } finally {
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                configurable: true,
                writable: true,
            });
        }
    });

    it('defaults to the sanitized diagnostic log buffer', async () => {
        recordDiagnosticLog({ level: 'warning', scope: 'test', message: 'buffered entry' });

        const context = await collectFeedbackContext(
            { kind: 'bug', fallbackVersion: '1.98.3' },
            { collectVersionInfo: deps.collectVersionInfo, getRoutes: deps.getRoutes }
        );

        expect(context.logs).toEqual([
            expect.objectContaining({ level: 'warning', message: 'buffered entry' }),
        ]);
    });

    it('collects version info through the shared helper by default', async () => {
        const context = await collectFeedbackContext(
            { kind: 'idea', fallbackVersion: '1.98.3' },
            { getRoutes: () => [], getLogs: () => [] }
        );

        expect(context.app?.displayVersion).toBe('1.98.3');
        expect(context.app?.platform).toBe('web');
    });
});
