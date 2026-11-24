import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import { patchPbxprojBundleIds } from './patchPbxprojBundleIds';

import {
    createMaestroZip,
    deviceFarmAwsArgs,
    deviceFarmConsoleUrl,
    devicePoolRuleForArn,
    FALLBACK_PROJECT_ARN,
    interpretDeviceFarmRun,
    MAESTRO_ARCHIVE_ENTRY,
    parseDevices,
    parseAndroidFrameworks,
    parseSmokeRuns,
    resolveProjectArn,
    runAndroidOnDeviceFarm,
    runIosXcuiOnDeviceFarm,
    scheduleInstrumentationInput,
    scheduleRunInput,
    scheduleXctestInput,
    selectSmokeDevice,
    summarizeDeviceFarm,
    unscheduledIosResult,
    videoArtifactUrl,
    type DeviceFarmClient,
    type DeviceFarmDevice,
} from './deviceFarmSmoke';

const execFileAsync = promisify(execFile);

const here = dirname(fileURLToPath(import.meta.url));

const device = (overrides: Partial<DeviceFarmDevice> = {}): DeviceFarmDevice => ({
    arn: 'arn:aws:devicefarm:us-west-2::device:pixel-8',
    name: 'Google Pixel 8',
    manufacturer: 'Google',
    model: 'Pixel 8',
    formFactor: 'PHONE',
    platform: 'ANDROID',
    os: '14',
    availability: 'HIGHLY_AVAILABLE',
    fleetType: 'PUBLIC',
    ...overrides,
});

describe('resolveProjectArn', () => {
    it('uses the repo variable when it is a us-west-2 project ARN', () => {
        const resolved = resolveProjectArn(
            'arn:aws:devicefarm:us-west-2:206533012615:project:3ba5ae8a-11df-4f36-8059-3cc624d239f0'
        );
        expect(resolved.source).toBe('variable');
        expect(resolved.projectId).toBe('3ba5ae8a-11df-4f36-8059-3cc624d239f0');
    });

    it('falls back to the spike project when the variable is empty', () => {
        expect(resolveProjectArn('  ')).toEqual({
            arn: FALLBACK_PROJECT_ARN,
            source: 'fallback',
            projectId: '3ba5ae8a-11df-4f36-8059-3cc624d239f0',
        });
    });

    it('rejects a project outside us-west-2', () => {
        expect(() =>
            resolveProjectArn(
                'arn:aws:devicefarm:us-east-1:206533012615:project:3ba5ae8a-11df-4f36-8059-3cc624d239f0'
            )
        ).toThrow(/us-west-2/);
    });
});

describe('parseSmokeRuns', () => {
    it('accepts 1 through 10', () => {
        expect(parseSmokeRuns('1')).toBe(1);
        expect(parseSmokeRuns('10')).toBe(10);
    });

    it('rejects a count outside the workflow choice', () => {
        expect(() => parseSmokeRuns('0')).toThrow(/1 to 10/);
        expect(() => parseSmokeRuns('11')).toThrow(/1 to 10/);
    });
});

describe('selectSmokeDevice', () => {
    it('prefers a free Galaxy or Pixel, then the newest Android 14 or 15', () => {
        const chosen = selectSmokeDevice(
            [
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:galaxy-s24',
                    name: 'Samsung Galaxy S24',
                    manufacturer: 'Samsung',
                    os: '15',
                    availability: 'BUSY',
                }),
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:pixel-9',
                    name: 'Google Pixel 9',
                    os: '15',
                    availability: 'HIGHLY_AVAILABLE',
                }),
                device({ os: '12', name: 'Google Pixel 6' }),
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:xiaomi',
                    name: 'Xiaomi 14',
                    manufacturer: 'Xiaomi',
                    model: '14',
                    os: '15',
                }),
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:iphone-16',
                    name: 'Apple iPhone 16',
                    manufacturer: 'Apple',
                    platform: 'IOS',
                    os: '18',
                }),
            ],
            'android'
        );

        expect(chosen.name).toBe('Google Pixel 9');
    });

    it('picks one public iPhone on iOS 17 or 18 for the follow-up pool', () => {
        const chosen = selectSmokeDevice(
            [
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:iphone-15',
                    name: 'Apple iPhone 15',
                    manufacturer: 'Apple',
                    platform: 'IOS',
                    os: '17.5',
                    availability: 'AVAILABLE',
                }),
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:iphone-16',
                    name: 'Apple iPhone 16',
                    manufacturer: 'Apple',
                    platform: 'IOS',
                    os: '18.0',
                    availability: 'HIGHLY_AVAILABLE',
                }),
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:ipad',
                    name: 'Apple iPad',
                    platform: 'IOS',
                    formFactor: 'TABLET',
                    os: '18',
                }),
                device({
                    arn: 'arn:aws:devicefarm:us-west-2::device:iphone-14',
                    name: 'Apple iPhone 14',
                    platform: 'IOS',
                    os: '16',
                }),
            ],
            'ios'
        );

        expect(chosen.name).toBe('Apple iPhone 16');
    });

    it('drops device ARNs that are not safe to pass to the CLI', () => {
        expect(
            parseDevices({
                devices: [
                    {
                        arn: 'arn:aws:devicefarm:us-west-2::device:pixel-8;rm',
                        name: 'Google Pixel 8',
                        platform: 'ANDROID',
                        os: '15',
                    },
                ],
            })
        ).toEqual([]);
        expect(() => selectSmokeDevice([], 'android')).toThrow(/Listed 0 devices/);
    });
});

