import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import { JWEValidator, VCValidator } from '@learncard/types';
import type { CredentialConsentReceipt } from './verification';
import { verifyCredentialForIngestion } from './verification';
import { createSummaryVCStructure, createTopicVCStructure } from '../services/awarding';

test('verifies current LearnCard Data Integrity proofs and rejects changed claims', async () => {
    const wallet = await initLearnCard({
        seed: 'ab'.repeat(32),
        didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
    });
    const did = wallet.id.did();
    const uri = 'urn:uuid:00000000-0000-4000-8000-000000000001';
    const credential = await wallet.invoke.issueCredential(
        {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                { name: 'https://schema.org/name' },
            ],
            id: uri,
            type: ['VerifiableCredential'],
            issuer: did,
            issuanceDate: '2025-05-15T00:00:00Z',
            credentialSubject: { id: did, name: 'Synthetic learner' },
        },
        { type: 'DataIntegrityProof', cryptosuite: 'eddsa-rdfc-2022' }
    );
    expect(credential.proof).toMatchObject({
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-rdfc-2022',
    });
    const consent: CredentialConsentReceipt = {
        contractUri: 'test:contract',
        receiptId: 'test:receipt',
        status: 'live',
        updatedAt: '2026-01-01T00:00:00.000Z',
        contractUpdatedAt: '2026-01-01T00:00:00.000Z',
        categories: ['Achievement'],
        credentialUris: [uri],
        personalFields: [],
        purpose: 'credential-ingestion',
        revision: 'test-revision',
        guardian: { required: false, approved: false },
    };
    const input = {
        credentialUri: uri,
        subjectDid: did,
        consent,
        verify: wallet.invoke.verifyCredential,
    };
    const verified = await verifyCredentialForIngestion({ ...input, credential });
    expect(verified.status).toBe('valid');
    expect(verified.checks).toContain('proof');

    const changed = structuredClone(credential);
    changed.credentialSubject = { id: did, name: 'A different learner' };
    const rejected = await verifyCredentialForIngestion({
        ...input,
        credential: changed,
    });
    expect(rejected.status).toBe('invalid');
}, 30_000);

test('issues and verifies generated topics and summaries without JSON-LD data loss', async () => {
    const wallet = await initLearnCard({
        seed: 'ab'.repeat(32),
        didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
    });
    const did = wallet.id.did();
    const topic = createTopicVCStructure(did, did, 'Systems thinking', 'test-thread');
    const summary = createSummaryVCStructure(did, did, {
        title: 'Systems thinking',
        summary: 'Practiced identifying feedback loops.',
        learned: ['Feedback changes a system over time.'],
        skills: [{ title: 'Analysis', description: 'Identifying feedback loops.' }],
        nextSteps: [
            {
                title: 'Model a system',
                description: 'Apply feedback analysis.',
                keywords: {
                    occupations: ['Engineer'],
                    careers: ['Engineering'],
                    jobs: ['Systems engineer'],
                    skills: ['Systems thinking'],
                    fieldOfStudy: 'Engineering',
                },
            },
        ],
        reflections: [{ title: 'Feedback', description: 'Small changes can accumulate.' }],
    });
    for (const unsigned of [topic, summary]) {
        unsigned.boostId = 'urn:uuid:00000000-0000-4000-8000-000000000002';
        const credential = await wallet.invoke.issueCredential(unsigned);
        const verified = await wallet.invoke.verifyCredential(credential);
        expect(verified.errors).toEqual([]);
        expect(verified.checks).toContain('proof');
    }
}, 30_000);

