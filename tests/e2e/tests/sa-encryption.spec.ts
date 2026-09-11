import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { expect, test } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { JWEValidator, type VC } from '@learncard/types';
import { getBitstringStatusListEntries, getBitstringStatusListBit } from '@learncard/helpers';
import { getLearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

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
    expect(await org.invoke.decryptDagJwe(jwe)).toEqual(subjectVc);
    // This seed is the brain service's test-only key in compose.yaml.
    const brain = await initLearnCard({ seed: 'a' });
    expect(await brain.invoke.decryptDagJwe(jwe).catch(() => undefined)).toBeFalsy();
    expect(subjectVc.boostCredential).toBeUndefined();
    expect(subjectVc.boostId).toBe(boostUri);
    expect(subjectVc.name).toBe(testUnsignedBoost.name);
    expect((await student.invoke.verifyCredential(subjectVc)).errors).toEqual([]);

    expect((await student.invoke.getIncomingCredentials()).some(item => item.uri === uri)).toBe(
        true
    );
    await student.invoke.acceptCredential(uri);
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