describe('scheduleRunInput', () => {
    it('schedules Appium Node with video capture so Maestro can run in the custom environment', () => {
        expect(
            scheduleRunInput({
                projectArn: FALLBACK_PROJECT_ARN,
                appArn: 'arn:aws:devicefarm:us-west-2:206533012615:upload:app',
                devicePoolArn: 'arn:aws:devicefarm:us-west-2:206533012615:devicepool:pool',
                testPackageArn: 'arn:aws:devicefarm:us-west-2:206533012615:upload:zip',
                testSpecArn: 'arn:aws:devicefarm:us-west-2:206533012615:upload:spec',
                name: 'lc-smoke-run-1',
            })
        ).toMatchObject({
            test: { type: 'APPIUM_NODE' },
            executionConfiguration: { jobTimeoutMinutes: 20, videoCapture: true },
        });
        expect(devicePoolRuleForArn('arn:aws:devicefarm:us-west-2::device:pixel-8')).toEqual({
            attribute: 'ARN',
            operator: 'IN',
            value: '["arn:aws:devicefarm:us-west-2::device:pixel-8"]',
        });
        expect(deviceFarmAwsArgs(['get-run', '--arn', 'abc'])).toEqual([
            'devicefarm',
            'get-run',
            '--arn',
            'abc',
            '--region',
            'us-west-2',
            '--output',
            'json',
        ]);
    });
});

describe('interpretDeviceFarmRun', () => {
    const project = '3ba5ae8a-11df-4f36-8059-3cc624d239f0';
    const runId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const jobId = '11111111-2222-3333-4444-555555555555';
    const runArn = `arn:aws:devicefarm:us-west-2:206533012615:run:${project}/${runId}`;
    const jobArn = `arn:aws:devicefarm:us-west-2:206533012615:job:${project}/${runId}/${jobId}`;

    it('keeps polling until the run is completed', () => {
        expect(
            interpretDeviceFarmRun({ arn: runArn, status: 'RUNNING' }, [], [], {
                device: 'Google Pixel 8 (Android 14)',
                run: 1,
            })
        ).toBeNull();
    });

    it('links the console job and the VIDEO artifact from a FILE listing', () => {
        const interpreted = interpretDeviceFarmRun(
            {
                arn: runArn,
                status: 'COMPLETED',
                result: 'PASSED',
                started: '2026-11-18T00:00:00.000Z',
                stopped: '2026-11-18T00:02:05.000Z',
            },
            [{ arn: jobArn, name: 'Google Pixel 8' }],
            [{ type: 'VIDEO', url: 'https://devicefarm.example/video.mp4' }],
            { device: 'Google Pixel 8 (Android 14)', run: 2 }
        );

        expect(interpreted).toMatchObject({
            status: 'passed',
            durationSeconds: 125,
            device: 'Google Pixel 8',
            sessionUrl: deviceFarmConsoleUrl(jobArn),
            videoUrl: 'https://devicefarm.example/video.mp4',
        });
        expect(interpreted?.sessionUrl).toBe(
            `https://us-west-2.console.aws.amazon.com/devicefarm/home?region=us-west-2#/projects/${project}/runs/${runId}/jobs/${jobId}`
        );
        expect(videoArtifactUrl([{ type: 'LOG' }])).toBeNull();
    });

    it('records a warned or failed Device Farm result as a failed smoke run', () => {
        expect(
            interpretDeviceFarmRun({ arn: runArn, status: 'COMPLETED', result: 'WARNED' }, [], [], {
                device: 'pixel',
                run: 1,
            })?.status
        ).toBe('failed');
    });
});

