import {
    PublishCredentialRefreshInputValidator,
    SendBoostResponseValidator,
} from '@learncard/types';

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

    it('mounts the anonymous public share routes on paths distinct from the owner route', () => {
        const paths = Object.keys(openApiDocument.paths ?? {});

        // The import above would have thrown Duplicate procedure for the old
        // colliding GET /share-links/{id} registration.
        expect(paths.filter(path => path === '/share-links/{id}')).toHaveLength(1);
        expect(paths).toContain('/public/share-links/{id}');
        expect(paths).toContain('/public/share-links/{id}/content');
        expect(paths).toContain('/public/share-links/acknowledge-view');
    });

    it('mounts the bounded owner list on GET /share-links, distinct from /share-links/{id}', () => {
        const paths = Object.keys(openApiDocument.paths ?? {});

        // A collection path with no trailing segment cannot be captured by the
        // `{id}` param route, so /list -> /{id} shadowing is impossible.
        expect(paths.filter(path => path === '/share-links')).toHaveLength(1);
        expect(openApiDocument.paths?.['/share-links']?.get).toBeDefined();
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

    it('documents the unified send route with the refresh receipt in its response schema', () => {
        const paths = openApiDocument.paths ?? {};

        expect(paths['/send']).toBeDefined();

        // The managed receipt must survive response schema generation: the schema is
        // derived from SendBoostResponseValidator, which carries the optional receipt.
        const response = SendBoostResponseValidator.safeParse({
            type: 'boost',
            uri: 'https://localhost%3A3000/boost/abc',
            credentialUri: 'https://localhost%3A3000/credentials/def',
            activityId: 'activity-1',
            refresh: {
                refreshId: 'refresh-1',
                refreshService: {
                    id: 'https://localhost%3A3000/refresh/refresh-1',
                    type: 'LearnCardCredentialRefresh2026',
                    authorization: { type: 'LearnCardDIDAuth' },
                },
                credentialId: 'urn:uuid:credential-1',
                issuerDid: 'did:key:issuer',
                holderDid: 'did:key:holder',
                // Unknown keys ride along in the input but must be stripped by the
                // receipt validator, never silently persisted or returned.
                credentialSubject: { id: 'did:key:holder' },
            },
        });

        expect(response.success).toBe(true);

        if (response.success) {
            expect(response.data.refresh).toBeDefined();
            expect(response.data.refresh).not.toHaveProperty('credentialSubject');
            expect(response.data.refresh!.refreshId).toBe('refresh-1');
        }
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
