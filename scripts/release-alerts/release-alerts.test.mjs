import assert from 'node:assert/strict';
import test from 'node:test';

import {
    FIX_HINTS,
    SETTLE_DELAYS_S,
    SYNTHETIC_DEVICE_IDS,
    formatAlert as formatCanaryAlert,
    latestNativeVersions,
    previousPatch,
    probeUpdate,
    runCanary,
} from './capgo-canary.mjs';
import {
    collectNativeJobs,
    extractReason,
    formatAlert as formatNativeAlert,
    nativePlatform,
} from './native-release-check.mjs';
import { escapeSlackText, postReleaseAlert, postWebhookFallback } from './slack.mjs';

const noSleep = async () => {};

const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Fake Capgo: serves a device list and answers update probes per platform the
 * way plugin.capgo.app/updates does (200 + {version} or 200 + {error}).
 */
const fakeCapgo = ({ devices = [], answer }) => {
    const probes = [];
    const fetchImpl = async (url, init = {}) => {
        const href = String(url);
        if (href.startsWith('https://api.capgo.app/device/'))
            return json({ data: devices, hasMore: false });
        if (href === 'https://plugin.capgo.app/updates') {
            const body = JSON.parse(init.body);
            probes.push(body);
            return json(answer(body));
        }
        throw new Error(`unexpected request ${href}`);
    };
    return { fetchImpl, probes };
};

const devices = [
    { device_id: 'a', platform: 'ios', version_build: '20.0.93', is_emulator: false },
    { device_id: 'b', platform: 'ios', version_build: '20.0.95', is_emulator: false },
    { device_id: 'c', platform: 'ios', version_build: '99.0.0', is_emulator: true },
    { device_id: SYNTHETIC_DEVICE_IDS.ios, platform: 'ios', version_build: '50.0.0' },
    { device_id: 'd', platform: 'android', version_build: '1.37.65', is_emulator: false },
    { device_id: 'e', platform: 'android', version_build: 'not-a-version' },
];

const canary = fetchImpl =>
    runCanary({
        appId: 'com.learncard.app',
        channel: '1.0.13',
        bundle: '1.100.9',
        pluginVersion: '8.52.1',
        token: 'capgo-token',
        fetchImpl,
        sleep: noSleep,
    });

test('picks the newest real native version per platform', () => {
    assert.deepEqual(latestNativeVersions(devices), { ios: '20.0.95', android: '1.37.65' });
});

test('previous patch is the bundle a returning user is on', () => {
    assert.equal(previousPatch('1.100.9'), '1.100.8');
    assert.equal(previousPatch('1.101.0'), null);
    assert.equal(previousPatch('nope'), null);
});

test('passes when every platform and starting bundle is offered the new bundle', async () => {
    const { fetchImpl, probes } = fakeCapgo({ devices, answer: () => ({ version: '1.100.9' }) });
    const report = await canary(fetchImpl);
    assert.equal(report.ok, true);
    assert.equal(report.legs.length, 4);
    assert.deepEqual(
        probes.map(p => [p.platform, p.version_build, p.version_name]),
        [
            ['ios', '20.0.95', 'builtin'],
            ['ios', '20.0.95', '1.100.8'],
            ['android', '1.37.65', 'builtin'],
            ['android', '1.37.65', '1.100.8'],
        ]
    );
    for (const probe of probes) {
        assert.equal(probe.is_prod, true);
        assert.equal(probe.defaultChannel, '1.0.13');
        assert.equal(probe.device_id, SYNTHETIC_DEVICE_IDS[probe.platform]);
    }
});

test('catches the 2026-11 incident: iOS blocked by under-native downgrade, Android fine', async () => {
    const { fetchImpl } = fakeCapgo({
        devices,
        answer: body =>
            body.platform === 'ios'
                ? {
                      error: 'disable_auto_update_under_native',
                      message: 'Cannot downgrade under native version',
                  }
                : { version: '1.100.9' },
    });
    const report = await canary(fetchImpl);
    assert.equal(report.ok, false);
    const alert = formatCanaryAlert({
        report,
        label: 'LearnCard Production',
        appId: 'com.learncard.app',
        channel: '1.0.13',
        bundle: '1.100.9',
        runUrl: 'https://example.invalid/run',
    });
    assert.match(alert, /OTA update is not reaching users: LearnCard Production/);
    assert.match(
        alert,
        /iOS 20\.0\.95 \(fresh store install\): \*blocked\* `disable_auto_update_under_native`/
    );
    assert.ok(alert.includes(FIX_HINTS.disable_auto_update_under_native));
    assert.match(alert, /Working: Android 1\.37\.65/);
});

