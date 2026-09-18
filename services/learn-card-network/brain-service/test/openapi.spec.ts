import { PublishCredentialRefreshInputValidator } from '@learncard/types';

import { openApiDocument } from '../src/openapi';

const unsignedCredential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:holder' },
};

const signedCredential = {
    ...unsignedCredential,
    proof: {
        type: 'DataIntegrityProof',
        created: '2026-09-03T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
        jws: 'test-signature',
    },
};

// The import itself is the test: `src/openapi.ts` calls generateOpenApiDocument
// at module load, so a Zod 4 / trpc-to-openapi regression throws here instead of
// at Lambda cold start.
describe('OpenAPI generation', () => {
    it('generates the document at boot without throwing', () => {
        expect(openApiDocument).toBeDefined();
        expect(Object.keys(openApiDocument.paths ?? {}).length).toBeGreaterThan(0);
    });

    it('includes the skill-search route whose $regex query previously broke generation', () => {
        const paths = Object.keys(openApiDocument.paths ?? {});

        expect(paths).toContain('/boost/skills/search');
    });

    it('exposes a root-relative server URL that resolves on any tenant domain', () => {
        expect(openApiDocument.servers?.[0]?.url).toBe('/api');
    });

    it('documents the mutually exclusive managed refresh publication modes', () => {
        const operation = openApiDocument.paths?.['/credential-refresh/publish']?.post;
        const requestBody = operation?.requestBody;

        expect(requestBody).toBeDefined();
        expect(typeof requestBody).toBe('object');

        const content = requestBody && !('$ref' in requestBody) ? requestBody.content : undefined;
        const schema = content?.['application/json']?.schema;
        const oneOf = schema && !('$ref' in schema) ? schema.oneOf : undefined;

        expect(oneOf).toEqual([
            expect.objectContaining({
                properties: { mode: { const: 'issuer-signed' } },
                required: ['signedCredential'],
                not: {
                    anyOf: [{ required: ['credential'] }, { required: ['signingAuthority'] }],
                },
            }),
            expect.objectContaining({
                properties: { mode: { const: 'signing-authority' } },
                required: ['credential', 'signingAuthority'],
                not: { required: ['signedCredential'] },
            }),
        ]);
    });

    it.each([
        [
            'issuer-signed with signing-authority fields',
            {
                mode: 'issuer-signed',
                refreshId: 'refresh-1',
                signedCredential,
                credential: unsignedCredential,
                signingAuthority: { type: 'SigningAuthority' },
            },
        ],
        [
            'signing-authority with a signed credential',
            {
                mode: 'signing-authority',
                refreshId: 'refresh-1',
                credential: unsignedCredential,
                signingAuthority: { type: 'SigningAuthority' },
                signedCredential,
            },
        ],
    ])('rejects mixed publication payloads: %s', (_name, input) => {
        expect(PublishCredentialRefreshInputValidator.safeParse(input).success).toBe(false);
    });
});
