import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { expect, test } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { JWEValidator, type VC } from '@learncard/types';
import { getBitstringStatusListEntries, getBitstringStatusListBit } from '@learncard/helpers';
import { getLearnCard, getLearnCardForUser, type LearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';
import { normalContract, normalFullTerms } from './helpers/contract.helpers';

test('legacy signed wrappers still verify and reject tampered inner credentials', async () => {
    const issuer = await initLearnCard({ seed: 'e'.repeat(64) });
    const verifier = await getLearnCard(crypto.randomBytes(32).toString('hex'));
    const boostId = 'lc:network:localhost%3A4000/boost:legacy-fixture';
    const inner = await issuer.invoke.issueCredential({
        ...testUnsignedBoost,
        issuer: issuer.id.did(),
        boostId,
        credentialSubject: { ...testUnsignedBoost.credentialSubject, id: verifier.id.did() },
    });
    // Seed an existing-format credential without restoring a legacy server issuance path.
    const legacy = await issuer.invoke.issueCredential({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://ctx.learncard.com/boosts/1.0.1.json',
        ],
        type: ['VerifiableCredential', 'CertifiedBoostCredential'],
        issuer: issuer.id.did(),
        validFrom: new Date().toISOString(),
        credentialSubject: { id: issuer.id.did() },
        boostId,
        boostCredential: inner,
    });
    expect((await verifier.invoke.verifyCredential(legacy)).errors).toEqual([]);
    const tampered = structuredClone(legacy);
    (tampered.boostCredential as VC).name = 'Tampered name';
    expect((await verifier.invoke.verifyCredential(tampered)).errors.length).toBeGreaterThan(0);
});

test('delegated AutoBoosts remain readable by the contract owner across consent changes', async () => {
    const owner = await getLearnCardForUser('a');
    const student = await getLearnCardForUser('b');
    const writer = await getLearnCardForUser('c');
    const sa = await writer.invoke.createSigningAuthority('delegated-sa');
    if (!sa) throw new Error('Signing authority creation failed');
    await writer.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);
    const boostUri = await writer.invoke.createBoost(testUnsignedBoost, {
        category: 'Achievement',
    });
    const contractUri = await owner.invoke.createContract({
        contract: normalContract,
        name: 'Delegated AutoBoost encryption',
        writers: ['testc'],
    });
    await writer.invoke.addAutoBoostsToContract(contractUri, [
        { boostUri, signingAuthority: { endpoint: sa.endpoint, name: sa.name } },
    ]);
    const { termsUri } = await student.invoke.consentToContract(contractUri, {
        terms: normalFullTerms,
    });
    const seen = new Set<string>();
    const brain = await initLearnCard({ seed: 'a' });
    const assertNewCredentialReaders = async (termsUri: string): Promise<void> => {
        const { records } = await student.invoke.getCredentialsForContract(termsUri);
        const newlyIssued = records.filter(record => !seen.has(record.credentialUri));
        expect(newlyIssued).toHaveLength(1);
        for (const record of newlyIssued) {
            seen.add(record.credentialUri);
            const response = await fetch(
                `http://localhost:4000/api/storage/resolve?uri=${encodeURIComponent(record.credentialUri)}`
            );
            expect(response.status).toBe(200);
            const jwe = JWEValidator.parse(await response.json());
            const vc = await student.invoke.decryptDagJwe<VC>(jwe);
            expect(vc.boostId).toBe(boostUri);
            expect(await writer.invoke.decryptDagJwe(jwe)).toEqual(vc);
            expect(await owner.invoke.decryptDagJwe(jwe)).toEqual(vc);
            expect(await brain.invoke.decryptDagJwe(jwe).catch(() => undefined)).toBeFalsy();
        }
    };
    await assertNewCredentialReaders(termsUri);
    await student.invoke.withdrawConsent(termsUri);
    const { termsUri: reconsentedTermsUri } = await student.invoke.consentToContract(contractUri, {
        terms: normalFullTerms,
    });
    await assertNewCredentialReaders(reconsentedTermsUri);
    await student.invoke.updateContractTerms(reconsentedTermsUri, { terms: normalFullTerms });
    await assertNewCredentialReaders(reconsentedTermsUri);
});

