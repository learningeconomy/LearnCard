import type { StagingState, StagingOutput } from './contracts';
/** Owns only fresh disposable staging identities. No Firebase users, personal seeds, or notifications. */
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { initLearnCard } from '@learncard/init';
import { prepareFixtureById } from '@learncard/credential-library';
import { canonicalJSON, installStagingFetch, staging } from './staging';

installStagingFetch();
const here = dirname(fileURLToPath(import.meta.url));
const resources = resolve(here, '../ios/NativeCore/Sources/LearnCardNativeSDK/Resources');
const generated = resolve(here, 'generated');
const statePath = resolve(generated, 'staging-state.json');
const wasm = await readFile(
    resolve(here, '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm')
);
const wallet = (seed: string) =>
    initLearnCard({
        seed,
        didkit: wasm,
        network: staging.network,
        trustedBoostRegistry: '',
        cloud: { url: staging.cloud },
        allowRemoteContexts: false,
    });
const persist = (state: StagingState) =>
    writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
const assert = (ok: unknown, label: string): void => {
    if (!ok) throw new Error(label);
};

const prepare = async (): Promise<void> => {
    await mkdir(generated, { recursive: true });
    try {
        await readFile(statePath);
        throw new Error(
            'A previous staging run still needs cleanup. Run staging-account.ts cleanup first.'
        );
    } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
    for (const endpoint of [staging.network, staging.cloud]) {
        const response = await fetch(`${endpoint}/utilities.healthCheck`);
        assert(
            response.ok,
            `Staging health check failed: ${new URL(endpoint).host} (${response.status})`
        );
    }
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const state: StagingState = {
        environment: 'staging',
        expiresAt: Date.now() + 20 * 60_000,
        issuerSeed: randomBytes(32).toString('hex'),
        holderSeed: randomBytes(32).toString('hex'),
        issuerProfileId: `native-lab-${suffix}-issuer`,
        holderProfileId: `native-lab-${suffix}-holder`,
        recordId: `native-lab-${suffix}`,
    };
    // Persist before creating anything so partial setup can always clean up its own identities.
    await persist(state);
    const issuer = await wallet(state.issuerSeed);
    const holder = await wallet(state.holderSeed);
    await issuer.invoke.createProfile({
        profileId: state.issuerProfileId,
        displayName: 'Native Lab Test Issuer',
        isPrivate: true,
    });
    await holder.invoke.createProfile({
        profileId: state.holderProfileId,
        displayName: 'Native Lab Test Recipient',
        isPrivate: true,
    });
    const signing = await initLearnCard({ seed: state.holderSeed, didkit: wasm });
    state.holderSigningDid = signing.id.did();
    state.holderProfileDid = holder.id.did();
    const unsigned = prepareFixtureById('obv3/minimal-badge', {
        issuerDid: issuer.id.did(),
        subjectDid: holder.id.did(),
    });
    state.incomingCredential = await issuer.invoke.issueCredential(unsigned);
    state.incomingUri = await issuer.invoke.sendCredential(
        state.holderProfileId,
        state.incomingCredential
    );
    state.outgoingUnsigned = prepareFixtureById('obv3/minimal-badge', {
        issuerDid: holder.id.did(),
        subjectDid: issuer.id.did(),
    });
    await persist(state);
    // Only the holder's disposable test seed goes into the local, ignored simulator test bundle.
    const { issuerSeed: _unused, ...nativeInput } = state;
    await writeFile(resolve(resources, 'live-vectors.json'), JSON.stringify(nativeInput), {
        mode: 0o600,
    });
    await build({
        entryPoints: [resolve(here, 'live-runtime.ts')],
        outfile: resolve(resources, 'live-sdk.js'),
        bundle: true,
        minify: true,
        format: 'iife',
        platform: 'browser',
        target: ['safari18'],
        conditions: ['development', 'browser'],
        alias: { '@learncard/didkit-plugin-node': resolve(here, 'node-unavailable.ts') },
        logLevel: 'warning',
    });
    console.log(
        'Prepared two private disposable staging profiles and one encrypted credential offer.'
    );
};