test('flags a channel serving a different bundle', async () => {
    const result = await probeUpdate({
        appId: 'com.learncard.app',
        channel: '1.0.13',
        platform: 'android',
        nativeVersion: '1.37.65',
        currentBundle: 'builtin',
        expectedBundle: '1.100.9',
        pluginVersion: '8.52.1',
        sleep: noSleep,
        fetchImpl: async () => json({ version: '1.100.8' }),
    });
    assert.equal(result.delivered, false);
    assert.equal(result.error, 'wrong_bundle');
});

test('fails (and alerts) when it cannot tell, instead of passing silently', async () => {
    const report = await canary(async url => {
        if (String(url).startsWith('https://api.capgo.app/device/')) return json({}, 500);
        return json({ version: '1.100.9' });
    });
    assert.equal(report.ok, false);
    assert.match(report.problems.join('\n'), /Could not read Capgo devices/);
});

test('native version overrides skip the device lookup', async () => {
    const report = await runCanary({
        appId: 'com.learncard.app',
        channel: '1.0.13',
        bundle: '1.100.9',
        pluginVersion: '8.52.1',
        nativeOverrides: { ios: '20.0.95', android: '1.37.65' },
        sleep: noSleep,
        fetchImpl: async url => {
            assert.equal(String(url), 'https://plugin.capgo.app/updates');
            return json({ version: '1.100.9' });
        },
    });
    assert.equal(report.ok, true);
});

test('identifies native publish jobs by platform', () => {
    assert.equal(
        nativePlatform('Publish Native Apps to App Stores / learn-card-app-production iOS Deploy'),
        'iOS'
    );
    assert.equal(
        nativePlatform(
            'Publish Native Apps to App Stores / learn-card-app-production Android Deploy'
        ),
        'Android'
    );
    assert.equal(nativePlatform('Deploy Frontend (LearnCard Production)'), null);
});

// Lines taken from the failed iOS jobs of releases 1.100.9, 1.100.6 and 1.100.3.
test('pulls the App Store reason out of real fastlane logs', () => {
    const waiting = extractReason(
        [
            '2026-11-04T04:21:47.6851510Z ERROR [2026-11-04 04:21:47.67]: \u001b[31m    155:\t      force: true,\u001b[0m',
            "2026-11-04T04:21:48.2120280Z ➡️  \u001b[33m[Deliver] reject_if_possible doesn't work when using submit_build. The app store version is in Waiting For Review.\u001b[0m",
            '2026-11-04T04:21:48.8583790Z ##[error]Process completed with exit code 1.',
        ].join('\n')
    );
    assert.match(waiting.line, /^➡️ {2}\[Deliver\] .*Waiting For Review\.$/);
    assert.match(waiting.hint, /still in App Review/);

    const invalid = extractReason(
        "2026-10-28T22:50:00.0000000Z Search query: appStoreVersions with id '48f2' is not in valid state. - This resource cannot be reviewed"
    );
    assert.match(invalid.line, /not in valid state/);

    const inProgress = extractReason(
        "2026-10-18T08:00:00.0000000Z /Users/runner/work/fastlane_core/ui/interface.rb:141:in `user_error!': [!] Cannot submit for review - A review submission is already in progress (FastlaneCore::Interface::FastlaneError)"
    );
    assert.match(inProgress.line, /^\[!\] Cannot submit for review/);
    assert.match(inProgress.hint, /still in App Review/);
});

test('native alert names the failed platform, its reason and what still shipped', () => {
    const alert = formatNativeAlert({
        publishResult: 'failure',
        frontendResult: 'success',
        version: '1.100.9',
        runUrl: 'https://example.invalid/run',
        jobs: [
            {
                platform: 'iOS',
                conclusion: 'failure',
                url: 'https://example.invalid/job',
                line: 'The app store version is in Waiting For Review.',
                hint: 'The previous iOS version is still in App Review.',
            },
            { platform: 'Android', conclusion: 'success' },
        ],
    });
    assert.match(alert, /Native store release did not go out for 1\.100\.9/);
    assert.match(alert, /\*iOS: failure\*/);
    assert.match(alert, /> The app store version is in Waiting For Review\./);
    assert.match(alert, /Published fine: Android\./);
});

test('native alert explains a skipped publish', () => {
    const alert = formatNativeAlert({
        publishResult: 'skipped',
        frontendResult: 'failure',
        jobs: [],
    });
    assert.match(alert, /skipped because the frontend deploy finished as `failure`/);
});

