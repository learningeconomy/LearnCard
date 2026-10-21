import { readFileSync } from 'fs';
import path from 'path';

import { getDidKitPlugin } from './plugin';

// Uses the checked-in DIDKit WASM so the document map is proven against the real resolver.
const wasm = readFileSync(path.join(__dirname, 'didkit', 'pkg', 'didkit_wasm_bg.wasm'));

describe('DIDKit plugin issuance with a separate key document', () => {
    const issuer = 'https://issuer.example/identity';
    const keyDocumentUri = 'https://issuer.example/keys';
    const verificationMethod = `${keyDocumentUri}#k`;

    const originalFetch = globalThis.fetch;

    beforeAll(() => {
        globalThis.fetch = jest.fn(async (input: unknown) => {
            throw new Error(`Unexpected network request: ${String(input)}`);
        }) as typeof fetch;
    });

    afterAll(() => {
        globalThis.fetch = originalFetch;
    });

    it('resolves options.verificationMethod when the credential has no proof yet', async () => {
        const plugin = await getDidKitPlugin(wasm);
        const learnCard = {} as any;
        const key = plugin.methods.generateEd25519KeyFromBytes(
            learnCard,
            new Uint8Array(32).fill(9)
        );
        const { d: _privateKey, ...publicKeyJwk } = key;

        const documents: Record<string, Record<string, unknown>> = {
            [issuer]: {
                '@context': 'https://www.w3.org/ns/did/v1',
                id: issuer,
                assertionMethod: [verificationMethod],
            },
            [keyDocumentUri]: {
                '@context': 'https://www.w3.org/ns/did/v1',
                id: keyDocumentUri,
                verificationMethod: [
                    {
                        id: verificationMethod,
                        controller: issuer,
                        type: 'JsonWebKey2020',
                        publicKeyJwk,
                    },
                ],
            },
        };
        const resolveDocument = jest.fn(async (uri: string) => documents[uri]);
        learnCard.context = { resolveDocument };

        const issued = await plugin.methods.issueCredential(
            learnCard,
            {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://w3id.org/security/suites/ed25519-2020/v1',
                ],
                type: ['VerifiableCredential'],
                issuer,
                validFrom: '2026-01-01T00:00:00Z',
                credentialSubject: { id: 'did:example:subject' },
            },
            {
                type: 'Ed25519Signature2020',
                proofPurpose: 'assertionMethod',
                verificationMethod,
            },
            key
        );

        expect(resolveDocument).toHaveBeenCalledWith(keyDocumentUri, false);
        expect(issued.proof).toMatchObject({ verificationMethod });

        const result = await plugin.methods.verifyCredential(learnCard, issued, {
            checks: ['proof', 'issuerAuthorization'],
        });

        expect(result.errors).toEqual([]);
        expect(result.checks).toEqual(expect.arrayContaining(['proof', 'issuerAuthorization']));
        expect(globalThis.fetch).not.toHaveBeenCalled();
    }, 30_000);
});