const verify = async (attachments: string): Promise<void> => {
    const state = JSON.parse(await readFile(statePath, 'utf8')) as StagingState;
    const files = await readdir(attachments);
    const outputs: StagingOutput[] = [];
    for (const file of files.filter(name => name.endsWith('.json'))) {
        try {
            const value = JSON.parse(await readFile(resolve(attachments, file), 'utf8'));
            if (value.exchange) outputs.push(value);
        } catch {
            /* Other XCTest metadata. */
        }
    }
    assert(outputs.length === 1, 'Missing or duplicate native staging output');
    const output = outputs[0];
    for (const key of ['existingProfileMatches', 'signingDidMatches', 'profileDidMatches'])
        assert(output.initialization[key] === true, `Native profile check failed: ${key}`);
    for (const [key, value] of Object.entries(output.exchange)) {
        if (!['outgoingUri', 'outgoingCredential'].includes(key))
            assert(value === true, `Native exchange check failed: ${key}`);
    }
    const issuer = await wallet(state.issuerSeed);
    const holder = await wallet(state.holderSeed);
    await issuer.invoke.getProfile();
    await holder.invoke.getProfile();
    const returned = await issuer.read.get(output.exchange.outgoingUri);
    const verified = await issuer.invoke.verifyCredential(returned, { checks: ['proof'] });
    assert(verified.errors.length === 0, 'Current SDK could not verify native-signed credential');
    assert(
        canonicalJSON(returned) === canonicalJSON(output.exchange.outgoingCredential),
        'Native → SDK payload changed'
    );
    const pending = await issuer.invoke.getIncomingCredentials();
    assert(
        pending.some(item => item.uri === output.exchange.outgoingUri),
        'Native send did not reach staging recipient'
    );
    const records = await holder.index.LearnCloud.get({ id: state.recordId });
    assert(
        records.some(item => item.uri === state.incomingUri),
        'Current SDK could not read native LearnCloud index'
    );
    const claimed = await holder.read.get(state.incomingUri);
    assert(
        canonicalJSON(claimed) === canonicalJSON(state.incomingCredential),
        'Current SDK could not decrypt claimed credential'
    );
    state.outgoingUri = output.exchange.outgoingUri;
    await persist(state);
    const summary = {
        measuredAt: new Date().toISOString(),
        environment: 'staging',
        endpoints: staging,
        identity: 'two fresh private DID-authenticated profiles; no Firebase sign-in',
        nativeChecks: Object.fromEntries(
            Object.entries(output.exchange).filter(([, v]) => typeof v === 'boolean')
        ),
        profileChecks: Object.fromEntries(
            Object.entries(output.initialization).filter(([, value]) => typeof value === 'boolean')
        ),
        currentSDK: {
            nativeSignatureVerified: true,
            nativePayloadUnchanged: true,
            nativeSendReceived: true,
            nativeIndexReadable: true,
            claimedPayloadUnchanged: true,
        },
        firebaseAccountRecoveryValidated: false,
    };
    await writeFile(resolve(generated, 'staging-results.json'), JSON.stringify(summary, null, 2));
    console.log('Staging exchange verified independently by the current SDK.');
};

const cleanup = async (): Promise<void> => {
    let state: StagingState;
    try {
        state = JSON.parse(await readFile(statePath, 'utf8'));
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return;
        throw error;
    }
    assert(state.environment === 'staging', 'Refused cleanup for another environment');
    const errors: string[] = [];
    const profiles: Awaited<ReturnType<typeof wallet>>[] = [];
    for (const role of ['holder', 'issuer'] as const) {
        try {
            const lc = await wallet(state[`${role}Seed`]);
            const profile = await lc.invoke.getProfile();
            if (!profile) continue;
            assert(
                profile.profileId === state[`${role}ProfileId`],
                'Refused cleanup for an unexpected profile'
            );
            if (role === 'holder') {
                const records = await lc.index.LearnCloud.get({ id: state.recordId });
                if (records.length)
                    assert(
                        await lc.index.LearnCloud.remove(state.recordId),
                        'Index removal returned false'
                    );
            }
            // Query own sent records so cleanup also covers a native send interrupted before export.
            for (const item of await lc.invoke.getSentCredentials())
                assert(
                    await lc.invoke.deleteCredential(item.uri),
                    'Sent record removal returned false'
                );
            profiles.push(lc);
        } catch (error) {
            errors.push(`${role}: ${error instanceof Error ? error.message : 'request failed'}`);
        }
    }
    // Keep recipients present until both senders' records have been removed.
    if (!errors.length) {
        for (const lc of profiles) {
            try {
                assert(await lc.invoke.deleteProfile(), 'Staging profile deletion returned false');
            } catch (error) {
                errors.push(error instanceof Error ? error.message : 'Profile deletion failed');
            }
        }
    }
    await rm(resolve(resources, 'live-vectors.json'), { force: true });
    if (errors.length)
        throw new Error(
            `Staging cleanup incomplete for ${errors.join(', ')}; retained ignored state for retry.`
        );
    await rm(statePath);
    const path = resolve(generated, 'staging-results.json');
    try {
        const summary = JSON.parse(await readFile(path, 'utf8'));
        summary.cleanup = 'private profiles, sent credentials, and test collection index removed';
        await writeFile(path, JSON.stringify(summary, null, 2));
    } catch {
        /* Setup may have failed before verification. */
    }
    console.log(
        'Removed disposable staging profiles, sent credentials, and test collection index.'
    );
};

try {
    switch (process.argv[2]) {
        case 'prepare':
            await prepare();
            break;
        case 'verify':
            assert(process.argv[3], 'Pass the exported attachment directory');
            await verify(process.argv[3]!);
            break;
        case 'cleanup':
            await cleanup();
            break;
        default:
            throw new Error('Use prepare, verify <attachments>, or cleanup');
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : 'Staging test failed');
    process.exitCode = 1;
}