test('slack: posts to the channel and surfaces a missing bot membership', async () => {
    const calls = [];
    await postReleaseAlert({
        text: 'hello',
        token: 'xoxb-test',
        fetchImpl: async (url, init) => {
            calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
            return json({ ok: true });
        },
    });
    assert.deepEqual(calls[0].body.channel, '#release-owner');
    assert.equal(calls[0].auth, 'Bearer xoxb-test');

    await assert.rejects(
        postReleaseAlert({
            text: 'hi',
            token: 'xoxb-test',
            fetchImpl: async () => json({ ok: false, error: 'not_in_channel' }),
        }),
        /not_in_channel\. Invite the Slack bot to #release-owner/
    );
    await assert.rejects(postReleaseAlert({ text: 'hi', token: '' }), /SLACK_BOT_TOKEN is not set/);
});

test('prefers production native versions over newer dev/TestFlight builds', () => {
    assert.deepEqual(
        latestNativeVersions([
            { device_id: 'p', platform: 'ios', version_build: '20.0.95', is_prod: true },
            { device_id: 't', platform: 'ios', version_build: '20.0.99', is_prod: false },
            { device_id: 'x', platform: 'android', version_build: '1.37.70', is_prod: false },
        ]),
        { ios: '20.0.95', android: '1.37.70' }
    );
});

test('waits out Capgo cache: a leg that only flips after a re-probe is not an alert', async () => {
    const seen = { ios: 0, android: 0 };
    const sleeps = [];
    const { fetchImpl } = fakeCapgo({
        devices,
        answer: body => {
            seen[body.platform] += 1;
            // iOS keeps serving the previous bundle for the first two answers.
            return body.platform === 'ios' && seen.ios <= 2
                ? { version: '1.100.8' }
                : { version: '1.100.9' };
        },
    });
    const report = await runCanary({
        appId: 'com.learncard.app',
        channel: '1.0.13',
        bundle: '1.100.9',
        pluginVersion: '8.52.1',
        token: 'capgo-token',
        fetchImpl,
        sleep: async ms => sleeps.push(ms),
    });
    assert.equal(report.ok, true);
    assert.deepEqual(sleeps, [SETTLE_DELAYS_S[0] * 1000]);
    assert.equal(seen.android, 2, 'delivered legs are not probed again');
});

test('a persistent block is re-probed through every settle delay, then reported', async () => {
    const sleeps = [];
    const { fetchImpl } = fakeCapgo({
        devices,
        answer: body =>
            body.platform === 'ios'
                ? { error: 'disable_auto_update_under_native' }
                : { version: '1.100.9' },
    });
    const report = await runCanary({
        appId: 'com.learncard.app',
        channel: '1.0.13',
        bundle: '1.100.9',
        pluginVersion: '8.52.1',
        token: 'capgo-token',
        fetchImpl,
        sleep: async ms => sleeps.push(ms),
    });
    assert.equal(report.ok, false);
    assert.deepEqual(
        sleeps,
        SETTLE_DELAYS_S.map(s => s * 1000)
    );
});

test('retries a Capgo 5xx once instead of alerting', async () => {
    let calls = 0;
    const result = await probeUpdate({
        appId: 'com.learncard.app',
        channel: '1.0.13',
        platform: 'ios',
        nativeVersion: '20.0.95',
        currentBundle: 'builtin',
        expectedBundle: '1.100.9',
        pluginVersion: '8.52.1',
        sleep: noSleep,
        fetchImpl: async () => (++calls === 1 ? json({}, 503) : json({ version: '1.100.9' })),
    });
    assert.equal(result.delivered, true);
    assert.equal(calls, 2);
});

test('missing native version tells you to set the override on the environment', async () => {
    const report = await runCanary({
        appId: 'org.scoutpass.app',
        channel: '1.0.8',
        bundle: '1.2.3',
        pluginVersion: '8.52.1',
        token: 'capgo-token',
        overrideScope: 'the "scout-app-production" GitHub environment',
        sleep: noSleep,
        fetchImpl: fakeCapgo({ devices: [], answer: () => ({ version: '1.2.3' }) }).fetchImpl,
    });
    assert.equal(report.ok, false);
    assert.match(
        report.problems[0],
        /CAPGO_CANARY_NATIVE_IOS on the "scout-app-production" GitHub environment/
    );
});

test('slack text from logs and APIs is escaped and kept on one line', () => {
    assert.equal(escapeSlackText('a <b> & c\n  d'), 'a &lt;b&gt; &amp; c d');
    const alert = formatNativeAlert({
        publishResult: 'failure',
        frontendResult: 'success',
        jobs: [{ platform: 'iOS', conclusion: 'failure', line: 'bad <!channel> & stuff' }],
    });
    assert.match(alert, /> bad &lt;!channel&gt; &amp; stuff/);
    assert.doesNotMatch(alert, /<!channel>/);
});

