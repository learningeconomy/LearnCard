import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { renderSmokeSummary, smokeReportFailed, type SmokeDeviceRun } from './smokeResult';
import { patchSmokeCapacitorConfig } from './patchSmokeNativeConfig';

describe('renderSmokeSummary', () => {
    const passed: SmokeDeviceRun = {
        platform: 'android',
        device: 'Samsung Galaxy S25-15.0',
        run: 1,
        status: 'passed',
        durationSeconds: 40,
        buildId: 'build-1',
        sessionId: 'session-ok',
        sessionUrl: 'https://example.test/device-farm/job/session-ok',
        detail: null,
    };

    it('links each device session and fails the report when iOS is missing', () => {
        const summary = renderSmokeSummary([
            { platform: 'android', device: passed.device, runs: [passed] },
        ]);

        expect(summary).toContain('## Native smoke — AWS Device Farm');
        expect(summary).toContain('| Platform | Device | Run | Result | Duration | Device Farm |');
        expect(summary).toContain('https://example.test/device-farm/job/session-ok');
        expect(
            renderSmokeSummary([
                {
                    platform: 'android',
                    device: passed.device,
                    runs: [{ ...passed, videoUrl: 'https://example.test/pass.mp4' }],
                },
            ])
        ).toContain('[video](https://example.test/pass.mp4)');
        expect(summary).toContain('android: 1/1 passed.');
        const hostile = renderSmokeSummary([
            {
                platform: 'android',
                device: 'Galaxy|S25\\15',
                runs: [{ ...passed, device: 'Galaxy|S25\\15' }],
            },
        ]);
        expect(hostile).toContain('Galaxy\\|S25\\\\15');
        expect(summary).toContain('ios: no result.');
        expect(
            smokeReportFailed([{ platform: 'android', device: passed.device, runs: [passed] }])
        ).toBe(true);
    });
});

describe('patchSmokeCapacitorConfig', () => {
    const raw = {
        appId: 'com.learncard.app',
        plugins: {
            CapacitorUpdater: { autoUpdate: true, defaultChannel: '1.0.13' },
        },
    };

    it('turns off Capgo and enables Android WebView debugging without dropping the channel', () => {
        const android = patchSmokeCapacitorConfig(raw, 'android');
        const updater = (
            android.plugins as { CapacitorUpdater: { autoUpdate: boolean; defaultChannel: string } }
        ).CapacitorUpdater;

        expect(updater.autoUpdate).toBe(false);
        expect(updater.defaultChannel).toBe('1.0.13');
        expect(android.android).toEqual({ webContentsDebuggingEnabled: true });
        expect(
            (raw.plugins as { CapacitorUpdater: { autoUpdate: boolean } }).CapacitorUpdater
                .autoUpdate
        ).toBe(true);
    });

    it('does not add the Android debugging flag to the iOS config', () => {
        const ios = patchSmokeCapacitorConfig(raw, 'ios');
        expect(ios.android).toBeUndefined();
    });

    it('refuses to ship a smoke build whose Capgo plugin block is missing', () => {
        expect(() => patchSmokeCapacitorConfig({ appId: 'com.learncard.app' }, 'ios')).toThrow(
            /CapacitorUpdater is missing/
        );
    });
});

describe('smoke flow', () => {
    const flow = readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), '../../maestro/smoke-signin-wallet.yaml'),
        'utf8'
    );

    it('launches fresh, signs in with the demo account, and waits for a credential card', () => {
        expect(flow).toContain('appId: com.learncard.app');
        expect(flow).toContain('androidWebViewHierarchy: devtools');
        expect(flow).toContain('clearState: true');
        expect(flow).toContain('id: login-email');
        expect(flow).toContain('demo@learningeconomy.io');
        expect(flow).toContain('id: login-email-submit');
        expect(flow).toContain('id: wallet-heading');
        expect(flow).toContain("id: 'credential-card-.*'");
        expect(flow).toContain('Sign in with Email');
        expect(flow).toContain('Passport');
        expect(flow).toContain('Credential card');
    });
});