test('SA issuance stores encrypted credentials and supports claim and revocation', async () => {
    const org = await getLearnCard(crypto.randomBytes(32).toString('hex'));
    const student = await getLearnCard(crypto.randomBytes(32).toString('hex'));
    await org.invoke.createProfile({ profileId: 'encryption-org', displayName: 'Issuing Org' });
    await student.invoke.createProfile({ profileId: 'encryption-student', displayName: 'Student' });
    const sa = await org.invoke.createSigningAuthority('encryption-sa');
    expect(sa).toBeDefined();
    if (!sa) throw new Error('Signing authority creation failed');
    await org.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);
    const brainIssuer = await initLearnCard({ seed: 'a', didWeb: 'did:web:localhost%3A4000' });
    const brainToken = await brainIssuer.invoke.getDidAuthVp({ proofFormat: 'jwt' });
    const invalidRecipientResponse = await fetch('http://localhost:5200/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${brainToken}` },
        body: JSON.stringify({
            credential: testUnsignedBoost,
            signingAuthority: {
                name: sa.name,
                did: sa.did,
                ownerDid: 'did:web:localhost%3A4000:users:encryption-org',
            },
            encryption: { recipients: ['did:example:no-key-agreement'] },
        }),
    });
    expect(invalidRecipientResponse.status, await invalidRecipientResponse.clone().text()).toBe(
        400
    );
    const boostUri = await org.invoke.createBoost(testUnsignedBoost);
    const grant = await org.invoke.addAuthGrant({
        name: 'encrypted-issuance',
        scope: 'boosts:write',
    });
    const token = await org.invoke.getAPITokenForAuthGrant(grant);
    const response = await fetch(
        'http://localhost:4000/api/boost/send/via-signing-authority/encryption-student',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                boostUri,
                signingAuthority: { endpoint: sa.endpoint, name: sa.name },
            }),
        }
    );
    expect(response.status, await response.clone().text()).toBe(200);
    const uri = (await response.json()) as string;
    const storedResponse = await fetch(
        `http://localhost:4000/api/storage/resolve?uri=${encodeURIComponent(uri)}`
    );
    expect(storedResponse.status).toBe(200);
    const stored = await storedResponse.json();
    const jwe = JWEValidator.parse(stored);
    const subjectVc = await student.invoke.decryptDagJwe<VC>(jwe);
    expect(await student.read.get(uri)).toEqual(subjectVc);
    expect(await org.read.get(uri)).toEqual(subjectVc);
    expect(await org.invoke.decryptDagJwe(jwe)).toEqual(subjectVc);
    // This seed is the brain service's test-only key in compose.yaml.
    const brain = await initLearnCard({ seed: 'a' });
    expect(await brain.invoke.decryptDagJwe(jwe).catch(() => undefined)).toBeFalsy();
    expect(subjectVc.boostCredential).toBeUndefined();
    const issuerDid = 'did:web:localhost%3A4000:users:encryption-org';
    expect(typeof subjectVc.issuer === 'string' ? subjectVc.issuer : subjectVc.issuer.id).toBe(
        issuerDid
    );
    expect(subjectVc.proof).toMatchObject({ verificationMethod: `${issuerDid}#${sa.name}` });
    expect(subjectVc.boostId).toBe(boostUri);
    expect(subjectVc.name).toBe(testUnsignedBoost.name);
    // The SA signs on behalf of the organization's did:web identity.
    const verifier = await initLearnCard({
        seed: crypto.randomBytes(32).toString('hex'),
        network: 'http://localhost:4000/trpc',
        trustedBoostRegistry: `data:application/json,${encodeURIComponent(
            JSON.stringify([
                {
                    id: 'LearnCard Network',
                    url: 'http://localhost:4000',
                    did: 'did:web:localhost%3A4000',
                },
            ])
        )}`,
    });
    const verification = await verifier.invoke.verifyCredential(subjectVc);
    expect(verification.errors).toEqual([]);
    expect(verification.checks).toContain('Boost is Authentic. Verified by LearnCard Network.');

    expect((await student.invoke.getIncomingCredentials()).some(item => item.uri === uri)).toBe(
        true
    );
    await student.invoke.acceptCredential(uri);
    expect((await student.invoke.getReceivedCredentials()).some(item => item.uri === uri)).toBe(
        true
    );
    expect(await org.invoke.countBoostRecipients(boostUri)).toBe(1);
    expect(
        (await org.invoke.getBoostRecipients(boostUri)).some(
            item => item.to.profileId === 'encryption-student'
        )
    ).toBe(true);

    const revocation = getBitstringStatusListEntries(subjectVc).find(
        entry => entry.statusPurpose === 'revocation'
    );
    expect(revocation).toBeDefined();
    if (!revocation) throw new Error('Missing signed revocation entry');
    await org.invoke.revokeBoostRecipient(boostUri, 'encryption-student');
    const statusResponse = await fetch(revocation.statusListCredential);
    expect(statusResponse.status).toBe(200);
    const statusList = await statusResponse.json();
    const encoded = statusList.credentialSubject.encodedList as string;
    const bits = gunzipSync(Buffer.from(encoded.slice(1), 'base64url'));
    expect(getBitstringStatusListBit(bits, Number(revocation.statusListIndex))).toBe(true);
    expect(await org.invoke.countBoostRecipients(boostUri)).toBe(0);
    const storedAfterRevocation = await fetch(
        `http://localhost:4000/api/storage/resolve?uri=${encodeURIComponent(uri)}`
    );
    expect(await storedAfterRevocation.json()).toEqual(stored);
});