describe('runAndroidOnDeviceFarm', () => {
    const passedRun = {
        arn: 'arn:aws:devicefarm:us-west-2:206533012615:run:3ba5ae8a-11df-4f36-8059-3cc624d239f0/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        status: 'COMPLETED',
        result: 'PASSED',
        started: '2026-11-18T00:00:00.000Z',
        stopped: '2026-11-18T00:01:00.000Z',
    };
    const job = {
        arn: 'arn:aws:devicefarm:us-west-2:206533012615:job:3ba5ae8a-11df-4f36-8059-3cc624d239f0/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/11111111-2222-3333-4444-555555555555',
        name: 'Google Pixel 8',
    };

    const client = (overrides: Partial<DeviceFarmClient> = {}): DeviceFarmClient => ({
        listDevices: vi.fn(async () => [device()]),
        createUpload: vi.fn(async () => ({
            arn: 'arn:aws:devicefarm:upload',
            url: 'https://upload',
        })),
        putBytes: vi.fn(async () => undefined),
        getUpload: vi.fn(async () => ({ status: 'SUCCEEDED' })),
        createDevicePool: vi.fn(async () => 'arn:aws:devicefarm:pool'),
        deleteDevicePool: vi.fn(async () => undefined),
        devicePoolExists: vi.fn(async () => false),
        scheduleRun: vi.fn(async () => passedRun.arn),
        getRun: vi.fn(async () => passedRun),
        listJobs: vi.fn(async () => [job]),
        listArtifacts: vi.fn(async (_arn: string, type: string) =>
            type === 'FILE' ? [{ type: 'VIDEO', url: 'https://devicefarm.example/video.mp4' }] : []
        ),
        stopRun: vi.fn(async () => undefined),
        ...overrides,
    });

    const request = {
        projectArn: FALLBACK_PROJECT_ARN,
        runs: 1,
        appBytes: new Uint8Array([1]),
        appFilename: 'app-debug.apk',
        suiteBytes: new Uint8Array([2]),
        suiteFilename: 'maestro.zip',
        specBytes: new Uint8Array([3]),
        specFilename: 'devicefarm-android-testspec.yml',
        sha: 'abc1234',
        runId: '42',
    };

    it('uploads once, pins the selected device, and keeps going after a failed run', async () => {
        let schedules = 0;
        const fake = client({
            scheduleRun: vi.fn(async () => {
                schedules += 1;
                return `${passedRun.arn}-${schedules}`;
            }),
            getRun: vi.fn(async () =>
                schedules === 1
                    ? { ...passedRun, result: 'FAILED', status: 'COMPLETED' }
                    : passedRun
            ),
        });

        const result = await runAndroidOnDeviceFarm({ ...request, runs: 2 }, fake, {
            pollIntervalMs: 1,
            uploadTimeoutMs: 50,
            runTimeoutMs: 50,
            sleep: async () => undefined,
        });

        expect(result.runs.map(run => run.status)).toEqual(['failed', 'passed']);
        expect(result.runs[1]?.videoUrl).toBe('https://devicefarm.example/video.mp4');
        expect(fake.createUpload).toHaveBeenCalledTimes(3);
        expect(fake.scheduleRun).toHaveBeenCalledWith(
            expect.objectContaining({
                test: expect.objectContaining({ type: 'APPIUM_NODE' }),
                executionConfiguration: { jobTimeoutMinutes: 20, videoCapture: true },
            })
        );
        expect(fake.createDevicePool).toHaveBeenCalledWith(
            expect.objectContaining({
                rules: [devicePoolRuleForArn(device().arn)],
            })
        );
        expect(fake.listArtifacts).toHaveBeenCalledWith(job.arn, 'FILE');
        expect(fake.deleteDevicePool).toHaveBeenCalledWith('arn:aws:devicefarm:pool');
        expect(fake.devicePoolExists).toHaveBeenCalledWith('arn:aws:devicefarm:pool');
        expect(result.cleanup).toEqual({ status: 'deleted', poolArn: 'arn:aws:devicefarm:pool' });
    });

    it('stops the run and still deletes the pool when Device Farm never finishes', async () => {
        let clock = 0;
        const fake = client({
            getRun: vi.fn(async () => ({ ...passedRun, status: 'RUNNING', result: 'PENDING' })),
        });

        const result = await runAndroidOnDeviceFarm(request, fake, {
            pollIntervalMs: 100,
            uploadTimeoutMs: 1_000,
            runTimeoutMs: 150,
            now: () => clock,
            sleep: async ms => {
                clock += ms;
            },
        });

        expect(result.runs[0]?.status).toBe('timed_out');
        expect(result.runs[0]?.sessionUrl).toContain('#/projects/');
        expect(fake.stopRun).toHaveBeenCalledWith(passedRun.arn);
        expect(fake.deleteDevicePool).toHaveBeenCalledOnce();
    });

    it('does not create a pool when the upload fails', async () => {
        const fake = client({
            getUpload: vi.fn(async () => ({ status: 'FAILED', message: 'bad apk' })),
        });

        await expect(
            runAndroidOnDeviceFarm(request, fake, {
                pollIntervalMs: 1,
                uploadTimeoutMs: 20,
                sleep: async () => undefined,
            })
        ).rejects.toThrow(/bad apk/);
        expect(fake.createDevicePool).not.toHaveBeenCalled();
    });
});

