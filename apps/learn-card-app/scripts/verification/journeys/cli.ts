import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { STACK } from '../constants';
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
                )
            );
        const recipient = await context.sdk(context.actors.recipient);
        const badge = `CLI verify ${randomBytes(3).toString('hex')}`;

        // cli-send: a brand-new issuer (the CLI writes its own seed to workdir/.env) sends a badge.
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
        // Proof it went to the owned network, not production.
        expect(sent.credentialUri).toMatch(/^lc:network:localhost%3A4000\/trpc:credential:/);

        // cli-recipient-claims: the recipient's own wallet sees it, accepts it, and reads it back.
        const incoming = await recipient.invoke.getIncomingCredentials();
        expect(incoming.map(item => item.uri)).toContain(sent.credentialUri);
        await recipient.invoke.acceptCredential(sent.credentialUri);
        const credential = (await recipient.read.get(sent.credentialUri)) as Record<
            string,
            unknown
        >;
        expect(JSON.stringify(credential)).toContain(badge);

        // cli-status: the issuer's CLI reports the claim for the same activity.
        const status = await cli(['status', sent.activityId, '--json']);
        expect(status.exitCode, status.stderr).toBe(0);
        const claim = status.json as { state: string; credentialUri: string };
        expect(claim.state).toBe('CLAIMED');
        expect(claim.credentialUri).toBe(sent.credentialUri);

        // cli-verify: the CLI verifies the credential the recipient actually holds.
        const credentialFile = join(context.artifactsDir, 'received-credential.json');
        await writeFile(credentialFile, JSON.stringify(credential, null, 2), { mode: 0o600 });
        const verify = await cli(['verify', credentialFile, '--json']);
        expect(verify.exitCode, verify.stderr).toBe(0);
        // `verify --json` prints the raw verification result (not a one-line envelope).
        const verification = JSON.parse(verify.stdout) as { checks: string[]; errors: string[] };
        expect(verification.errors).toEqual([]);
        expect(verification.checks).toContain('proof');

        return {
            entries: ['cli-send', 'cli-recipient-claims', 'cli-status', 'cli-verify'],
            observations: {
                network: STACK.brain,
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
