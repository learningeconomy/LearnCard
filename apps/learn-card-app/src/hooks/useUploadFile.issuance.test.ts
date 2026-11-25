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

        expect(await wallet.invoke.verifyCredential(signedCredential)).toMatchObject({
            checks: expect.arrayContaining(['proof']),
            errors: [],
        });
        const tampered = structuredClone(signedCredential);
        tampered.attachments[0].data = 'data:application/pdf;base64,dGFtcGVyZWQ=';
        expect((await wallet.invoke.verifyCredential(tampered)).errors).not.toEqual([]);
    }, 30_000);

    it('issues a Boost credential that already uses the canonical attachment context', async () => {
        const wallet = await initLearnCard({
            seed: 'b'.repeat(64),
            didkit: readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
            ),
        });
        const issuerDid = wallet.id.did();
        const credential = addCertificateAttachment(
            {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    'https://ctx.learncard.com/boosts/1.0.3.json',
                ],
                id: 'urn:uuid:b8c9d0e1-0008-4000-8000-000000000001',
                type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
                name: 'Parsed Certificate',
                issuer: { id: issuerDid },
                validFrom: '2026-07-21T00:00:00.000Z',
                credentialSubject: {
                    id: issuerDid,
                    type: ['AchievementSubject'],
                    achievement: {
                        id: 'urn:uuid:b8c9d0e1-0008-4000-8000-000000000002',
                        type: ['Achievement'],
                        achievementType: 'Certificate',
                        name: 'Parsed Certificate',
                        description: 'Extracted from an uploaded certificate.',
                        criteria: { narrative: 'Certificate evidence provided.' },
                    },
                },
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

        const signedCredential = await wallet.invoke.issueCredential(unsignedCredential);
        expect(await wallet.invoke.verifyCredential(signedCredential)).toMatchObject({
            checks: expect.arrayContaining(['proof']),
            errors: [],
        });
        const tampered = structuredClone(signedCredential);
        tampered.attachments[0].data = 'data:application/pdf;base64,dGFtcGVyZWQ=';
        expect((await wallet.invoke.verifyCredential(tampered)).errors).not.toEqual([]);
    }, 30_000);
});