describe('summarizeDeviceFarm', () => {
    it('links Android and iOS runs, including their video artifacts', () => {
        const passed = {
            status: 'passed' as const,
            durationSeconds: 60,
            buildId: 'run',
            sessionId: 'job',
            sessionUrl: 'https://console.example/run',
            videoUrl: 'https://devicefarm.example/video.mp4',
            detail: null,
        };
        const { markdown, failed } = summarizeDeviceFarm([
            {
                platform: 'android',
                device: 'Google Pixel 8 (Android 14)',
                cleanup: { status: 'deleted', poolArn: 'android-pool' },
                runs: [
                    { ...passed, platform: 'android', device: 'Google Pixel 8 (espresso)', run: 1 },
                ],
            },
            {
                platform: 'ios',
                device: 'Apple iPhone 16 (iOS 18)',
                cleanup: { status: 'deleted', poolArn: 'ios-pool' },
                runs: [{ ...passed, platform: 'ios', device: 'Apple iPhone 16 (xctest)', run: 1 }],
            },
            unscheduledIosResult(),
        ]);

        expect(markdown).toContain('## Native smoke — AWS Device Farm');
        expect(markdown).toContain('| Platform | Device | Run | Result | Duration | Device Farm |');
        expect(markdown).toContain('[run](https://console.example/run)');
        expect(markdown).toContain('[video](https://devicefarm.example/video.mp4)');
        expect(markdown).toContain('android: 1/1 passed.');
        expect(markdown).toContain('ios: 1/1 passed.');
        expect(markdown).toContain('android: deletion confirmed for `android-pool`');
        expect(markdown).toContain('ios: deletion confirmed for `ios-pool`');
        expect(markdown).not.toContain('not scheduled');
        expect(failed).toBe(false);
    });

    it('fails when either platform result is missing', () => {
        expect(summarizeDeviceFarm([]).failed).toBe(true);
        expect(
            summarizeDeviceFarm([
                {
                    platform: 'android',
                    device: 'pixel',
                    runs: [
                        {
                            platform: 'android',
                            device: 'pixel',
                            run: 1,
                            status: 'passed',
                            durationSeconds: 1,
                            buildId: null,
                            sessionId: null,
                            sessionUrl: null,
                            detail: null,
                        },
                    ],
                },
            ]).failed
        ).toBe(true);
    });
});

