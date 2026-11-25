#!/usr/bin/env node
/**
 * Capgo OTA delivery canary.
 *
 * After CI uploads a bundle and points a channel at it, ask Capgo's update
 * endpoint (the same request a phone makes on launch) whether real devices
 * would receive it. Probes iOS and Android, each as a device still on the
 * bundle shipped inside the store build ("builtin") and as a device already on
 * the previous OTA bundle. Every probe must be offered exactly the new bundle.
 *
 * This catches channel problems that a successful upload does not, e.g.
 * "Disable auto downgrade under native" (iOS store builds are 20.0.x, above
 * our 1.100.x bundles), a platform switched off, or the channel pointing at a
 * different bundle.
 *
 * Env:
 *   CAPGO_TOKEN            API key, used only to read the device list.
 *   CAPGO_APP_ID           e.g. com.learncard.app
 *   CAPGO_CHANNEL          channel the bundle was published to
 *   BUNDLE_VERSION         bundle that was just published
 *   APP_PACKAGE_JSON       app package.json (for the @capgo/capacitor-updater version)
 *   APP_LABEL              human label for alerts, e.g. "LearnCard Production"
 *   CANARY_NATIVE_IOS      optional native version override (skips device lookup)
 *   CANARY_NATIVE_ANDROID  optional native version override
 *   CANARY_ALERT_FILE      where to write the Slack message when the canary fails
 *   RUN_URL                link to this workflow run
 *
 * Exit code 1 means users may not be getting the bundle (or the canary could
 * not tell). The workflow step is continue-on-error and alerts on that outcome.
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { escapeSlackText } from './slack.mjs';

export const PROBE_URL = 'https://plugin.capgo.app/updates';
export const DEVICE_URL = 'https://api.capgo.app/device/';
export const PLATFORMS = ['ios', 'android'];

/**
 * Fixed synthetic device ids, one per platform, so repeated probes count as one
 * device each in Capgo stats instead of a new device per deploy.
 */
export const SYNTHETIC_DEVICE_IDS = {
    ios: '00000000-0000-4000-8000-0000000ca1a1',
    android: '00000000-0000-4000-8000-0000000ca1a2',
};

const PLATFORM_LABEL = { ios: 'iOS', android: 'Android' };
const MAX_DEVICE_PAGES = 20;
const REQUEST_TIMEOUT_MS = 15_000;

/** What to do about each Capgo refusal code, for the alert. */
export const FIX_HINTS = {
    disable_auto_update_under_native:
        'Channel has "Disable auto downgrade under native" on. Turn it off (CI passes --downgrade on channel set).',
    disabled_platform_ios: 'Channel has iOS updates switched off. Enable iOS on the channel.',
    disabled_platform_android:
        'Channel has Android updates switched off. Enable Android on the channel.',
    disable_prod_build: 'Channel blocks production builds. Enable "prod" on the channel.',
    disable_device: 'Channel blocks physical devices. Enable "device" on the channel.',
    no_channel:
        'No channel resolved for this device. Check the channel exists and is self-assignable.',
    wrong_bundle:
        'Channel serves a different bundle than the one just uploaded. Check "Set CapGo Channel".',
};

/** Parse the leading `major.minor.patch` of a version string. */
export const parseSemver = version => {
    const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version ?? '').trim());
    return match ? match.slice(1, 4).map(Number) : null;
};

export const compareSemver = (a, b) => {
    const [pa, pb] = [parseSemver(a), parseSemver(b)];
    for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pa[i] - pb[i];
    return 0;
};

/** The bundle a device would be on right before this release, or null for x.y.0. */
export const previousPatch = version => {
    const parsed = parseSemver(version);
    if (!parsed || parsed[2] === 0) return null;
    return `${parsed[0]}.${parsed[1]}.${parsed[2] - 1}`;
};

/**
 * Newest native (store build) version seen per platform. Emulators and the
 * canary's own synthetic devices are ignored. Production builds win over
 * dev/TestFlight builds, which are only used when a platform has no prod device.
 */
export const latestNativeVersions = devices => {
    const synthetic = new Set(Object.values(SYNTHETIC_DEVICE_IDS));
    const prod = {};
    const any = {};
    for (const device of devices) {
        const platform = String(device?.platform ?? '').toLowerCase();
        const native = device?.version_build;
        if (
            !PLATFORMS.includes(platform) ||
            device?.is_emulator ||
            synthetic.has(device?.device_id)
        )
            continue;
        if (!parseSemver(native)) continue;
        for (const latest of device?.is_prod === false ? [any] : [any, prod]) {
            if (!latest[platform] || compareSemver(native, latest[platform]) > 0)
                latest[platform] = native;
        }
    }
    return { ...any, ...prod };
};

/**
 * Seconds to wait before re-probing legs that were not delivered. Capgo caches
 * channel answers (about 60s, with a later replica re-purge), so right after
 * "Set CapGo Channel" a probe can still see the previous bundle. Only the final
 * answer of each leg counts. About 3.5 minutes in total, and only spent when
 * something looks wrong.
 */
