import { ed25519 } from '@noble/curves/ed25519';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';

import { sdJwtVcCourseCompletion } from '../../../../../packages/credential-library/src/fixtures/sd-jwt-vc/course-completion';
import { materializeSdJwtVcFixture } from '../../../../../packages/credential-library/src/materialize-sd-jwt-vc';
import { sha256Hasher } from '../../../../../packages/plugins/sd-jwt-vc/src/hasher';
import { randomSalt } from '../../../../../packages/plugins/sd-jwt-vc/src/salt';

export const fixture = sdJwtVcCourseCompletion;
export const ISSUER = 'did:example:learncard-android-lab';
// Publicly known test issuer. This file is bundled only in the separate debug lab applications.
const TEST_ISSUER_SEED = new Uint8Array(32).fill(7);
export const issuerPublicKey = ed25519.getPublicKey(TEST_ISSUER_SEED);
const bytes = (input: string): Uint8Array => new TextEncoder().encode(input);
export const encode = (input: Uint8Array): string =>
    btoa(String.fromCharCode(...input))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
export const decode = (input: string): Uint8Array =>
    Uint8Array.from(atob(input.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
export const publicJwk = (secret: Uint8Array): Record<string, unknown> => ({
    kty: 'OKP',
    crv: 'Ed25519',
    x: encode(ed25519.getPublicKey(secret)),
});

export interface LabCredential {
    id: string;
    compact: string;
    /** Synthetic lab key only, stored in this lab's private WebView storage. */
    holderSecret: string;
}

/** Real fixture materialization uses the same issuer/holder contract as the credential viewer. */
export const createLabCredential = async (): Promise<LabCredential> => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const issued = await materializeSdJwtVcFixture(fixture, {
        issuerDid: ISSUER,
        issuerKid: `${ISSUER}#issuer`,
        issuerSigner: async input => encode(ed25519.sign(bytes(input), TEST_ISSUER_SEED)),
        holderPublicJwk: publicJwk(secret),
    });
    return { id: crypto.randomUUID(), compact: issued.compact, holderSecret: encode(secret) };
};

/** A separately configured verifier verifies issuer proof, disclosures and key binding. */
export const verifier = (): SDJwtVcInstance =>
    new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        verifier: async (input, signature) =>
            ed25519.verify(decode(signature), bytes(input), issuerPublicKey),
    });

export const verifyPresentation = async (
    compact: string,
    origin: string,
    nonce: string
): Promise<Record<string, unknown>> => {
    const issuerPayload = JSON.parse(new TextDecoder().decode(decode(compact.split('.')[1])));
    const holderKey = issuerPayload.cnf?.jwk;
    if (holderKey?.kty !== 'OKP' || holderKey.crv !== 'Ed25519')
        throw new Error('Missing holder binding');
    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        verifier: async (input, signature) =>
            ed25519.verify(decode(signature), bytes(input), issuerPublicKey),
        kbVerifier: async (input, signature) => {
            const payload = JSON.parse(new TextDecoder().decode(decode(input.split('.')[1])));
            if (payload.aud !== `origin:${origin}` || payload.nonce !== nonce) return false;
            if (Math.abs(Date.now() / 1000 - payload.iat) > 300) return false;
            return ed25519.verify(decode(signature), bytes(input), decode(holderKey.x));
        },
    });
    const result = await instance.verify(compact, { keyBindingNonce: nonce });
    if (result.payload.iss !== ISSUER || result.payload.vct !== fixture.template.vct) {
        throw new Error('Unexpected issuer or credential type');
    }
    if (result.payload.learner_name !== undefined || result.payload.skills !== undefined) {
        throw new Error('Unrequested fields disclosed');
    }
    for (const claim of ['course_name', 'completion_date']) {
        if (result.payload[claim] !== fixture.template.claims[claim])
            throw new Error('Missing requested field');
    }
    return result.payload;
};

export const signHolder = (secret: string, input: string): string =>
    encode(ed25519.sign(bytes(input), decode(secret)));