describe('device farm maestro package', () => {
    const spec = readFileSync(
        resolve(here, '../../maestro/devicefarm-android-testspec.yml'),
        'utf8'
    );

    it('runs the same smoke flow from the zip Device Farm extracts', () => {
        const testLine = spec.split('\n').find(line => line.includes('maestro test'));
        expect(testLine).toContain(MAESTRO_ARCHIVE_ENTRY);
        expect(testLine).not.toContain('|| true');
        expect(spec).toContain('android_test_host: amazon_linux_2023');
        expect(spec).toContain('amazon-corretto-21');
        expect(spec).toContain('https://get.maestro.mobile.dev');
        expect(spec).toContain('$DEVICEFARM_LOG_DIR');
    });

    it('zips the flow at the path the test spec executes', async () => {
        const bytes = await createMaestroZip(
            resolve(here, '../../maestro/smoke-signin-wallet.yaml')
        );
        const root = await mkdtemp(join(tmpdir(), 'lc-maestro-list-'));
        try {
            const zipPath = join(root, 'maestro.zip');
            await writeFile(zipPath, bytes);
            const { stdout } = await execFileAsync('unzip', ['-Z1', zipPath]);
            expect(stdout.split('\n')).toContain(MAESTRO_ARCHIVE_ENTRY);
        } finally {
            await rm(root, { recursive: true, force: true });
        }
    });
});