test('falls back to the deploy-errors webhook with the reason the bot post failed', async () => {
    let sent;
    await postWebhookFallback({
        text: 'alert body',
        webhook: 'https://hooks.example.invalid/x',
        channel: '#release-owner',
        reason: 'not_in_channel',
        fetchImpl: async (url, init) => {
            sent = { url, body: JSON.parse(init.body) };
            return new Response('ok');
        },
    });
    assert.equal(sent.url, 'https://hooks.example.invalid/x');
    assert.match(
        sent.body.text,
        /^\[Could not post to #release-owner: not_in_channel\]\nalert body$/
    );
});

test("reports Gradle's cause and fastlane's final error when no App Store pattern matches", () => {
    const gradle = extractReason(
        [
            'FAILURE: Build failed with an exception.',
            '* What went wrong:',
            "Execution failed for task ':app:bundleRelease'.",
            '* Try:',
            "[!] Exit status of command './gradlew bundleRelease' was 1 instead of 0.",
        ].join('\n')
    );
    assert.equal(gradle.line, "Execution failed for task ':app:bundleRelease'.");

    const fastlane = extractReason(
        [
            'dist/assets/GenericErrorBoundary-a1b2c3.js  12.4 kB',
            "/x/interface.rb:141:in `user_error!': [!] first problem",
            "/x/interface.rb:141:in `user_error!': [!] The specified pre-release build could not be added",
        ].join('\n')
    );
    assert.equal(fastlane.line, '[!] The specified pre-release build could not be added');
});

test('alert says so when job details could not be read, and flags OTA when the frontend failed', () => {
    const alert = formatNativeAlert({
        publishResult: 'failure',
        frontendResult: 'failure',
        jobs: [],
        lookupError: 'GitHub API returned HTTP 502',
        environment: 'learn-card-app-production',
        version: '1.100.9',
    });
    assert.match(alert, /did not go out for 1\.100\.9 \(learn-card-app-production\)/);
    assert.match(alert, /Could not read the native job details \(GitHub API returned HTTP 502\)/);
    assert.doesNotMatch(alert, /No per-platform job failed/);
    assert.match(alert, /OTA \(Capgo\) bundle may not have gone out either/);
});

test('collects native jobs across pages and reads only failed logs', async () => {
    const filler = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Other job ${i}`,
        conclusion: 'success',
    }));
    const requested = [];
    const fetchImpl = async url => {
        const path = String(url).replace('https://api.github.com', '');
        requested.push(path);
        if (path.includes('/jobs?') && path.endsWith('page=1')) return json({ jobs: filler });
        if (path.includes('/jobs?') && path.endsWith('page=2')) {
            return json({
                jobs: [
                    {
                        id: 901,
                        name: 'Publish Native Apps to App Stores / learn-card-app-production iOS Deploy',
                        conclusion: 'failure',
                        html_url: 'https://example.invalid/901',
                    },
                    {
                        id: 902,
                        name: 'Publish Native Apps to App Stores / learn-card-app-production Android Deploy',
                        conclusion: 'success',
                    },
                ],
            });
        }
        if (path === '/repos/o/r/actions/jobs/901/logs') {
            return new Response(
                '2026-11-04T04:21:48.2Z [Deliver] The app store version is in Waiting For Review.'
            );
        }
        throw new Error(`unexpected ${path}`);
    };
    const jobs = await collectNativeJobs({
        repo: 'o/r',
        runId: '1',
        attempt: '2',
        token: 't',
        fetchImpl,
    });
    assert.deepEqual(
        jobs.map(job => [job.platform, job.conclusion]),
        [
            ['iOS', 'failure'],
            ['Android', 'success'],
        ]
    );
    assert.match(jobs[0].line, /Waiting For Review/);
    assert.ok(requested[0].includes('/runs/1/attempts/2/jobs'));
    assert.ok(!requested.some(path => path.endsWith('/902/logs')));
});

test('an App Store Connect reason still outranks a Gradle cause in the same log', () => {
    const reason = extractReason(
        [
            '* What went wrong:',
            "Execution failed for task ':app:bundleRelease'.",
            '[Deliver] The app store version is in Waiting For Review.',
        ].join('\n')
    );
    assert.match(reason.line, /Waiting For Review/);
});

test('with a successful frontend, the native alert defers to the canary instead of claiming OTA is fine', () => {
    const alert = formatNativeAlert({
        publishResult: 'failure',
        frontendResult: 'success',
        jobs: [{ platform: 'iOS', conclusion: 'failure' }],
    });
    assert.match(
        alert,
        /OTA \(Capgo\) upload succeeded; if users still are not getting it, see the OTA canary alert/
    );
    assert.doesNotMatch(alert, /bundles went out/);
});
