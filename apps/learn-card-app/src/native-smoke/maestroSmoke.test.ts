import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import {
    interpretBuild,
    maestroBuildRequest,
    renderSmokeSummary,
    runSmoke,
    smokeReportFailed,
    type BrowserStackClient,
    type SmokeDeviceRun,
} from './maestroSmoke';
import { patchSmokeCapacitorConfig } from './patchSmokeNativeConfig';

const context = {
    platform: 'ios' as const,
    device: 'iPhone 16-18',
    run: 1,
    buildId: 'build-1',
};

describe('interpretBuild', () => {
    it('keeps polling while BrowserStack is still running', () => {
        expect(interpretBuild({ status: 'running', devices: [] }, context)).toBeNull();
    });

    it('records a passed session with its duration and dashboard link', () => {
        const run = interpretBuild(
            {
                status: 'passed',
                duration: 184,
                devices: [
                    {
                        sessions: [{ id: 'session-9', status: 'passed', duration: '92' }],
                    },
                ],
            },
            context
        );

        expect(run).toMatchObject({
            status: 'passed',
            durationSeconds: 92,
            sessionId: 'session-9',
            sessionUrl: 'https://app-automate.browserstack.com/dashboard/v2/sessions/session-9',
            detail: null,
        });
    });

    it('fails a finished build when a session failed', () => {
        const run = interpretBuild(
            {
                status: 'done',
                devices: [{ sessions: [{ id: 'session-2', status: 'failed' }] }],
            },
            context
        );

        expect(run?.status).toBe('failed');
        expect(run?.sessionUrl).toContain('session-2');
    });

    it('treats a BrowserStack timeout as a timed-out run', () => {
        expect(interpretBuild({ status: 'timeout', devices: [] }, context)?.status).toBe(
            'timed_out'
        );
    });
});

describe('maestroBuildRequest', () => {
    it('targets one device and the smoke flow on the platform endpoint payload', () => {
        expect(
            maestroBuildRequest({
                appUrl: 'bs://app',
                testSuiteUrl: 'bs://suite',
                device: 'Samsung Galaxy S25-15.0',
                platform: 'android',
                run: 2,
                sha: 'abcdef123456',
            })
        ).toMatchObject({
            devices: ['Samsung Galaxy S25-15.0'],
            execute: ['smoke-signin-wallet.yaml'],
            customBuildName: 'lc-smoke-android-run-2-abcdef1',
        });
    });
});

describe('runSmoke', () => {
    const passedBuild = {
        status: 'passed',
        duration: 40,
        devices: [{ sessions: [{ id: 'session-ok', status: 'passed', duration: 40 }] }],
    };

    const client = (overrides: Partial<BrowserStackClient> = {}): BrowserStackClient => ({
        uploadApp: vi.fn(async () => 'bs://app'),
        uploadSuite: vi.fn(async () => 'bs://suite'),
        startBuild: vi.fn(async () => 'build-1'),
        getBuild: vi.fn(async () => passedBuild),
        stopBuild: vi.fn(async () => undefined),
        ...overrides,
    });

    it('polls until the build finishes and keeps going after a failed run', async () => {
        let clock = 0;
        let polls = 0;
        const fake = client({
            startBuild: vi.fn(async () => `build-${polls}`),
            getBuild: vi.fn(async () => {
                polls += 1;
                if (polls === 1) return { status: 'running', devices: [] };
                if (polls === 2) return passedBuild;
                return {
                    status: 'failed',
                    devices: [{ sessions: [{ id: 'session-bad', status: 'failed' }] }],
                };
            }),
        });

        const runs = await runSmoke(
            {
                platform: 'android',
                device: 'Samsung Galaxy S25-15.0',
                runs: 2,
                appBytes: new Uint8Array(),
                appFilename: 'app-debug.apk',
                suiteBytes: new Uint8Array(),
                suiteFilename: 'suite.zip',
                sha: 'abc',
            },
            fake,
            {
                pollIntervalMs: 10,
                runTimeoutMs: 1_000,
                now: () => clock,
                sleep: async ms => {
                    clock += ms;
                },
            }
        );

        expect(runs.map(run => run.status)).toEqual(['passed', 'failed']);
        expect(fake.uploadApp).toHaveBeenCalledOnce();
        expect(fake.startBuild).toHaveBeenCalledTimes(2);
    });

    it('stops the build and records a timeout when BrowserStack never finishes', async () => {
        let clock = 0;
        const fake = client({
            getBuild: vi.fn(async () => ({ status: 'queued', devices: [] })),
        });

        const runs = await runSmoke(
            {
                platform: 'ios',
                device: 'iPhone 16-18',
                runs: 1,
                appBytes: new Uint8Array(),
                appFilename: 'LearnCard-smoke.ipa',
                suiteBytes: new Uint8Array(),
                suiteFilename: 'suite.zip',
                sha: 'abc',
            },
            fake,
            {
                pollIntervalMs: 100,
                runTimeoutMs: 150,
                now: () => clock,
                sleep: async ms => {
                    clock += ms;
                },
            }
        );

        expect(runs[0]?.status).toBe('timed_out');
        expect(fake.stopBuild).toHaveBeenCalledWith('build-1');
    });
});

describe('renderSmokeSummary', () => {
    const passed: SmokeDeviceRun = {
        platform: 'android',
        device: 'Samsung Galaxy S25-15.0',
        run: 1,
        status: 'passed',
        durationSeconds: 40,
        buildId: 'build-1',
        sessionId: 'session-ok',
        sessionUrl: 'https://app-automate.browserstack.com/dashboard/v2/sessions/session-ok',
        detail: null,
    };

    it('links each device session and fails the report when iOS is missing', () => {
        const summary = renderSmokeSummary([
            { platform: 'android', device: passed.device, runs: [passed] },
        ]);

        expect(summary).toContain(
            'https://app-automate.browserstack.com/dashboard/v2/sessions/session-ok'
        );
        expect(summary).toContain('android: 1/1 passed.');
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
        expect(flow).toContain('(?i)sign in with email');
        expect(flow).toContain('Passport');
        expect(flow).toContain('Credential card');
    });
});
