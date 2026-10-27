import { expect, test, mock } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { generateKeyPairSync, sign } from 'node:crypto';
const didkit = await import(
    require
        .resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
        .replace('didkit_wasm_bg.wasm', 'didkit_wasm.js')
);
const initialize = didkit.default;
mock.module('../services/ownerAuthIndex', () => ({
    setOwnerAuthenticationRecord: async (
        store: { set: (key: string, value: string) => Promise<unknown> },
        _did: string,
        key: string,
        value: string
    ) => store.set(key, value),
    consumeOwnerAuthenticationRecord: async () => true,
}));
const { createAuthService } = await import('./service');

// This uses the shipped DIDKit verifier against an actual loopback DID document.
// The signing key belongs to a manager; the session principal remains the profile.
test('managed profile authentication verifies relationship, nonce, audience and replay', async () => {
    await initialize({
        module_or_path: await readFile(
            require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
        ),
    });
    const manager = generateKeyPairSync('ed25519');
    const key = manager.privateKey.export({ format: 'jwk' });
    const publicKey = manager.publicKey.export({ format: 'jwk' });
    let document: object;
    const server = Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch: () => Response.json(document),
    });
    const profile = `did:web:localhost%3A${server.port}`;
    const method = `${profile}#manager`;
    document = {
        '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://w3id.org/security/suites/jws-2020/v1',
        ],
        id: profile,
        verificationMethod: [
            {
                id: method,
                controller: profile,
                type: 'JsonWebKey2020',
                publicKeyJwk: publicKey,
            },
        ],
        authentication: [method],
        assertionMethod: [method],
    };
    const entries = new Map<string, string>();
    const store = {
        get: async (key: string) => entries.get(key) ?? null,
        getdel: async (key: string) => {
            const result = entries.get(key) ?? null;
            entries.delete(key);
            return result;
        },
        del: async (key: string) => entries.delete(key),
        set: async (key: string, value: string) => {
            entries.set(key, value);
            return 'OK';
        },
    };
    const service = createAuthService({
        store,
        withOwnerOperation: async (_did: string, callback: () => Promise<unknown>) => callback(),
        verifyPresentation: async (
            proof: string,
            options: {
                challenge: string;
                domain: string;
                proofFormat: 'jwt';
                proofPurpose: 'authentication';
            }
        ) => JSON.parse(await didkit.verifyPresentation(proof, JSON.stringify(options), '{}')),
    } as unknown as Parameters<typeof createAuthService>[0]);
    async function attempt(
        options: {
            wrongNonce?: boolean;
            wrongAudience?: boolean;
            wrongKey?: boolean;
        } = {}
    ) {
        await didkit.clearCache();
        const challenge = await service.createChallenge({
            audience: 'https://passport.example.test',
            returnTo: 'https://passport.example.test/admin',
        });
        let proof = await didkit.issuePresentation(
            JSON.stringify({
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: profile,
            }),
            JSON.stringify({
                proofFormat: 'jwt',
                proofPurpose: 'authentication',
                verificationMethod: method,
                challenge: options.wrongNonce ? 'wrong-nonce' : challenge.challenge,
                domain: options.wrongAudience
                    ? 'https://evil.example.test'
                    : 'https://passport.example.test',
            }),
            JSON.stringify(key),
            '{}'
        );
        if (options.wrongKey) {
            const unsigned = proof.split('.').slice(0, 2).join('.');
            proof = `${unsigned}.${sign(null, Buffer.from(unsigned), generateKeyPairSync('ed25519').privateKey).toString('base64url')}`;
        }
        return {
            challenge: challenge.challenge,
            expectedBinding: challenge.binding,
            presentation: proof,
        };
    }
    try {
        const valid = await attempt();
        const result = await service.authenticate(valid);
        expect(result.did).toBe(profile);
        expect((await service.getSession(result.sessionId))?.did).toBe(profile);
        await expect(service.authenticate(valid)).rejects.toThrow();
        for (const options of [{ wrongNonce: true }, { wrongAudience: true }, { wrongKey: true }])
            await expect(service.authenticate(await attempt(options))).rejects.toThrow();
        const assertionOnly = await attempt();
        document = { ...document, authentication: [], assertionMethod: [method] };
        await didkit.clearCache();
        await expect(service.authenticate(assertionOnly)).rejects.toThrow();
    } finally {
        server.stop(true);
    }
}, 30000);