export const SETTLE_DELAYS_S = [15, 30, 60, 105];

const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = (fetchImpl, url, init) =>
    fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

const isRetryable = response => response.status === 429 || response.status >= 500;

/**
 * Retry once on a network error, timeout, 429 or 5xx: a single blip in Capgo's
 * API should not page the release owner.
 */
const withRetry = async (fn, sleep = defaultSleep) => {
    try {
        const response = await fn();
        if (!isRetryable(response)) return response;
    } catch {
        // fall through to the single retry
    }
    await sleep(3_000);
    return fn();
};

/** Page through Capgo's device list (public API, cursor pagination). */
export const fetchDevices = async ({ appId, token, fetchImpl = fetch, sleep = defaultSleep }) => {
    if (!token) throw new Error('CAPGO_TOKEN is not set; cannot read the device list.');
    const devices = [];
    let cursor;
    for (let page = 0; page < MAX_DEVICE_PAGES; page += 1) {
        const url = new URL(DEVICE_URL);
        url.searchParams.set('app_id', appId);
        if (cursor) url.searchParams.set('cursor', cursor);
        const response = await withRetry(
            () => fetchWithTimeout(fetchImpl, url, { headers: { authorization: token } }),
            sleep
        );
        if (!response.ok) throw new Error(`Capgo device list returned HTTP ${response.status}`);
        const body = await response.json();
        const rows = Array.isArray(body) ? body : (body?.data ?? []);
        devices.push(...rows);
        cursor = body?.nextCursor;
        if (Array.isArray(body) || !body?.hasMore || !cursor) break;
    }
    return devices;
};

/**
 * Ask Capgo's update endpoint what a device would be offered. Mirrors the
 * request @capgo/capacitor-updater sends (and `capgo probe` in the CLI).
 * @returns {{ delivered: boolean, offered?: string, error?: string, message?: string }}
 */
export const probeUpdate = async ({
    appId,
    channel,
    platform,
    nativeVersion,
    currentBundle,
    expectedBundle,
    pluginVersion,
    fetchImpl = fetch,
    sleep = defaultSleep,
}) => {
    const response = await withRetry(
        () =>
            fetchWithTimeout(fetchImpl, PROBE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', capgo_api: '2025-10-01' },
                body: JSON.stringify({
                    app_id: appId,
                    device_id: SYNTHETIC_DEVICE_IDS[platform],
                    version_name: currentBundle,
                    version_build: nativeVersion,
                    is_emulator: false,
                    is_prod: true,
                    platform,
                    plugin_version: pluginVersion,
                    defaultChannel: channel,
                }),
            }),
        sleep
    );
    const body = await response.json().catch(() => ({}));
    if (body?.error) return { delivered: false, error: body.error, message: body.message };
    if (!response.ok) return { delivered: false, error: `http_${response.status}` };
    if (body?.version !== expectedBundle) {
        return {
            delivered: false,
            offered: body?.version,
            error: 'wrong_bundle',
            message: `Channel offers ${body?.version ?? 'nothing'} instead of ${expectedBundle}.`,
        };
    }
    return { delivered: true, offered: body.version };
};

/**
 * Run every probe, re-probing undelivered legs while Capgo's cache settles.
 * Returns one result per leg plus problems that stopped a leg from running.
 */
export const runCanary = async ({
    appId,
    channel,
    bundle,
    pluginVersion,
    nativeOverrides = {},
    token,
    fetchImpl = fetch,
    sleep = defaultSleep,
    settleDelaysS = SETTLE_DELAYS_S,
    overrideScope = 'the GitHub environment of this deploy leg',
}) => {
    const problems = [];
    let native = { ...nativeOverrides };
    const missing = PLATFORMS.filter(platform => !native[platform]);
    if (missing.length) {
        try {
            native = {
                ...latestNativeVersions(await fetchDevices({ appId, token, fetchImpl, sleep })),
                ...native,
            };
        } catch (error) {
            problems.push(`Could not read Capgo devices to find native versions: ${error.message}`);
        }
    }

    const legs = [];
    for (const platform of PLATFORMS) {
        if (!native[platform]) {
            problems.push(
                `No ${PLATFORM_LABEL[platform]} native version found; set CAPGO_CANARY_NATIVE_${platform.toUpperCase()} on ${overrideScope} (not repo-wide: native versions differ per app).`
            );
            continue;
        }
        legs.push({
            platform,
            nativeVersion: native[platform],
            from: 'builtin',
            label: 'fresh store install',
        });
        const previous = previousPatch(bundle);
        if (previous)
            legs.push({
                platform,
                nativeVersion: native[platform],
                from: previous,
                label: `on ${previous}`,
            });
    }

    const probe = async leg => {
        try {
            return await probeUpdate({
                appId,
                channel,
                platform: leg.platform,
                nativeVersion: leg.nativeVersion,
                currentBundle: leg.from,
                expectedBundle: bundle,
                pluginVersion,
                fetchImpl,
                sleep,
            });
        } catch (error) {
            return { delivered: false, error: 'probe_failed', message: error.message };
        }
    };

    const results = new Map();
    for (const leg of legs) results.set(leg, await probe(leg));
    for (const delay of settleDelaysS) {
        const pending = legs.filter(leg => !results.get(leg).delivered);
        if (!pending.length) break;
        await sleep(delay * 1_000);
        for (const leg of pending) results.set(leg, await probe(leg));
    }

    const settled = legs.map(leg => ({ ...leg, ...results.get(leg) }));
    return {
        legs: settled,
        problems,
        ok: problems.length === 0 && settled.every(leg => leg.delivered),
    };
};

