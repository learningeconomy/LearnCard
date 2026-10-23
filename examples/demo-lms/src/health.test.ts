import { describe, expect, it } from 'bun:test';
import { SignJWT, generateKeyPair, type KeyLike } from 'jose';

import type { DemoLmsConfig } from './config';
import { verifyHealthChallenge } from './health';

const config: DemoLmsConfig = {
    port: 0,
    brainUrl: 'http://brain.invalid',
    healthUrl: 'https://lms.example/health',
    serviceAccountId: 'sa_1',
    serviceAccountSecret: 'unused',
    installId: 'install_1',
    ecosystemId: 'eco_1',
    platformJwk: { kty: 'OKP', crv: 'Ed25519', x: '' },
};

const sign = async (
    key: KeyLike,
    overrides: { typ?: string; aud?: string; installId?: string } = {}
): Promise<string> =>
    new SignJWT({ installId: overrides.installId ?? 'install_1', ecosystemId: 'eco_1', gen: 1 })
        .setProtectedHeader({ alg: 'EdDSA', typ: overrides.typ ?? 'educationos-health+jwt' })
        .setIssuer('educationos-platform')
        .setAudience(overrides.aud ?? config.healthUrl)
        .setSubject('sa_1')
        .setJti('nonce-1')
        .setIssuedAt()
        .setExpirationTime('30s')
        .sign(key);

describe('verifyHealthChallenge', () => {
    it('echoes the jti of a valid challenge', async () => {
        const { publicKey, privateKey } = await generateKeyPair('EdDSA');
        expect(await verifyHealthChallenge(await sign(privateKey), config, publicKey)).toBe(
            'nonce-1'
        );
    });

    it('rejects a wrong audience, token type, install, or signer', async () => {
        const { publicKey, privateKey } = await generateKeyPair('EdDSA');
        const other = await generateKeyPair('EdDSA');
        for (const challenge of [
            await sign(privateKey, { aud: 'https://other.example/health' }),
            await sign(privateKey, { typ: 'educationos-integration+jwt' }),
            await sign(privateKey, { installId: 'install_2' }),
            await sign(other.privateKey),
        ]) {
            expect(await verifyHealthChallenge(challenge, config, publicKey)).toBeNull();
        }
        expect(await verifyHealthChallenge(null, config, publicKey)).toBeNull();
    });
});
