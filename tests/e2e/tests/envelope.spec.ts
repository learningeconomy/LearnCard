import { describe, test, expect, beforeEach } from 'vitest';

import { toStoredCredential } from '@learncard/helpers';
import type { StoredCredentialEnvelope, VC } from '@learncard/types';

import { getLearnCardForUser, LearnCard } from './helpers/learncard.helpers';

let a: LearnCard;
let b: LearnCard;

const base64UrlEncode = (input: string): string => {
    const b64 = Buffer.from(input, 'utf-8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const makeSdJwtCompact = (payload: Record<string, unknown>): string => {
    const header = base64UrlEncode(JSON.stringify({ alg: 'EdDSA', typ: 'dc+sd-jwt' }));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    return `${header}.${payloadB64}.AAAA~`;
};

const SD_JWT_PAYLOAD = {
    iss: 'did:web:issuer.example.com',
    iat: 1700000000,
    exp: 1800000000,
    vct: 'https://example.com/credentials/career-passport',
    given_name: 'Ada',
    occupation: 'Engineer',
};

describe('Envelope storage', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('W3C VC roundtrip is byte-identical through real network stack', async () => {
        // Pins the W3C path against accidental envelope-related regression.
        // Lives alongside the envelope tests intentionally — if anything in
        // the envelope projection / storage layer accidentally rewrites W3C
        // VCs, this fails before any partner notices.
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const uri = await a.store.LearnCloud.uploadEncrypted!(vc);
        const resolved = await a.read.get(uri);

        expect(resolved).toEqual(vc);
    });

    test('SD-JWT envelope roundtrips through uploadEncrypted + resolve preserving compact form', async () => {
        const compact = makeSdJwtCompact(SD_JWT_PAYLOAD);
        const envelope: StoredCredentialEnvelope = { format: 'dc+sd-jwt', data: compact };

        const uri = await a.store.LearnCloud.uploadEncrypted!(envelope);
        const resolved = (await a.read.get(uri)) as VC;

        expect(resolved).toBeDefined();
        const proof = resolved.proof as { type?: string; jwt?: string };
        expect(proof.type).toBe('SdJwtCompactProof');
        expect(proof.jwt).toBe(compact);
    });

    test('learnCard.read.get projects envelope to display VC with derived type and name', async () => {
        const compact = makeSdJwtCompact(SD_JWT_PAYLOAD);
        const envelope: StoredCredentialEnvelope = { format: 'dc+sd-jwt', data: compact };

        const uri = await a.store.LearnCloud.uploadEncrypted!(envelope);
        const resolved = (await a.read.get(uri)) as VC & Record<string, unknown>;

        expect(resolved).toBeDefined();
        expect(resolved.type).toContain('VerifiableCredential');
        expect(resolved.type).toContain('SdJwtVcCredential');
        expect(resolved.type).toContain('CareerPassport');
        expect(resolved.name).toBe('Career Passport');
        expect(resolved.issuer).toBe('did:web:issuer.example.com');
        expect(resolved.sdJwtVct).toBe(SD_JWT_PAYLOAD.vct);

        const subject = resolved.credentialSubject as Record<string, unknown>;
        expect(subject.given_name).toBe('Ada');
        expect(subject.occupation).toBe('Engineer');
        // Reserved JWT/SD-JWT claims must not leak into credentialSubject.
        expect(subject.iss).toBeUndefined();
        expect(subject.vct).toBeUndefined();
        expect(subject.iat).toBeUndefined();
    });

    test('legacy IndexRecord without format/semanticType still resolves through every read path', async () => {
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        const uri = await a.store.LearnCloud.uploadEncrypted!(vc);
        await a.index.LearnCloud.add({ id: 'legacy-record', uri });

        const records = await a.index.LearnCloud.get();
        const record = records.find(r => r.id === 'legacy-record');
        expect(record).toBeDefined();
        expect(record!.format).toBeUndefined();
        expect(record!.semanticType).toBeUndefined();

        const resolved = await a.read.get(record!.uri);
        expect(resolved).toEqual(vc);

        const projected = toStoredCredential(record!);
        expect(projected.format === 'w3c-vc-1.1' || projected.format === 'w3c-vc-2.0').toBe(true);
    });
});
