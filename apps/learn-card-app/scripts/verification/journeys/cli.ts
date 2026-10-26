import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { expect } from '../expect';
import { runLearnCardCli } from '../learncard-cli';
import type { FeatureDefinition } from '../types';

interface SendResult {
    ok: boolean;
    status: string;
    profileId: string;
    activityId: string;
    credentialUri: string;
    templateUri: string;
}

export const cliFeature: FeatureDefinition = {
    id: 'cli',
    title: '`learncard` CLI from checkout source: send, claim, status, verify',
    surface: 'cli',
    entries: ['cli-send', 'cli-recipient-claims', 'cli-status', 'cli-verify'],
    run: async context => {
        const workdir = join(context.artifactsDir, 'cli-issuer');
        let calls = 0;
        const cli = (args: string[]) =>
            runLearnCardCli(
                args,
                workdir,
                join(
                    context.artifactsDir,
                    `cli-${String(++calls).padStart(2, '0')}-${args[0]}.json`
                ),
                context.stack
            );
        const recipient = await context.sdk(context.actors.recipient);
        const badge = `CLI verify ${randomBytes(3).toString('hex')}`;

        const sent = await context.step(null, 'cli-send', async () => {
            const send = await cli([
                'send',
                context.actors.recipient.profileId,
                '--yes',
                '--json',
                '--name',
                'CLI Verifier',
                '--badge',
                badge,
            ]);
            expect(send.exitCode, send.stderr).toBe(0);
            const sent = send.json as SendResult;
            expect(sent.ok).toBe(true);
            expect(sent.status).toBe('ISSUED');
            expect(sent.credentialUri).toContain(
                `lc:network:${encodeURIComponent(new URL(context.stack.brain).host)}/trpc:credential:`
            );
            return sent;
        });

        const credential = await context.step(null, 'cli-recipient-claims', async () => {
            const incoming = await recipient.invoke.getIncomingCredentials();
            expect(incoming.map(item => item.uri)).toContain(sent.credentialUri);
            await recipient.invoke.acceptCredential(sent.credentialUri);
            const credential = await recipient.read.get(sent.credentialUri);
            expect(JSON.stringify(credential)).toContain(badge);
            return credential;
        });

        const status = await context.step(null, 'cli-status', async () => {
            const status = await cli(['status', sent.activityId, '--json']);
            expect(status.exitCode, status.stderr).toBe(0);
            const claim = status.json as { state: string; credentialUri: string };
            expect(claim.state).toBe('CLAIMED');
            expect(claim.credentialUri).toBe(sent.credentialUri);
            return status;
        });

        const verification = await context.step(null, 'cli-verify', async () => {
            const credentialFile = join(context.artifactsDir, 'received-credential.json');
            await writeFile(credentialFile, JSON.stringify(credential, null, 2), { mode: 0o600 });
            const verify = await cli(['verify', credentialFile, '--json']);
            expect(verify.exitCode, verify.stderr).toBe(0);
            // The actual CLI verifies the received credential inside its confined child process.
            const result = JSON.parse(verify.stdout) as { checks: string[]; errors: string[] };
            expect(result.errors).toEqual([]);
            expect(result.checks).toContain('proof');
            return result;
        });

        return {
            observations: {
                network: context.stack.brain,
                issuerProfileId: sent.profileId,
                recipientProfileId: context.actors.recipient.profileId,
                badge,
                credentialUri: sent.credentialUri,
                status: status.json,
                verification,
            },
        };
    },
};