const postJson = async (path: string, body: unknown, token?: string) => {
    const response = await fetch(`http://localhost:4000/api${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
    expect(response.status, await response.clone().text()).toBe(200);
    return response.json();
};

const setupKnownRecipientIssuance = async () => {
    const issuer = await getLearnCardForUser('a');
    const recipient = await getLearnCardForUser('b');
    const authority = await issuer.invoke.createSigningAuthority('known-recipient');
    if (!authority) throw new Error('Signing authority creation failed');
    await issuer.invoke.registerSigningAuthority(authority.endpoint, authority.name, authority.did);
    await issuer.invoke.setPrimaryRegisteredSigningAuthority(authority.endpoint, authority.name);
    const grant = await issuer.invoke.addAuthGrant({
        name: 'known-recipient',
        scope: 'boosts:write inbox:write',
    });
    return {
        issuer,
        recipient,
        authority,
        token: await issuer.invoke.getAPITokenForAuthGrant(grant),
    };
};

const verifyEmail = async (wallet: LearnCard, email: string): Promise<void> => {
    await wallet.invoke.addContactMethod({ type: 'email', value: email });
    const delivery = await (await fetch('http://localhost:4000/api/test/last-delivery')).json();
    expect(
        await wallet.invoke.verifyContactMethod(delivery.templateModel.verificationToken)
    ).toBeTruthy();
};

const assertEncryptedReaders = async (
    issuer: LearnCard,
    recipient: LearnCard,
    uri: string
): Promise<VC> => {
    const response = await fetch(
        `http://localhost:4000/api/storage/resolve?uri=${encodeURIComponent(uri)}`
    );
    expect(response.status).toBe(200);
    const stored = JWEValidator.parse(await response.json());
    const vc = (await recipient.read.get(uri)) as VC;
    expect(vc.name).toBe(testUnsignedBoost.name);
    expect(await issuer.read.get(uri)).toEqual(vc);
    const brain = await initLearnCard({ seed: 'a' });
    expect(await brain.invoke.decryptDagJwe(stored).catch(() => undefined)).toBeFalsy();
    await recipient.invoke.acceptCredential(uri);
    expect((await recipient.invoke.getReceivedCredentials()).map(record => record.uri)).toContain(
        uri
    );
    return vc;
};

test.each(['testb', 'did:web:localhost%3A4000:users:testb'])(
    'POST /send encrypts SA issuance to a local recipient %s and preserves revocation',
    async recipientId => {
        const { issuer, recipient, token } = await setupKnownRecipientIssuance();
        const boostUri = await issuer.invoke.createBoost(testUnsignedBoost);
        const sent = await postJson(
            '/send',
            {
                type: 'boost',
                recipient: recipientId,
                templateUri: boostUri,
            },
            token
        );
        const vc = await assertEncryptedReaders(issuer, recipient, sent.credentialUri);
        expect(
            (await issuer.invoke.getBoostRecipients(boostUri)).map(record => record.to.profileId)
        ).toContain('testb');
        const revocation = getBitstringStatusListEntries(vc).find(
            entry => entry.statusPurpose === 'revocation'
        );
        if (!revocation) throw new Error('Missing signed revocation entry');
        await issuer.invoke.revokeBoostRecipient(boostUri, 'testb');
        const statusList = await (await fetch(revocation.statusListCredential)).json();
        const bits = gunzipSync(
            Buffer.from(statusList.credentialSubject.encodedList.slice(1), 'base64url')
        );
        expect(getBitstringStatusListBit(bits, Number(revocation.statusListIndex))).toBe(true);
    }
);

test('issueToInbox encrypts SA auto-delivery to a verified email with boost tracking', async () => {
    const { issuer, recipient, token } = await setupKnownRecipientIssuance();
    const email = 'known-sa@example.com';
    await verifyEmail(recipient, email);
    const boostUri = await issuer.invoke.createBoost(testUnsignedBoost);
    const sent = await postJson(
        '/send',
        {
            type: 'boost',
            recipient: email,
            templateUri: boostUri,
            options: { suppressDelivery: true },
        },
        token
    );
    expect(sent.inbox.status).toBe('ISSUED');
    const incoming = await recipient.invoke.getIncomingCredentials();
    expect(incoming).toHaveLength(1);
    await assertEncryptedReaders(issuer, recipient, incoming[0]!.uri);
    expect(
        (await issuer.invoke.getBoostRecipients(boostUri)).map(record => record.to.profileId)
    ).toContain('testb');
    const audit = await issuer.invoke.getInboxCredential(sent.inbox.issuanceId);
    expect(audit.credential).toBeUndefined();
});

