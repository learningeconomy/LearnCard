#!/usr/bin/env npx tsx

import { getLogger } from 'learn-card-base/src/logging/logger';
const log = getLogger();

/**
 * bump-default-capgo-channel.ts
 *
 * Bump the Capgo OTA channel in `apps/learn-card-app/capacitor.config.ts`.
 *
 * The `defaultChannel` value in that file is the SINGLE SOURCE OF TRUTH:
 *   - CI reads it via `tools/capgo/getCapgoChannel.js` to pick the channel
 *     OTA bundles are uploaded to.
 *   - `npx cap sync` propagates it into iOS/Android `capacitor.config.json`,
 *     so installed binaries listen on the same channel CI uploads to.
 *
 * Bump this ONLY when you make a backwards-INcompatible native change
 * (new/removed Capacitor or Capgo plugin, native source edits, plugin
 * major version bump that changes its native API surface). Bumping the
 * channel fragments installed binaries off OTA updates until users update
 * via the App / Play store, so do NOT bump for routine JS-only releases.
 *
 * Usage:
 *   pnpm lc bump-default-capgo-channel              # interactive prompt with sensible default
 *   pnpm lc bump-default-capgo-channel 1.0.7        # explicit value
 *
 * Direct invocation:
 *   npx tsx apps/learn-card-app/scripts/bump-default-capgo-channel.ts [newChannel]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const CONFIG_PATH = resolve(APP_ROOT, 'capacitor.config.ts');

const bold = (s: string): string => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string): string => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string): string => `\x1b[36m${s}\x1b[0m`;
const red = (s: string): string => `\x1b[31m${s}\x1b[0m`;

const VERSION_RE = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;

interface ChannelMatch {
    content: string;
    channel: string;
    valueStart: number;
    valueEnd: number;
}

const readDefaultChannel = (): ChannelMatch => {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    const re = /(defaultChannel\s*:\s*['"])([^'"]+)(['"])/;
    const match = re.exec(content);

    if (!match || match.index === undefined) {
        log.error(red(`❌ Could not find "defaultChannel" in ${CONFIG_PATH}`));
        process.exit(1);
    }

    const valueStart = match.index + match[1].length;
    const valueEnd = valueStart + match[2].length;

    return { content, channel: match[2], valueStart, valueEnd };
};

const writeDefaultChannel = (current: ChannelMatch, newChannel: string): void => {
    const next =
        current.content.slice(0, current.valueStart) +
        newChannel +
        current.content.slice(current.valueEnd);

    writeFileSync(CONFIG_PATH, next, 'utf-8');
};

const compareSemver = (a: string, b: string): number => {
    const parse = (v: string): number[] =>
        v
            .split('-')[0]
            .split('.')
            .map(p => Number.parseInt(p, 10));

    const aParts = parse(a);
    const bParts = parse(b);
    const len = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < len; i++) {
        const ap = aParts[i] ?? 0;
        const bp = bParts[i] ?? 0;

        if (ap !== bp) return ap - bp;
    }

    return 0;
};

const suggestNext = (current: string): string | undefined => {
    const m = current.match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!m) return undefined;

    return `${m[1]}.${m[2]}.${Number.parseInt(m[3], 10) + 1}`;
};

const main = async (): Promise<void> => {
    const explicit = process.argv.slice(2).find(a => !a.startsWith('-'));
    const current = readDefaultChannel();

    log.info('');
    log.info(bold('🚦 Capgo channel bump'));
    log.info('');
    log.info(`  Current ${cyan('defaultChannel')}: ${cyan(current.channel)}`);
    log.info(dim(`  File: ${CONFIG_PATH}`));
    log.info('');
    log.info(yellow('  ⚠️  Bumping the channel fragments installed binaries off OTA updates.'));
    log.info(
        yellow('     Only bump for backwards-INcompatible native changes (new / removed plugins,')
    );
    log.info(yellow('     native source edits, plugin major-version upgrades).'));
    log.info('');

    let next: string;

    if (explicit) {
        next = explicit;
    } else {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const ask = (q: string): Promise<string> =>
            new Promise(res => rl.question(q, ans => res(ans.trim())));

        const suggested = suggestNext(current.channel);
        const prompt = suggested
            ? `  New channel ${dim(`(default: ${suggested})`)}: `
            : '  New channel: ';

        const answer = await ask(prompt);

        rl.close();
        next = answer || (suggested ?? '');
    }

    if (!next) {
        log.error(red('❌ No channel value provided.'));
        process.exit(1);
    }

    if (!VERSION_RE.test(next)) {
        log.error(red(`❌ "${next}" is not a valid version (expected e.g. 1.0.7).`));
        process.exit(1);
    }

    if (next === current.channel) {
        log.info(yellow(`⚠️  "${next}" matches the current channel — nothing to do.`));
        process.exit(0);
    }

    if (compareSemver(next, current.channel) <= 0) {
        log.error(
            red(`❌ "${next}" is not greater than the current channel "${current.channel}".`)
        );
        log.error(red('   Refusing to downgrade. Capgo channels must move forward.'));
        process.exit(1);
    }

    writeDefaultChannel(current, next);

    log.info('');
    log.info(green(`✅ Bumped defaultChannel: ${current.channel} → ${next}`));
    log.info('');
    log.info(bold('  Next steps:'));
    log.info(`  ${dim('1.')} Stage:   ${cyan('git add apps/learn-card-app/capacitor.config.ts')}`);
    log.info(
        `  ${dim('2.')} Commit:  ${cyan(
            `git commit -m "chore(capgo): bump default channel to ${next}"`
        )}`
    );
    log.info(`  ${dim('3.')} Push & open / update your PR.`);
    log.info('');
    log.info(dim('  CI will upload OTA bundles to the new channel; the next native binary'));
    log.info(dim(`  release in the App / Play stores will pick up channel ${next}.`));
    log.info('');
};

main().catch(err => {
    log.error(red('Unexpected error:'), err);
    process.exit(1);
});
