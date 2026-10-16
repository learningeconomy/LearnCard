import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { APP_ROOT, REPO_ROOT, STACK } from '../constants';
import { expect } from '../expect';
import type { FeatureDefinition } from '../types';

const SNIPPET = join(REPO_ROOT, 'docs/snippets/quickstart/send.mjs');
/**
 * Localized copies must live inside the repo so `@learncard/init` resolves from its
 * node_modules (gitignored; removed after each run). The only edit is the network host.
 */
const SCRATCH = join(APP_ROOT, 'scripts/verification/.scratch');

export const docsFeature: FeatureDefinition = {
    id: 'docs',
    title: 'Docs quickstart code (byte-checked against the page) runs against the local network',
    surface: 'docs',
    entries: ['docs-snippets-in-sync', 'docs-quickstart-send', 'docs-quickstart-received'],
    run: async context => {
        // docs-snippets-in-sync: the Markdown embeds exactly the files this journey executes.
        const sync = spawnSync(
            process.execPath,
            [join(REPO_ROOT, 'scripts/check-docs-snippets.mjs')],
            {
                cwd: REPO_ROOT,
                encoding: 'utf8',
            }
        );
        expect(sync.status, sync.stderr).toBe(0);
        expect(sync.stdout).toMatch(/all in sync/);

        // docs-quickstart-send: run the page's send.mjs with only the network host localized.
        const source = await readFile(SNIPPET, 'utf8');
        expect(source).toContain('network: true');
        const localized = source.split('network: true').join(`network: '${STACK.brain}'`);
        const runDirectory = join(SCRATCH, `quickstart-${randomBytes(4).toString('hex')}`);
        await mkdir(runDirectory, { recursive: true, mode: 0o700 });
        const recipient = await context.sdk(context.actors.recipient);
        try {
            const script = join(runDirectory, 'send.mjs');
            await writeFile(script, localized, { mode: 0o600 });
            const run = spawnSync(
                process.execPath,
                ['--conditions=development', script, context.actors.recipient.profileId],
                {
                    cwd: runDirectory,
                    encoding: 'utf8',
                    timeout: 180_000,
                    env: {
                        PATH: process.env.PATH,
                        HOME: process.env.HOME,
                        SECURE_SEED: randomBytes(32).toString('hex'),
                        PROFILE_ID: `docs-qs-${randomBytes(3).toString('hex')}`,
                    } as unknown as NodeJS.ProcessEnv,
                }
            );
            await context.record('docs-quickstart-run', {
                status: run.status,
                stdout: run.stdout,
                stderr: run.stderr.slice(-4000),
            });
            expect(run.status, run.stderr).toBe(0);
            // A profile-ID recipient already uses LearnCard, so the page promises direct delivery.
            expect(run.stdout).toContain('Delivered.');
            expect(run.stdout).toMatch(
                /Reusable template for this badge: lc:network:localhost%3A4000/
            );

            // docs-quickstart-received: the recipient's wallet really has "Quickstart Complete".
            const incoming = await recipient.invoke.getIncomingCredentials();
            const credentials = await Promise.all(
                incoming.map(item => recipient.read.get(item.uri).catch(() => undefined))
            );
            expect(JSON.stringify(credentials)).toContain('Quickstart Complete');
            return {
                entries: [
                    'docs-snippets-in-sync',
                    'docs-quickstart-send',
                    'docs-quickstart-received',
                ],
                observations: {
                    snippet: 'docs/snippets/quickstart/send.mjs',
                    page: 'docs/quick-start/your-first-integration.md',
                    localizedEdit: `network: true → network: '${STACK.brain}'`,
                    stdout: run.stdout.trim(),
                    recipientProfileId: context.actors.recipient.profileId,
                },
            };
        } finally {
            await rm(runDirectory, { recursive: true, force: true });
        }
    },
};
