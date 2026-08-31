import { describe, it, expect } from 'vitest';

import { IssueEndpointValidator } from './validators';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:key:z6Mkk16aKmGEVkeFu83FsP5bwELFWNf6hqRQhJxxSjrndyFv',
    issuanceDate: '2020-08-19T21:41:50Z',
    credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
};

describe('IssueEndpointValidator', () => {
    it('accepts a request without options', async () => {
        const result = await IssueEndpointValidator.spa({ credential });

        expect(result.success).toBe(true);
    });

    it("accepts proofFormat 'ldp' (DIDKit's linked-data value)", async () => {
        const result = await IssueEndpointValidator.spa({
            credential,
            options: { proofFormat: 'ldp' },
        });

        expect(result.success).toBe(true);
    });

    it.each(['ld', 'jwt'])("rejects unsupported proofFormat '%s'", async proofFormat => {
        const result = await IssueEndpointValidator.spa({
            credential,
            options: { proofFormat },
        });

        expect(result.success).toBe(false);
    });
});
