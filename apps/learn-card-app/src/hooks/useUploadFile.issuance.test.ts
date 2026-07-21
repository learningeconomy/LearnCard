// @vitest-environment node

import { readFile } from 'fs/promises';

import { describe, expect, it } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { UnsignedVCValidator } from '@learncard/types';

import { addCertificateAttachment } from './certificateAttachment';

describe('certificate attachment issuance', () => {
    it('issues a non-Boost credential with embedded certificate data', async () => {
        const wallet = await initLearnCard({
            seed: 'a'.repeat(64),
            didkit: readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
            ),
        });
        const issuerDid = wallet.id.did();
        const credential = addCertificateAttachment(
            {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                id: 'urn:uuid:79fd58b1-2b10-4d19-a057-244c7d748f55',
                type: ['VerifiableCredential'],
                issuer: issuerDid,
                issuanceDate: '2026-07-21T00:00:00.000Z',
                credentialSubject: { id: issuerDid },
            },
            {
                rawArtifact: {
                    type: 'certificate',
                    fileName: 'certificate.pdf',
                    fileSize: '1 KB',
                    fileType: 'PDF',
                    data: 'data:application/pdf;base64,Y2VydGlmaWNhdGU=',
                },
            }
        );
        const unsignedCredential = UnsignedVCValidator.parse(credential);

        expect(unsignedCredential).toHaveProperty(
            'attachments.0.data',
            'data:application/pdf;base64,Y2VydGlmaWNhdGU='
        );

        const signedCredential = await wallet.invoke.issueCredential(unsignedCredential);

        expect(signedCredential.proof).toBeDefined();
    }, 30_000);
});