type InboxIntegrationConfiguration = { publishableKey: string; listingId: string };

const setupInboxIntegration = async (issuer: LearnCard): Promise<InboxIntegrationConfiguration> => {
    const integrationId = await issuer.invoke.addIntegration({
        name: 'Encrypted inbox',
        whitelistedDomains: ['localhost:4000'],
        description: 'Encrypted inbox regression',
    });
    const listingId = await issuer.invoke.createAppStoreListing(integrationId, {
        display_name: 'Encrypted Inbox',
        tagline: 'Encrypted inbox',
        full_description: 'Encrypted inbox regression',
        icon_url: 'https://example.com/icon.png',
        launch_type: 'EMBEDDED_IFRAME',
        launch_config_json: JSON.stringify({ iframeUrl: 'https://example.com' }),
    });
    const listing = await issuer.invoke.getAppStoreListing(listingId);
    if (!listing?.slug) throw new Error('Missing listing slug');
    const authority = await issuer.invoke.createSigningAuthority(
        'inbox-app-sa',
        `did:web:localhost%3A4000:app:${listing.slug}`
    );
    if (!authority) throw new Error('App signing authority creation failed');
    await issuer.invoke.registerSigningAuthority(authority.endpoint, authority.name, authority.did);
    await issuer.invoke.associateListingWithSigningAuthority(
        listingId,
        authority.endpoint,
        authority.name,
        authority.did,
        true
    );
    const integration = await issuer.invoke.getIntegration(integrationId);
    if (!integration) throw new Error('Missing integration');
    return { publishableKey: integration.publishableKey, listingId };
};

const claimIntoVerifiedInbox = async (
    email: string,
    configuration: InboxIntegrationConfiguration
) => {
    await postJson('/contact-methods/challenge', { type: 'email', value: email, configuration });
    const delivery = await (await fetch('http://localhost:4000/api/test/last-delivery')).json();
    const session = await postJson('/contact-methods/session', {
        contactMethod: { type: 'email', value: email },
        otpChallenge: delivery.templateModel.verificationCode,
    });
    return postJson(
        '/inbox/claim',
        { credential: testUnsignedBoost, configuration },
        session.sessionJwt
    );
};

test('claimIntoInbox encrypts listing issuance for an existing verified account and its owner', async () => {
    const { issuer, recipient } = await setupKnownRecipientIssuance();
    const email = 'claim-sa@example.com';
    await verifyEmail(recipient, email);
    const configuration = await setupInboxIntegration(issuer);
    const claimed = await claimIntoVerifiedInbox(email, configuration);
    expect(claimed.status).toBe('ISSUED');
    const incoming = await recipient.invoke.getIncomingCredentials();
    expect(incoming).toHaveLength(1);
    await assertEncryptedReaders(issuer, recipient, incoming[0]!.uri);
});

test('finalize encrypts accepted inbox issuance after signup and SDK decrypts before returning VCs', async () => {
    const { issuer } = await setupKnownRecipientIssuance();
    const configuration = await setupInboxIntegration(issuer);
    const email = 'signup-sa@example.com';
    // The email session accepts the credential before its holder has a network account.
    const claimed = await claimIntoVerifiedInbox(email, configuration);
    expect(claimed.status).toBe('PENDING');
    const recipient = await getLearnCardForUser('c');
    await verifyEmail(recipient, email);
    const finalized = await recipient.invoke.finalizeInboxCredentials();
    expect(finalized).toMatchObject({ processed: 1, claimed: 1, errors: 0 });
    expect(finalized.deliveries[0]!.id).toBe(claimed.inboxCredential.id);
    expect(finalized.verifiableCredentials).toEqual(
        finalized.deliveries.map(delivery => delivery.credential)
    );
    const received = await recipient.invoke.getReceivedCredentials();
    expect(received).toHaveLength(1);
    const vc = await assertEncryptedReaders(issuer, recipient, received[0]!.uri);
    expect(finalized.deliveries[0]!.credential).toEqual(vc);
    const recovered = await recipient.invoke.recoverInboxCredentials();
    expect(recovered.records).toEqual([
        expect.objectContaining({ id: claimed.inboxCredential.id, credential: vc }),
    ]);
    expect(await recipient.invoke.finalizeInboxCredentials()).toMatchObject({
        processed: 0,
        claimed: 0,
    });
    expect(await recipient.invoke.getReceivedCredentials()).toHaveLength(1);
});
