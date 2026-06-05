import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { generateKeyPair, exportJWK, importJWK, SignJWT } from 'jose';

import { parseSdJwtVc } from './parse';
import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';
import { toSdJwtDisplayViewModel } from './display';
import type { ParsedSdJwtVc } from './types';

const buildIssuer = async () => {
    const keypair = await generateKeyPair('EdDSA');
    const privateJwk = await exportJWK(keypair.privateKey);
    const privateKey = await importJWK(privateJwk, 'EdDSA');

    const signer = async (data: string): Promise<string> => {
        const [headerSegment, payloadSegment] = data.split('.');
        if (!headerSegment || !payloadSegment) throw new Error('Bad JWS input');
        const decode = (segment: string) =>
            JSON.parse(
                Buffer.from(
                    segment.replace(/-/g, '+').replace(/_/g, '/') +
                        '='.repeat((4 - (segment.length % 4)) % 4),
                    'base64'
                ).toString('utf-8')
            );
        const compact = await new SignJWT(decode(payloadSegment))
            .setProtectedHeader(decode(headerSegment))
            .sign(privateKey);
        return compact.split('.')[2]!;
    };

    return new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer,
        signAlg: 'EdDSA',
    });
};

describe('toSdJwtDisplayViewModel', () => {
    let parsed: ParsedSdJwtVc;
    let parsedNoExpiry: ParsedSdJwtVc;

    beforeAll(async () => {
        const instance = await buildIssuer();
        const issuedAt = 1700000000;
        const expiresAt = issuedAt + 60 * 60 * 24 * 365;

        const withExpiry = await instance.issue(
            {
                iss: 'did:web:issuer.example.com',
                iat: issuedAt,
                exp: expiresAt,
                vct: 'https://example.com/credentials/test-cert',
                given_name: 'Ada',
                family_name: 'Lovelace',
                degree: { type: 'BachelorDegree', name: 'Bachelor of Science' },
            },
            { _sd: ['given_name', 'family_name', 'degree'] }
        );
        parsed = await parseSdJwtVc(withExpiry);

        const noExpiry = await instance.issue(
            {
                iss: 'did:web:issuer.example.com',
                iat: issuedAt,
                vct: 'urn:eu.europa.ec.eudi:pid:1',
                given_name: 'Ada',
            },
            { _sd: ['given_name'] }
        );
        parsedNoExpiry = await parseSdJwtVc(noExpiry);
    });

    it('derives category from vct via categorizeSdJwt', () => {
        const view = toSdJwtDisplayViewModel(parsed);
        expect(view.category).toBe('Achievement');

        const pidView = toSdJwtDisplayViewModel(parsedNoExpiry);
        expect(pidView.category).toBe('ID');
    });

    it('emits issuer, vct, and rawSdJwt as-is', () => {
        const view = toSdJwtDisplayViewModel(parsed);
        expect(view.vct).toBe('https://example.com/credentials/test-cert');
        expect(view.issuerName).toBe('did:web:issuer.example.com');
        expect(view.rawSdJwt).toBe(parsed.rawSdJwt);
    });

    it('renders issuedAt and expiresAt as ISO strings', () => {
        const view = toSdJwtDisplayViewModel(parsed);
        expect(view.issuedAt).toBe('2023-11-14T22:13:20.000Z');
        expect(view.expiresAt).toBe('2024-11-13T22:13:20.000Z');
    });

    it('leaves expiresAt undefined when the credential has no exp', () => {
        const view = toSdJwtDisplayViewModel(parsedNoExpiry);
        expect(view.expiresAt).toBeUndefined();
    });

    it('strips SD-JWT protocol metadata from claims', () => {
        const view = toSdJwtDisplayViewModel(parsed);
        const keys = Object.keys(view.claims);
        expect(keys).not.toContain('iss');
        expect(keys).not.toContain('iat');
        expect(keys).not.toContain('exp');
        expect(keys).not.toContain('vct');
        expect(keys).not.toContain('_sd_alg');
        expect(keys).not.toContain('_sd');
        expect(keys).toContain('given_name');
        expect(keys).toContain('family_name');
        expect(keys).toContain('degree');
    });

    it('preserves disclosed claim values (including nested objects)', () => {
        const view = toSdJwtDisplayViewModel(parsed);
        expect(view.claims.given_name).toBe('Ada');
        expect(view.claims.family_name).toBe('Lovelace');
        expect(view.claims.degree).toEqual({
            type: 'BachelorDegree',
            name: 'Bachelor of Science',
        });
    });

    it('emits disclosureKeys as a defensive copy (mutating result does not mutate parsed)', () => {
        const view = toSdJwtDisplayViewModel(parsed);
        const originalLength = parsed.disclosureKeys.length;
        view.disclosureKeys.push('attacker_injected');
        expect(parsed.disclosureKeys.length).toBe(originalLength);
    });

    it('surfaces hasKeyBinding from the parsed credential', () => {
        const view = toSdJwtDisplayViewModel(parsed);
        expect(view.hasKeyBinding).toBe(false);
    });
});
