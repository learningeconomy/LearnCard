/** Local-only manual QA driver. Never runs the E2E harness or clears databases. */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { initLearnCard } from '@learncard/init';
import { prepareFixtureById, buildFinalTranscriptVariant } from '@learncard/credential-library';
import type { UnsignedVC, VC } from '@learncard/types';

interface QaState {
    seed: string;
    issuerProfileId: string;
    holderProfileId: string;
    unsigned?: UnsignedVC;
    refreshId?: string;
    signed?: VC;
    sentUri?: string;
    finalSigned?: VC;
}

const main = async (): Promise<void> => {
    const [command, holderProfileId] = process.argv.slice(2);
    if (command === '--help' || !command) {
        console.log(
            'Usage: bun --conditions=development tests/e2e/scripts/credential-refresh-qa.ts <send|publish|status> <holder-profile-id>'
        );
        return;
    }
    if (
        !['send', 'publish', 'status'].includes(command) ||
        !holderProfileId ||
        !/^[a-zA-Z0-9_-]+$/.test(holderProfileId)
    ) {
        throw new Error(
            'Provide send, publish, or status and a local holder profile ID (letters, numbers, hyphens, underscores).'
        );
    }
    const directory = fileURLToPath(new URL('../../../.credential-refresh-qa/', import.meta.url));
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const path = join(directory, `${holderProfileId}.json`);
    let state: QaState;
    try {
        state = JSON.parse(await readFile(path, 'utf8')) as QaState;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || command !== 'send') throw error;
        state = {
            seed: randomBytes(32).toString('hex'),
            issuerProfileId: `refresh-qa-${randomBytes(6).toString('hex')}`,
            holderProfileId,
        };
    }
    const save = async (): Promise<void> => {
        await writeFile(`${path}.tmp`, JSON.stringify(state, null, 2), { mode: 0o600 });
        await rename(`${path}.tmp`, path);
    };
    if (state.holderProfileId !== holderProfileId)
        throw new Error('Saved holder does not match requested holder.');
    // Persist the random issuer before any network writes so retries reuse its identity.
    await save();
    const issuer = await initLearnCard({
        seed: state.seed,
        didkit: readFile(
            require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
        ),
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
    });
    if (!(await issuer.invoke.getProfile())) {
        if (command !== 'send')
            throw new Error(
                'Local issuer missing. The database may have been reset; use a fresh QA state file.'
            );
        await issuer.invoke.createProfile({
            profileId: state.issuerProfileId,
            displayName: 'Credential Refresh QA Registrar',
        });
    }
    const holderDid = `did:web:localhost%3A4000:users:${holderProfileId}`;
    const holder = await issuer.invoke.getProfile(holderProfileId);
    if (!holder || holder.did !== holderDid)
        throw new Error('Holder not found on the local network. Sign into the local app first.');
    if (command === 'send') {
        if (!state.unsigned) {
            state.unsigned = prepareFixtureById('clr/provisional-transcript', {
                issuerDid: issuer.id.did(),
                subjectDid: holderDid,
            });
            await save();
        }
        if (!state.refreshId) {
            const allocation = await issuer.invoke.allocateCredentialRefresh({
                holder: { profileId: holderProfileId, did: holderDid },
                credentialId: state.unsigned.id as string,
            });
            state.refreshId = allocation.refreshId;
            state.unsigned.refreshService = allocation.refreshService;
            await save();
        }
        if (!state.signed) {
            state.signed = await issuer.invoke.issueCredential(state.unsigned);
            await save();
        }
        if (!state.sentUri) {
            state.sentUri = await issuer.invoke.sendRefreshableCredential(
                state.refreshId,
                state.signed
            );
            await save();
        }
        console.log('Provisional transcript sent. Claim it in the local app before publishing.');
    }
    if (command === 'publish') {
        if (!state.sentUri || !state.refreshId || !state.unsigned)
            throw new Error('Run send and claim the provisional transcript first.');
        if (!state.finalSigned) {
            state.finalSigned = await issuer.invoke.issueCredential(
                buildFinalTranscriptVariant(state.unsigned, { validFrom: new Date().toISOString() })
            );
            await save();
        }
        const publication = await issuer.invoke.publishCredentialRefresh({
            mode: 'issuer-signed',
            refreshId: state.refreshId,
            signedCredential: state.finalSigned,
            updateSummary: 'Final grades posted',
            notifyHolder: true,
            idempotencyKey: 'local-qa-final-v2',
        });
        console.log(JSON.stringify(publication, null, 2));
    }
    console.log(
        JSON.stringify(
            {
                issuerProfileId: state.issuerProfileId,
                holderDid,
                refreshId: state.refreshId,
                sentUri: state.sentUri,
            },
            null,
            2
        )
    );
    if (command === 'status' && state.refreshId) {
        console.log(
            JSON.stringify(
                await issuer.invoke.getCredentialRefreshHistory({
                    refreshId: state.refreshId,
                    limit: 10,
                }),
                null,
                2
            )
        );
    }
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error instanceof Error ? error.message : 'Local QA command failed');
        process.exit(1);
    });
