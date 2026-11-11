import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { APP_ROOT, REPO_ROOT } from '../constants';
import { expect } from '../expect';
import type { FeatureDefinition } from '../types';

const SNIPPET = join(REPO_ROOT, 'docs/snippets/quickstart/send.mjs');
/**
 * Localized copies must live inside the repo so `@learncard/init` resolves from its
 * node_modules (gitignored; removed after each run). Only Brain and LearnCloud are localized.
 */
const SCRATCH = join(APP_ROOT, 'scripts/verification/.scratch');

export const docsFeature: FeatureDefinition = {
    id: 'docs',
    title: 'Docs quickstart code (byte-checked against the page) runs against the local network',
    surface: 'docs',
    entries: ['docs-snippets-in-sync', 'docs-quickstart-send', 'docs-quickstart-received'],
    run: async context => {
        await context.step(null, 'docs-snippets-in-sync', async () => {
            const sync = spawnSync(
                process.execPath,
                [join(REPO_ROOT, 'scripts/check-docs-snippets.mjs')],
                { cwd: REPO_ROOT, encoding: 'utf8' }
            );
            expect(sync.status, sync.stderr).toBe(0);
            expect(sync.stdout).toMatch(/all in sync/);
        });

        const source = await readFile(SNIPPET, 'utf8');
        const initialization = 'initLearnCard({ seed: process.env.SECURE_SEED, network: true })';
        expect(source.split(initialization)).toHaveLength(2);
        const localized = source.replace(
            initialization,
            `initLearnCard({ seed: process.env.SECURE_SEED, network: ${JSON.stringify(context.stack.brain)}, cloud: { url: ${JSON.stringify(context.stack.cloud)} } })`
        );
        const runDirectory = join(SCRATCH, `quickstart-${randomBytes(4).toString('hex')}`);
        await mkdir(runDirectory, { recursive: true, mode: 0o700 });
        const recipient = await context.sdk(context.actors.recipient);
        try {
            const run = await context.step(null, 'docs-quickstart-send', async () => {
                const script = join(runDirectory, 'send.mjs');
                await writeFile(script, localized, { mode: 0o600 });
                const run = spawnSync(
                    process.execPath,
                    [
                        ...(process.versions.bun ? ['--no-env-file'] : []),
                        '--conditions=development',
                        script,
                        context.actors.recipient.profileId,
                    ],
                    {
                        cwd: runDirectory,
                        encoding: 'utf8',
                        timeout: 180_000,
                        env: {
                            NODE_ENV: 'development',
                            PATH: process.env.PATH,
                            HOME: runDirectory,
                            SECURE_SEED: randomBytes(32).toString('hex'),
                            PROFILE_ID: `docs-qs-${randomBytes(3).toString('hex')}`,
                        },
                    }
                );
                await context.record('docs-quickstart-run', {
                    status: run.status,
                    stdout: run.stdout,
                    stderr: run.stderr.slice(-4000),
                });
                expect(run.status, run.stderr).toBe(0);
                expect(run.stdout).toContain('Delivered.');
                expect(run.stdout).toContain(
                    `Reusable template for this badge: lc:network:${encodeURIComponent(new URL(context.stack.brain).host)}/trpc:`
                );
                return run;
            });

            await context.step(null, 'docs-quickstart-received', async () => {
                const incoming = await recipient.invoke.getIncomingCredentials();
                const credentials = await Promise.all(
                    incoming.map(item => recipient.read.get(item.uri))
                );
                expect(JSON.stringify(credentials)).toContain('Quickstart Complete');
            });
            return {
                observations: {
                    snippet: 'docs/snippets/quickstart/send.mjs',
                    page: 'docs/quick-start/your-first-integration.md',
                    localizedEdit: { network: context.stack.brain, cloud: context.stack.cloud },
                    stdout: run.stdout.trim(),
                    recipientProfileId: context.actors.recipient.profileId,
                },
            };
        } finally {
            await rm(runDirectory, { recursive: true, force: true });
        }
    },
};
