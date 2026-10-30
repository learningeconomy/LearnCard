const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { appendFileSync, readFileSync } = require('node:fs');
const { arch, platform } = require('node:os');
const { dirname, resolve } = require('node:path');

// Skip only known prose/release-note locations. All code, shared packages,
// tooling, assets and unknown paths run the full suite, without needing Nx installed.
const isProse = path =>
    ['README.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'LICENSE'].includes(path) ||
    /^docs\/.+\.md$/.test(path) ||
    /^\.changeset\/[^/]+\.md$/.test(path);

const decideEligibility = ({ eventName, baseSha, headSha, cwd = process.cwd() }) => {
    if (eventName === 'workflow_dispatch') return { run: true, reason: 'manual-dispatch' };
    if (eventName !== 'pull_request') return { run: true, reason: 'unknown-event' };
    if (![baseSha, headSha].every(sha => /^[a-f0-9]{40,64}$/i.test(sha ?? ''))) {
        return { run: true, reason: 'missing-comparison' };
    }

    // Three-dot compares the PR's changes since its merge base, not unrelated
    // base-branch commits. Disabling rename detection includes BOTH old/new paths.
    const diff = spawnSync(
        'git',
        ['diff', '--name-only', '--no-renames', '-z', `${baseSha}...${headSha}`, '--'],
        { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
    );
    if (diff.error || diff.status !== 0) return { run: true, reason: 'comparison-unavailable' };
    const paths = diff.stdout.split('\0').filter(Boolean);
    if (paths.length === 0) return { run: true, reason: 'empty-comparison' };
    return paths.every(isProse)
        ? { run: false, reason: 'prose-only' }
        : { run: true, reason: 'code-config-or-unknown-path' };
};

const browserCacheKey = ({ version, manifest, osRelease, hostPlatform, hostArch }) => {
    const firefox = JSON.parse(manifest).browsers.find(browser => browser.name === 'firefox');
    if (!firefox?.revision || !version || !osRelease || !hostPlatform || !hostArch) {
        throw new Error('Incomplete Playwright browser cache identity');
    }
    const hash = value => createHash('sha256').update(value).digest('hex');
    // The full manifest also covers FFmpeg and platform-specific revision overrides.
    return `mock-firefox-v1-${hostPlatform}-${hostArch}-${hash(osRelease)}-${version}-${firefox.revision}-${hash(manifest)}`;
};

const main = () => {
    let outputs;
    if (process.argv[2] === 'eligibility') {
        const result = decideEligibility({
            eventName: process.env.GITHUB_EVENT_NAME,
            baseSha: process.env.BASE_SHA,
            headSha: process.env.HEAD_SHA,
        });
        outputs = { run_e2e: String(result.run), reason: result.reason };
    } else if (process.argv[2] === 'browser-cache-key') {
        const app = resolve('apps/learn-card-app');
        const playwright = require.resolve('playwright/package.json', { paths: [app] });
        const core = dirname(
            require.resolve('playwright-core/package.json', { paths: [dirname(playwright)] })
        );
        outputs = {
            key: browserCacheKey({
                version: JSON.parse(readFileSync(resolve(core, 'package.json'), 'utf8')).version,
                manifest: readFileSync(resolve(core, 'browsers.json'), 'utf8'),
                osRelease: readFileSync('/etc/os-release', 'utf8'),
                hostPlatform: platform(),
                hostArch: arch(),
            }),
        };
    } else {
        throw new Error('Expected eligibility or browser-cache-key');
    }
    for (const [name, value] of Object.entries(outputs)) {
        console.log(`${name}=${value}`);
        if (process.env.GITHUB_OUTPUT)
            appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
    }
};

if (require.main === module) main();
module.exports = { decideEligibility, browserCacheKey };