test('the shipped DIDKit artifact encrypts private credentials with fresh recipient keys', async () => {
    const didkit = readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));
    const [issuer, holder, stranger] = await Promise.all([
        initLearnCard({ seed: 'a1'.repeat(32), didkit }),
        initLearnCard({ seed: 'b2'.repeat(32), didkit }),
        initLearnCard({ seed: 'c3'.repeat(32), didkit }),
    ]);
    const credential = await issuer.invoke.issueCredential({
        '@context': ['https://www.w3.org/2018/credentials/v1', { name: 'https://schema.org/name' }],
        type: ['VerifiableCredential'],
        issuer: issuer.id.did(),
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: {
            id: holder.id.did(),
            name: 'Private synthetic learner',
        },
    });
    const first = JWEValidator.parse(
        await issuer.invoke.createDagJwe(credential, [holder.id.did(), holder.id.did()])
    );
    const second = JWEValidator.parse(
        await issuer.invoke.createDagJwe(credential, [holder.id.did()])
    );
    const keys = [first, second].flatMap(jwe =>
        (jwe.recipients ?? []).map(({ header }) => {
            const key = header?.epk as { x?: string } | undefined;
            expect(typeof key?.x).toBe('string');
            return key!.x;
        })
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(JSON.stringify(first)).not.toContain('Private synthetic learner');
    for (const wallet of [issuer, holder]) {
        const restored = VCValidator.parse(await wallet.invoke.decryptDagJwe(first));
        expect(restored).toEqual(credential);
        expect((await wallet.invoke.verifyCredential(restored)).errors).toEqual([]);
    }
    const unauthorized = await stranger.invoke.decryptDagJwe(first).catch(() => undefined);
    expect(unauthorized === undefined || unauthorized === '').toBe(true);
}, 30_000);

test('an expired credential with a valid proof verifies, carries an expiry warning and is projected as expired', async () => {
    const { projectCredential } = await import('./projection');
    const wallet = await initLearnCard({
        seed: 'ac'.repeat(32),
        didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
    });
    const did = wallet.id.did();
    const uri = 'urn:uuid:00000000-0000-4000-8000-0000000000e1';
    const credential = await wallet.invoke.issueCredential(
        {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                { name: 'https://schema.org/name' },
            ],
            id: uri,
            type: ['VerifiableCredential'],
            issuer: did,
            issuanceDate: '2024-01-01T00:00:00Z',
            expirationDate: '2025-01-01T00:00:00Z',
            credentialSubject: { id: did, name: 'Synthetic learner' },
        },
        { type: 'DataIntegrityProof', cryptosuite: 'eddsa-rdfc-2022' }
    );
    const raw = await wallet.invoke.verifyCredential(credential);
    // Pin the verifier's real output so a library change cannot silently turn
    // a different failure into an accepted expiry.
    expect(raw.errors).toEqual(['expiration error: Credential is expired']);
    expect(raw.checks).toContain('proof');
    const consent: CredentialConsentReceipt = {
        contractUri: 'test:contract',
        receiptId: 'test:receipt',
        status: 'live',
        updatedAt: '2026-01-01T00:00:00.000Z',
        contractUpdatedAt: '2026-01-01T00:00:00.000Z',
        categories: ['Achievement'],
        credentialUris: [uri],
        personalFields: [],
        purpose: 'credential-ingestion',
        revision: 'test-revision',
        guardian: { required: false, approved: false },
    };
    const input = {
        credentialUri: uri,
        subjectDid: did,
        consent,
        verify: wallet.invoke.verifyCredential,
    };
    const verified = await verifyCredentialForIngestion({ ...input, credential });
    expect(verified.status).toBe('valid');
    expect(verified.errors).toEqual([]);
    expect(verified.warnings).toContain('credential_expired');
    expect(projectCredential(credential, 'Achievement', verified)).toMatchObject({
        expired: true,
        expirationDate: '2025-01-01T00:00:00.000Z',
    });

    // Expiry never excuses a broken proof or a different subject.
    const changed = structuredClone(credential);
    changed.credentialSubject = { id: did, name: 'A different learner' };
    expect((await verifyCredentialForIngestion({ ...input, credential: changed })).status).toBe(
        'invalid'
    );
    expect(
        (
            await verifyCredentialForIngestion({
                ...input,
                credential,
                subjectDid: 'did:example:someone-else',
            })
        ).errors
    ).toContain('credential_subject_mismatch');
}, 30_000);
