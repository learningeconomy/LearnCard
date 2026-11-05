#!/usr/bin/env node
/**
 * Explain why a release's native App Store / Play Store publish did not succeed.
 *
 * Runs in deploy.yml when `publish-native-apps` finished with anything other
 * than success (failure, skipped, cancelled). Reads this run's jobs, finds the
 * per-platform native jobs, pulls the most telling line from each failed job's
 * log, and writes a Slack message for the release owner.
 *
 * Env:
 *   GH_TOKEN             token with actions:read for this repo
 *   GITHUB_REPOSITORY    owner/repo
 *   GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT
 *   PUBLISH_RESULT       needs.publish-native-apps.result
 *   FRONTEND_RESULT      needs.deploy-frontend.result
 *   APP_VERSION          learn-card-app package version being released
 *   RUN_URL              link to this workflow run
 *   ALERT_FILE           where to write the Slack message
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { escapeSlackText } from './slack.mjs';

const NATIVE_JOB_PREFIX = 'Publish Native Apps to App Stores';

/**
 * Log patterns ordered from most to least specific. The first pattern with a
 * matching line wins, so a known App Store Connect failure is reported ahead
 * of fastlane's generic error lines. `last` takes the final match (fastlane
 * repeats its user error; the last one is the one that stopped the lane).
 * `skip` drops build noise such as bundle file names containing "Error".
 */