describe('native smoke runners', () => {
    it('defaults to espresso and accepts each Android framework choice', () => {
        expect(parseAndroidFrameworks(undefined)).toEqual(['espresso']);
        expect(parseAndroidFrameworks('maestro')).toEqual(['maestro']);
        expect(parseAndroidFrameworks('both')).toEqual(['maestro', 'espresso']);
        expect(parseAndroidFrameworks('espresso')).toEqual(['espresso']);
        expect(() => parseAndroidFrameworks('appium')).toThrow(/maestro, espresso, or both/);
    });

    it('schedules Espresso instrumentation and XCUITest with video capture', () => {
        expect(
            scheduleInstrumentationInput({
                projectArn: FALLBACK_PROJECT_ARN,
                appArn: 'app',
                devicePoolArn: 'pool',
                testPackageArn: 'tests',
                name: 'espresso',
            }).test
        ).toEqual({
            type: 'INSTRUMENTATION',
            testPackageArn: 'tests',
            filter: 'com.learncard.app.SmokeSignInWalletTest',
        });
        expect(
            scheduleXctestInput({
                projectArn: FALLBACK_PROJECT_ARN,
                appArn: 'app',
                devicePoolArn: 'pool',
                testPackageArn: 'runner',
                name: 'xctest',
            }).test
        ).toEqual({ type: 'XCTEST_UI', testPackageArn: 'runner' });
    });

    it.each(['confirmed', 'still present', 'denied'] as const)(
        'reports an XCUITest pass separately from cleanup when deletion is %s',
        async cleanup => {
            const iphone = device({
                arn: 'arn:aws:devicefarm:us-west-2::device:iphone-16',
                name: 'Apple iPhone 16',
                manufacturer: 'Apple',
                platform: 'IOS',
                os: '18.0',
            });
            const fake: DeviceFarmClient = {
                listDevices: vi.fn(async () => [iphone]),
                createUpload: vi.fn(async () => ({
                    arn: 'arn:aws:devicefarm:upload',
                    url: 'https://upload',
                })),
                putBytes: vi.fn(async () => undefined),
                getUpload: vi.fn(async () => ({ status: 'SUCCEEDED' })),
                createDevicePool: vi.fn(async () => 'arn:aws:devicefarm:pool'),
                deleteDevicePool: vi.fn(async () => {
                    if (cleanup === 'denied') throw new Error('AccessDeniedException');
                }),
                devicePoolExists: vi.fn(async () => cleanup === 'still present'),
                scheduleRun: vi.fn(
                    async () =>
                        'arn:aws:devicefarm:us-west-2:206533012615:run:3ba5ae8a-11df-4f36-8059-3cc624d239f0/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
                ),
                getRun: vi.fn(async () => ({
                    arn: 'arn:aws:devicefarm:us-west-2:206533012615:run:3ba5ae8a-11df-4f36-8059-3cc624d239f0/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                    status: 'COMPLETED',
                    result: 'PASSED',
                })),
                listJobs: vi.fn(async () => []),
                listArtifacts: vi.fn(async () => []),
                stopRun: vi.fn(async () => undefined),
            };

            let now = 0;
            const result = await runIosXcuiOnDeviceFarm(
                {
                    projectArn: FALLBACK_PROJECT_ARN,
                    runs: 1,
                    ipaBytes: new Uint8Array([1]),
                    ipaFilename: 'LearnCard-smoke.ipa',
                    testBytes: new Uint8Array([2]),
                    testFilename: 'AppUITests.zip',
                    sha: 'abc',
                    runId: '9',
                },
                fake,
                {
                    pollIntervalMs: 1,
                    uploadTimeoutMs: 20,
                    runTimeoutMs: 20,
                    now: () => now,
                    sleep: async ms => {
                        now += ms;
                    },
                }
            );

            expect(result.platform).toBe('ios');
            expect(result.runs[0]?.status).toBe('passed');
            expect(fake.scheduleRun).toHaveBeenCalledWith(
                expect.objectContaining({
                    test: { type: 'XCTEST_UI', testPackageArn: 'arn:aws:devicefarm:upload' },
                    executionConfiguration: { jobTimeoutMinutes: 20, videoCapture: true },
                })
            );
            expect(fake.createDevicePool).toHaveBeenCalledWith(
                expect.objectContaining({ rules: [devicePoolRuleForArn(iphone.arn)] })
            );
            expect(fake.deleteDevicePool).toHaveBeenCalledOnce();
            expect(result.cleanup?.status).toBe(cleanup === 'confirmed' ? 'deleted' : 'failed');
            const report = summarizeDeviceFarm([result], ['ios']);
            expect(report.failed).toBe(cleanup !== 'confirmed');
            expect(report.markdown).toContain('ios: 1/1 passed.');
            expect(report.markdown).toContain(
                cleanup === 'confirmed' ? 'ios: deletion confirmed' : 'ios: deletion unconfirmed'
            );
        }
    );

    it('keeps the App archive free of the UI test target and the uitests bundle id', () => {
        const template = readFileSync(
            resolve(here, '../../ios/App/App.xcodeproj/project.pbxproj.template'),
            'utf8'
        );
        const appScheme = readFileSync(
            resolve(here, '../../ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme'),
            'utf8'
        );
        const uiScheme = readFileSync(
            resolve(here, '../../ios/App/App.xcodeproj/xcshareddata/xcschemes/AppUITests.xcscheme'),
            'utf8'
        );
        const swift = readFileSync(
            resolve(here, '../../ios/App/AppUITests/SmokeSignInWalletUITests.swift'),
            'utf8'
        );
        const espresso = readFileSync(
            resolve(
                here,
                '../../android/app/src/androidTest/java/com/learncard/app/SmokeSignInWalletTest.java'
            ),
            'utf8'
        );

        expect(template).toContain('productType = "com.apple.product-type.bundle.ui-testing"');
        expect(template).toContain('CODE_SIGNING_ALLOWED = NO');
        expect(template).toContain('PRODUCT_BUNDLE_IDENTIFIER = com.learncard.app.uitests;');
        expect(patchPbxprojBundleIds(template, 'app.example.tenant')).toContain(
            'PRODUCT_BUNDLE_IDENTIFIER = app.example.tenant;'
        );
        expect(patchPbxprojBundleIds(template, 'app.example.tenant')).toContain(
            'PRODUCT_BUNDLE_IDENTIFIER = com.learncard.app.uitests;'
        );
        expect(appScheme).not.toContain('AppUITests');
        expect(appScheme).toContain('buildForArchiving = "YES"');
        expect(uiScheme).toContain('buildForArchiving = "NO"');
        expect(uiScheme).toContain('BlueprintName = "AppUITests"');
        expect(swift).toContain('"login-email"');
        expect(swift).toContain('"login-email-submit"');
        expect(swift).toContain('"wallet-heading"');
        expect(swift).toContain('demo@learningeconomy.io');
        expect(swift).toContain("label == 'Credential card'");
        expect(espresso).toContain('login-email-submit');
        expect(espresso).toContain('wallet-heading');
        expect(espresso).toContain("[aria-label='Credential card']");
        expect(espresso).toContain('forceJavascriptEnabled');
        const gradle = readFileSync(
            resolve(here, '../../android/app/build.gradle.template'),
            'utf8'
        );
        expect(gradle).toContain('androidTestImplementation "androidx.test.espresso:espresso-web:');
        expect(gradle).toContain('androidTestImplementation "androidx.test:rules:');
        expect(gradle).not.toContain('implementation "androidx.test.espresso:espresso-web:');
    });
});