const describeLeg = leg => {
    const who = `${PLATFORM_LABEL[leg.platform]} ${leg.nativeVersion} (${leg.label})`;
    if (leg.delivered) return `${who}: gets ${escapeSlackText(leg.offered)}`;
    const detail = [leg.error && `\`${escapeSlackText(leg.error)}\``, escapeSlackText(leg.message)]
        .filter(Boolean)
        .join(': ');
    return `${who}: *blocked* ${detail}`;
};

/** Slack message for a failed canary. */
export const formatAlert = ({ report, label, appId, channel, bundle, runUrl }) => {
    const lines = [
        `:rotating_light: *OTA update is not reaching users: ${label}*`,
        `Bundle \`${bundle}\` on Capgo channel \`${channel}\` (\`${appId}\`).`,
        '',
        ...report.legs.filter(leg => !leg.delivered).map(leg => `• ${describeLeg(leg)}`),
        ...report.problems.map(problem => `• ${escapeSlackText(problem)}`),
    ];
    const hints = [...new Set(report.legs.map(leg => FIX_HINTS[leg.error]).filter(Boolean))];
    if (hints.length) lines.push('', '*Likely fix*', ...hints.map(hint => `• ${hint}`));
    const working = report.legs.filter(leg => leg.delivered);
    if (working.length) lines.push('', `Working: ${working.map(describeLeg).join('; ')}.`);
    if (runUrl) lines.push('', `<${runUrl}|Deploy run>`);
    return lines.join('\n');
};

/** Markdown for the job summary. */
export const formatSummary = ({ report, label, channel, bundle }) =>
    [
        `### Capgo OTA canary: ${label}`,
        `Bundle \`${bundle}\` on channel \`${channel}\`: ${report.ok ? 'delivered on every probe' : '**NOT delivered**'}`,
        '',
        '| Platform | Native | Starting from | Result |',
        '| --- | --- | --- | --- |',
        ...report.legs.map(
            leg =>
                `| ${PLATFORM_LABEL[leg.platform]} | ${leg.nativeVersion} | ${leg.from} | ${
                    leg.delivered ? `gets ${leg.offered}` : `blocked: ${leg.error ?? 'unknown'}`
                } |`
        ),
        ...report.problems.map(problem => `\n- ${problem}`),
        '',
    ].join('\n');

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
    const env = process.env;
    const label = env.APP_LABEL || env.CAPGO_APP_ID;
    const context = {
        label,
        appId: env.CAPGO_APP_ID,
        channel: env.CAPGO_CHANNEL,
        bundle: env.BUNDLE_VERSION,
        runUrl: env.RUN_URL,
    };
    let report;
    try {
        for (const name of [
            'CAPGO_APP_ID',
            'CAPGO_CHANNEL',
            'BUNDLE_VERSION',
            'APP_PACKAGE_JSON',
        ]) {
            if (!env[name]) throw new Error(`${name} is not set.`);
        }
        const pkg = JSON.parse(readFileSync(env.APP_PACKAGE_JSON, 'utf8'));
        const pluginVersion = parseSemver(pkg.dependencies?.['@capgo/capacitor-updater'])?.join(
            '.'
        );
        if (!pluginVersion) throw new Error('Could not read the @capgo/capacitor-updater version.');
        report = await runCanary({
            overrideScope: env.CANARY_GH_ENVIRONMENT
                ? `the "${env.CANARY_GH_ENVIRONMENT}" GitHub environment`
                : undefined,
            appId: env.CAPGO_APP_ID,
            channel: env.CAPGO_CHANNEL,
            bundle: env.BUNDLE_VERSION,
            pluginVersion,
            token: env.CAPGO_TOKEN,
            nativeOverrides: {
                ...(env.CANARY_NATIVE_IOS ? { ios: env.CANARY_NATIVE_IOS } : {}),
                ...(env.CANARY_NATIVE_ANDROID ? { android: env.CANARY_NATIVE_ANDROID } : {}),
            },
        });
    } catch (error) {
        report = { legs: [], problems: [`Canary could not run: ${error.message}`], ok: false };
    }

    const summary = formatSummary({ report, ...context });
    console.log(summary);
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
    if (!report.ok) {
        if (env.CANARY_ALERT_FILE)
            writeFileSync(env.CANARY_ALERT_FILE, formatAlert({ report, ...context }));
        console.log('::error::Capgo canary: the new bundle is not deliverable to every platform.');
        process.exit(1);
    }
}