export const REASON_PATTERNS = [
    {
        pattern: /waiting for review|review submission is already in progress/i,
        hint: 'The previous iOS version is still in App Review. In App Store Connect remove it from review, attach the newest build to the version, and submit.',
    },
    {
        pattern: /not in valid state|cannot be reviewed/i,
        hint: 'App Store Connect would not accept the version for review (usually a previous submission is still in flight). Check the version in App Store Connect.',
    },
    // xcodebuild / xcpretty compile errors.
    { pattern: /^❌\s|(^|\s)error: / },
    { pattern: /google api error|the caller does not have permission/i },
    { pattern: /\[!\]/, last: true },
    {
        pattern: /error/i,
        last: true,
        skip: /\.(js|css|map|swift|kt|java|m|h)\b|^Compiling |^ERROR \[[^\]]*\]:\s*(=>\s*)?(\d+:|```)/,
    },
];

/** Gradle prints its cause on the lines after "* What went wrong:". */
const gradleCause = lines => {
    const at = lines.findIndex(line => line.startsWith('* What went wrong:'));
    if (at < 0) return undefined;
    return lines.slice(at + 1, at + 4).find(line => line && !line.startsWith('*'));
};

/** Strip the Actions timestamp prefix and ANSI colour codes from a log line. */
export const cleanLogLine = line =>
    line
        .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s?/, '')
        // eslint-disable-next-line no-control-regex
        .replace(/\u001b\[[0-9;]*m|\^\[\[[0-9;]*m/g, '')
        .trim();

/** Most informative failure line in a job log, with a fix hint when known. */
export const extractReason = log => {
    const lines = String(log ?? '')
        .split('\n')
        .map(cleanLogLine)
        .filter(line => line && !line.startsWith('##[') && !/^from \//.test(line));
    for (const [index, { pattern, hint, last, skip }] of REASON_PATTERNS.entries()) {
        // Gradle's cause outranks the generic patterns but not App Store Connect ones.
        if (index === 2) {
            const cause = gradleCause(lines);
            if (cause) return { line: cause.slice(0, 300), hint: undefined };
        }
        const hits = lines.filter(line => pattern.test(line) && !skip?.test(line));
        const line = last ? hits.at(-1) : hits[0];
        if (!line) continue;
        // fastlane prefixes user errors with the Ruby source path; keep the message.
        const bang = line.indexOf('[!] ');
        return { line: (bang > 0 ? line.slice(bang) : line).slice(0, 300), hint };
    }
    return { line: undefined, hint: undefined };
};

/** Platform of a native publish job, from its name. */
export const nativePlatform = name => {
    if (!String(name).startsWith(NATIVE_JOB_PREFIX)) return null;
    if (/\biOS Deploy\b/.test(name)) return 'iOS';
    if (/\bAndroid Deploy\b/.test(name)) return 'Android';
    return null;
};

const api = async (path, { token, fetchImpl = fetch, text = false }) => {
    const response = await fetchImpl(`https://api.github.com${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
    if (!response.ok) throw new Error(`GitHub API ${path} returned HTTP ${response.status}`);
    return text ? response.text() : response.json();
};

/** Native publish jobs of this run attempt, with a reason for each that failed. */
export const collectNativeJobs = async ({ repo, runId, attempt, token, fetchImpl = fetch }) => {
    const jobs = [];
    for (let page = 1; page <= 10; page += 1) {
        const body = await api(
            `/repos/${repo}/actions/runs/${runId}/attempts/${attempt}/jobs?per_page=100&page=${page}`,
            { token, fetchImpl }
        );
        jobs.push(...(body.jobs ?? []));
        if ((body.jobs ?? []).length < 100) break;
    }
    const native = [];
    for (const job of jobs) {
        const platform = nativePlatform(job.name);
        if (!platform) continue;
        const entry = { platform, conclusion: job.conclusion ?? job.status, url: job.html_url };
        if (job.conclusion === 'failure') {
            try {
                Object.assign(
                    entry,
                    extractReason(
                        await api(`/repos/${repo}/actions/jobs/${job.id}/logs`, {
                            token,
                            fetchImpl,
                            text: true,
                        })
                    )
                );
            } catch (error) {
                entry.line = `(could not read the job log: ${error.message})`;
            }
        }
        native.push(entry);
    }
    return native;
};

/** Slack message for a native publish that did not succeed. */
export const formatAlert = ({
    publishResult,
    frontendResult,
    jobs,
    version,
    environment,
    runUrl,
    lookupError,
}) => {
    const release = [version && `for ${version}`, environment && `(${environment})`]
        .filter(Boolean)
        .join(' ');
    const lines = [
        `:rotating_light: *Native store release did not go out${release ? ` ${release}` : ''}*`,
    ];

    if (publishResult === 'skipped') {
        lines.push(
            `The App Store / Play Store publish was skipped because the frontend deploy finished as \`${frontendResult}\`. Neither store got a new build.`
        );
    } else if (publishResult === 'cancelled') {
        lines.push('The App Store / Play Store publish was cancelled before it finished.');
    }

    const failed = jobs.filter(job => job.conclusion !== 'success');
    for (const job of failed) {
        lines.push(
            '',
            `*${job.platform}: ${job.conclusion}*${job.url ? ` (<${job.url}|job>)` : ''}`
        );
        if (job.line) lines.push(`> ${escapeSlackText(job.line)}`);
        if (job.hint) lines.push(`Fix: ${job.hint}`);
    }
    const shipped = jobs.filter(job => job.conclusion === 'success').map(job => job.platform);
    if (shipped.length) lines.push('', `Published fine: ${shipped.join(', ')}.`);
    if (lookupError) {
        lines.push(
            '',
            `Could not read the native job details (${escapeSlackText(lookupError)}); open the run to see which platform failed and why.`
        );
    } else if (!failed.length && publishResult === 'failure') {
        lines.push('', 'No per-platform job failed; check the run for the failing step.');
    }
    lines.push(
        '',
        frontendResult === 'success'
            ? 'OTA (Capgo) bundles went out, but users keep the old native app until the store release is fixed.'
            : `The frontend deploy finished as \`${frontendResult}\`, so the OTA (Capgo) bundle may not have gone out either; check the run.`
    );
    if (runUrl) lines.push(`<${runUrl}|Deploy run>`);
    return lines.join('\n');
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
    const env = process.env;
    let jobs = [];
    let lookupError;
    try {
        jobs = await collectNativeJobs({
            repo: env.GITHUB_REPOSITORY,
            runId: env.GITHUB_RUN_ID,
            attempt: env.GITHUB_RUN_ATTEMPT || '1',
            token: env.GH_TOKEN,
        });
    } catch (error) {
        lookupError = error.message;
        console.log(`::warning::Could not read native job details: ${error.message}`);
    }
    const message = formatAlert({
        publishResult: env.PUBLISH_RESULT,
        frontendResult: env.FRONTEND_RESULT,
        jobs,
        version: env.APP_VERSION,
        environment: env.TARGET_ENV,
        runUrl: env.RUN_URL,
        lookupError,
    });
    console.log(message);
    writeFileSync(env.ALERT_FILE, message);
}
