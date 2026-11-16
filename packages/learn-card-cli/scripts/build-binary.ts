/**
 * Compiles the bundled CLI into standalone executables that need no Node.js install.
 *
 * Run `bun run build` first; this wraps the same `dist/index.js` that is published to npm.
 *
 *   bun scripts/build-binary.ts            # this machine's platform only
 *   bun scripts/build-binary.ts --all      # every supported platform (downloads Bun runtimes)
 *
 * Output: dist-bin/learncard-<os>-<arch>
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGETS = ['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64'] as const;

type Target = (typeof TARGETS)[number];

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outdir = resolve(packageRoot, 'dist-bin');

const hostTarget = (): Target => {
    const host = `${process.platform}-${process.arch}`;

    if (!(TARGETS as readonly string[]).includes(host)) {
        throw new Error(`No standalone build for ${host}. Supported: ${TARGETS.join(', ')}`);
    }

    return host as Target;
};

const run = async (): Promise<void> => {
    if (!existsSync(resolve(packageRoot, 'dist/index.js'))) {
        throw new Error('dist/index.js not found. Run `bun run build` first.');
    }

    const targets = process.argv.includes('--all') ? TARGETS : [hostTarget()];

    await mkdir(outdir, { recursive: true });

    for (const target of targets) {
        const outfile = resolve(outdir, `learncard-${target}`);

        execFileSync(
            'bun',
            [
                'build',
                resolve(packageRoot, 'scripts/binary-entry.ts'),
                '--compile',
                `--target=bun-${target}`,
                '--outfile',
                outfile,
            ],
            { stdio: ['ignore', 'ignore', 'inherit'] }
        );

        console.log(outfile);
    }
};

await run();
