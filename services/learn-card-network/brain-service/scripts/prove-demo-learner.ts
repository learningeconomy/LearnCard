#!/usr/bin/env bun
/**
 * Headless learner wallet for the EducationOS MVP walkthrough. A real LearnCard wallet
 * (seed-derived keys) on the local network, so issuance can encrypt to it and the learner
 * side of the flow can be proven without the app UI. It does not exercise the app's screens.
 *
 *   bun run prove:demo-learner -- --register   # create the `demo-learner` profile
 *   bun run prove:demo-learner -- --claim      # accept, decrypt and verify the credential
 *
 * Standalone wallet: does not import Brain's database environment.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { VCValidator } from '@learncard/types';

const network = process.env.LCN_NETWORK ?? 'http://localhost:4000/trpc';
const profileId = process.env.DEMO_LEARNER_PROFILE_ID ?? 'demo-learner';
// Dev-only fixed seed so the learner identity is stable across runs.
const seed = process.env.DEMO_LEARNER_SEED ?? 'd'.repeat(64);
const expectedIssuer = `did:web:localhost%3A4000:users:${process.env.DEMO_ISSUER_PROFILE_ID ?? 'demo-district-issuer'}`;

const log = (message: string): void => console.log(`${new Date().toISOString()} ${message}`);

const main = async (): Promise<void> => {
    const { initLearnCard } = await import('@learncard/init');
    const require = createRequire(import.meta.url);
    const didkit = await readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
    );
    const wallet = await initLearnCard({ seed, network, didkit });

    if (process.argv.includes('--register')) {
        const existing = await wallet.invoke.getProfile();
        if (!existing) {
            await wallet.invoke.createProfile({
                profileId,
                displayName: 'Demo Learner',
                shortBio: 'EducationOS demo learner (dev fixture)',
                bio: '',
            });
        }
        log(`LEARNER ${profileId} key=${wallet.id.did()} (${existing ? 'exists' : 'registered'})`);
        return;
    }

    if (!process.argv.includes('--claim')) throw new Error('Pass --register or --claim.');

    const incoming = await wallet.invoke.getIncomingCredentials();
    const pending = incoming.filter(entry => entry.metadata?.educationOsRecordId);
    log(`INCOMING ${incoming.length} credential(s), ${pending.length} from Platform Issuance`);
    const offer = pending.at(-1);
    if (!offer) throw new Error('No Platform Issuance credential is waiting for this learner.');

    await wallet.invoke.acceptCredential(offer.uri);
    log('ACCEPTED credential into the wallet');

    // The stored credential is a JWE encrypted to the learner; read() decrypts it.
    const vc = VCValidator.parse(await wallet.read.get(offer.uri));
    const issuer = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer.id;
    const subject = z
        .object({ id: z.string() })
        .parse(
            Array.isArray(vc.credentialSubject) ? vc.credentialSubject[0] : vc.credentialSubject
        );
    log(`DECRYPTED ${vc.type.join(',')} name="${String(vc.name ?? '')}"`);
    log(`ISSUER ${issuer} ${issuer === expectedIssuer ? '(district identity)' : '(UNEXPECTED)'}`);
    log(`SUBJECT ${subject.id}`);

    const verification = await wallet.invoke.verifyCredential(vc, {}, true);
    const failures = verification.filter(item => item.status === 'Failed');
    log(`VERIFY ${failures.length ? `FAILED: ${JSON.stringify(failures)}` : 'all checks passed'}`);
    if (issuer !== expectedIssuer || failures.length) process.exitCode = 1;
};

main().catch(error => {
    console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
