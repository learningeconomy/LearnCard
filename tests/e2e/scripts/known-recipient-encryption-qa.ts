/** Local manual QA only: real HTTP/SDK calls, random accounts, no database resets. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { JWEValidator } from '@learncard/types';
import { getBitstringStatusListEntries, getBitstringStatusListBit } from '@learncard/helpers';
import { getLearnCard, type LearnCard } from '../tests/helpers/learncard.helpers';
import { testUnsignedBoost } from '../tests/helpers/credential.helpers';

interface QaState {
    suffix: string;
    issuerSeed: string;
    holderSeed: string;
    newcomerSeed: string;
    token: string;
    configuration?: { publishableKey: string; listingId: string };
    pendingId?: string;
    lastSend?: { credentialUri: string; boostUri: string };
}

const base = 'http://localhost:4000/api';
const commands = [
    'setup',
    'send-profile',
    'send-did',
    'send-email',
    'claim-existing-email',
    'queue-before-signup',
    'finish-signup',
    'revoke-last',
];
const pass = (message: string): void => console.log(`PASS: ${message}`);

const main = async (): Promise<void> => {
    const command = process.argv[2];
    if (!command || command === '--help') {
        console.log(`Local QA commands: ${commands.join(', ')}`);
        console.log(
            'Set LC2201_QA_DIR to an empty private directory first. Run setup, then each scenario.'
        );
        return;
    }
    assert(commands.includes(command), 'Unknown command. Use --help.');
    assert(process.env.LC2201_QA_DIR, 'Set LC2201_QA_DIR first; see the PR testing instructions.');
    const directory = resolve(process.env.LC2201_QA_DIR);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const statePath = join(directory, 'accounts.json');
    const post = async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => {
        const response = await fetch(`${base}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(body),
        });
        assert(
            response.ok,
            `${endpoint}: HTTP ${response.status}: ${await response.clone().text()}`
        );
        return response.json() as Promise<T>;
    };
    const lastEmail = async (email: string) => {
        const response = await fetch(`${base}/test/last-delivery`);
        assert(
            response.ok,
            'Local test email capture unavailable. Use the QA Compose files, not production.'
        );
        const delivery = await response.json();
        assert.equal(
            delivery.contactMethod.value,
            email,
            'Another session sent an email; do not run tests concurrently.'
        );
        return delivery.templateModel;
    };
    let state: QaState;
    if (command === 'setup') {
        state = {
            suffix: randomBytes(5).toString('hex'),
            issuerSeed: randomBytes(32).toString('hex'),
            holderSeed: randomBytes(32).toString('hex'),
            newcomerSeed: randomBytes(32).toString('hex'),
            token: '',
        };
        // Never overwrite another session's identities, including after a partial setup.
        await writeFile(statePath, JSON.stringify(state), { mode: 0o600, flag: 'wx' });
        const issuer = await getLearnCard(state.issuerSeed);
        const holder = await getLearnCard(state.holderSeed);
        await issuer.invoke.createProfile({
            profileId: `qa-issuer-${state.suffix}`,
            displayName: 'QA Issuer',
        });
        await holder.invoke.createProfile({
            profileId: `qa-holder-${state.suffix}`,
            displayName: 'QA Holder',
        });
        const authority = await issuer.invoke.createSigningAuthority('qa-issuer');
        assert(authority, 'Signing service creation failed. Check the lca-api container logs.');
        assert(
            await issuer.invoke.registerSigningAuthority(
                authority.endpoint,
                authority.name,
                authority.did
            )
        );
        assert(
            await issuer.invoke.setPrimaryRegisteredSigningAuthority(
                authority.endpoint,
                authority.name
            )
        );
        const grant = await issuer.invoke.addAuthGrant({
            name: 'Local encryption QA',
            scope: 'boosts:write inbox:write',
        });
        state.token = await issuer.invoke.getAPITokenForAuthGrant(grant);
        await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
        pass(
            'Created separate issuer and holder accounts, a server signer, and a local API token.'
        );
        console.log(`Private test keys saved in ${statePath}. Do not share this file.`);
        return;
    }
    state = JSON.parse(await readFile(statePath, 'utf8')) as QaState;
    assert(
        state.token,
        'Setup did not finish. Start with a new empty LC2201_QA_DIR and rerun setup.'
    );
    const save = async (): Promise<void> => {
        await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
    };
    const issuer = await getLearnCard(state.issuerSeed);
    const holder = await getLearnCard(state.holderSeed);
    const holderId = `qa-holder-${state.suffix}`;
    const email = `qa-holder-${state.suffix}@example.com`;
    const newcomerEmail = `qa-newcomer-${state.suffix}@example.com`;
    const credential = structuredClone(testUnsignedBoost);
    credential.name = 'LC-2201 QA Badge';
    const verifyEmail = async (wallet: LearnCard, address: string): Promise<void> => {
        const methods = await wallet.invoke.getMyContactMethods();
        if (methods.some(method => method.value === address && method.isVerified)) return;
        await wallet.invoke.addContactMethod({ type: 'email', value: address });
        const captured = await lastEmail(address);
        assert(await wallet.invoke.verifyContactMethod(captured.verificationToken));
    };
    const inspect = async (wallet: LearnCard, uri: string, accept = true) => {
        const storageUrl = `${base}/storage/resolve?uri=${encodeURIComponent(uri)}`;
        const response = await fetch(storageUrl);
        assert(response.ok, `Storage returned HTTP ${response.status}`);
        const stored = JWEValidator.parse(await response.json());
        const vc = await wallet.read.get(uri);
        assert(
            vc && vc.name === credential.name && vc.proof,
            'Holder did not read the signed QA badge.'
        );
        assert.deepEqual(await issuer.read.get(uri), vc, 'Issuer could not read the same badge.');
        const brain = await getLearnCard('a');
        let brainCouldDecrypt = false;
        try {
            brainCouldDecrypt = Boolean(await brain.invoke.decryptDagJwe(stored));
        } catch {
            // Rejection is expected: the service seed is not an authorized reader.
        }
        assert.equal(brainCouldDecrypt, false, 'FAIL: the brain service seed decrypted the badge.');
        if (accept) assert(await wallet.invoke.acceptCredential(uri));
        assert(
            (await wallet.invoke.getReceivedCredentials()).some(record => record.uri === uri),
            'Accepted badge missing from network index.'
        );
        pass('Stored badge is encrypted; holder and issuer can read it; brain service cannot.');
        pass('Accepted badge appears in the holder’s received-credential list.');
        console.log(`Open this storage URL in your browser:\n${storageUrl}`);
        console.log('Expect ciphertext/recipients fields, not readable badge text.');
        return vc;
    };
    const inspectIncoming = async (): Promise<void> => {
        const incoming = await holder.invoke.getIncomingCredentials();
        assert.equal(
            incoming.length,
            1,
            'Expected one new badge. Run scenarios in order and do not run automated tests alongside them.'
        );
        await inspect(holder, incoming[0].uri);
    };
    const claim = async (address: string) => {
        if (!state.configuration) {
            const integrationId = await issuer.invoke.addIntegration({
                name: `QA ${state.suffix}`,
                whitelistedDomains: ['localhost:4000'],
            });
            const listingId = await issuer.invoke.createAppStoreListing(integrationId, {
                display_name: `QA ${state.suffix}`,
                tagline: 'Local encryption check',
                full_description: 'Disposable manual QA',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://example.com' }),
            });
            const listing = await issuer.invoke.getAppStoreListing(listingId);
            assert(listing.slug);
            const authority = await issuer.invoke.createSigningAuthority(
                'qa-app',
                `did:web:localhost%3A4000:app:${listing.slug}`
            );
            assert(authority);
            assert(
                await issuer.invoke.registerSigningAuthority(
                    authority.endpoint,
                    authority.name,
                    authority.did
                )
            );
            assert(
                await issuer.invoke.associateListingWithSigningAuthority(
                    listingId,
                    authority.endpoint,
                    authority.name,
                    authority.did,
                    true
                )
            );
            const integration = await issuer.invoke.getIntegration(integrationId);
            state.configuration = { listingId, publishableKey: integration.publishableKey };
            await save();
        }
        await post('/contact-methods/challenge', {
            type: 'email',
            value: address,
            configuration: state.configuration,
        });
        const captured = await lastEmail(address);
        const session = await post<{ sessionJwt: string }>('/contact-methods/session', {
            contactMethod: { type: 'email', value: address },
            otpChallenge: captured.verificationCode,
        });
        return post<{ status: string; inboxCredential: { id: string } }>(
            '/inbox/claim',
            { credential, configuration: state.configuration },
            session.sessionJwt
        );
    };
    if (command.startsWith('send-')) {
        if (command === 'send-email') await verifyEmail(holder, email);
        const recipient =
            command === 'send-profile'
                ? holderId
                : command === 'send-did'
                  ? `did:web:localhost%3A4000:users:${holderId}`
                  : email;
        const result = await post<{
            credentialUri?: string;
            uri: string;
            inbox?: { status: string };
        }>(
            '/send',
            {
                type: 'boost',
                recipient,
                template: { credential },
                options: { suppressDelivery: true },
            },
            state.token
        );
        pass(`Server sent a badge to ${recipient}.`);
        if (result.credentialUri) {
            assert(result.uri, 'Send response did not contain the badge template URI.');
            await inspect(holder, result.credentialUri);
            state.lastSend = { credentialUri: result.credentialUri, boostUri: result.uri };
            await save();
        } else {
            assert.equal(result.inbox?.status, 'ISSUED');
            pass('Email delivery is ISSUED, not waiting for signup. No real email was sent.');
            await inspectIncoming();
        }
    } else if (command === 'claim-existing-email') {
        await verifyEmail(holder, email);
        const result = await claim(email);
        assert.equal(result.status, 'ISSUED');
        pass('Partner-app claim immediately delivered to the existing account.');
        await inspectIncoming();
    } else if (command === 'queue-before-signup') {
        assert(
            !state.pendingId,
            'A pending badge already exists in this session. Continue with finish-signup.'
        );
        const result = await claim(newcomerEmail);
        assert.equal(result.status, 'PENDING');
        state.pendingId = result.inboxCredential.id;
        await save();
        pass('Badge is PENDING because the recipient has not created an account yet.');
        console.log('Next run finish-signup to create that account and collect the badge.');
    } else if (command === 'finish-signup') {
        assert(state.pendingId, 'Run queue-before-signup first.');
        const newcomer = await getLearnCard(state.newcomerSeed);
        await newcomer.invoke.createProfile({
            profileId: `qa-newcomer-${state.suffix}`,
            displayName: 'QA New Account',
        });
        await verifyEmail(newcomer, newcomerEmail);
        const result = await newcomer.invoke.finalizeInboxCredentials();
        assert.equal(result.claimed, 1);
        assert.equal(result.errors, 0);
        const delivery = result.deliveries.find(record => record.id === state.pendingId);
        assert(
            delivery && delivery.credential.name === credential.name && delivery.credential.proof
        );
        pass('New account collected one readable, signed badge; the SDK reported zero errors.');
        const received = await newcomer.invoke.getReceivedCredentials();
        assert.equal(received.length, 1);
        assert.deepEqual(await inspect(newcomer, received[0].uri, false), delivery.credential);
        const recovered = await newcomer.invoke.recoverInboxCredentials();
        assert.deepEqual(
            recovered.records.find(record => record.id === state.pendingId)?.credential,
            delivery.credential
        );
        assert.equal((await newcomer.invoke.finalizeInboxCredentials()).claimed, 0);
        assert.equal((await newcomer.invoke.getReceivedCredentials()).length, 1);
        pass('Recovery returns the same badge; repeating collection creates no duplicate.');
    } else if (command === 'revoke-last') {
        assert(state.lastSend, 'Run send-profile or send-did first.');
        const vc = await issuer.read.get(state.lastSend.credentialUri);
        assert(vc);
        const entry = getBitstringStatusListEntries(vc).find(
            item => item.statusPurpose === 'revocation'
        );
        assert(entry, 'Badge has no revocation entry.');
        const isRevoked = async (): Promise<boolean> => {
            const response = await fetch(entry.statusListCredential);
            assert(response.ok);
            const list = await response.json();
            const bits = gunzipSync(
                Buffer.from(list.credentialSubject.encodedList.slice(1), 'base64url')
            );
            return getBitstringStatusListBit(bits, Number(entry.statusListIndex));
        };
        assert.equal(
            await isRevoked(),
            false,
            'This badge was already revoked. Send another badge first.'
        );
        assert(
            await issuer.invoke.revokeBoostRecipient(
                state.lastSend.boostUri,
                holderId,
                state.lastSend.credentialUri
            )
        );
        assert.equal(await isRevoked(), true);
        pass('Badge changed from valid to revoked in its public status list.');
        console.log(`Public status-list URL:\n${entry.statusListCredential}`);
    }
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    });
