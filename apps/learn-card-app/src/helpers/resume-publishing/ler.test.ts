import { describe, expect, it } from 'vitest';
import type { VC } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base/types/boostAndCredentialMetadata';
import { buildLerPayloadFromResume } from './ler';
import { visibleResumeContact } from './snapshot';
import type { ResumeBuilderSnapshot } from '../../stores/resumeBuilderStore';

describe('resume LER selection', () => {
    it('preserves complete original source context and proof', () => {
        const source = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                { custom: 'https://example.com/claim' },
            ],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            id: 'urn:credential:source',
            credentialSubject: {
                '@context': { nested: 'https://example.com/nested' },
                achievement: { name: 'Original source' },
            },
            proof: { proofValue: 'SOURCE SIGNATURE', verificationMethod: 'did:example:issuer#key' },
        } as unknown as VC;
        const original = structuredClone(source);
        const result = buildLerPayloadFromResume(
            [{ uri: 'lc:source', category: CredentialCategoryEnum.achievement, vc: source }],
            {
                did: 'did:example:owner',
                fullName: '',
                pdfUrl: 'urn:learncard:resume-pdf:attachment',
                pdfHash: 'a'.repeat(64),
                generatedAt: '2026-10-03T00:00:00.000Z',
            }
        );
        expect(result.certifications![0].verifiableCredential).toEqual(original);
        expect(source).toEqual(original);
    });
    it('includes entire protected descriptor while omitting hidden contact fields', () => {
        const snapshot = {
            personalDetails: { name: 'Secret name', email: 'secret@example.com' },
            hiddenPersonalDetails: { name: true, email: true },
        } as unknown as ResumeBuilderSnapshot;
        const descriptor = {
            url: 'urn:learncard:resume-pdf:attachment',
            mediaType: 'application/pdf',
            key: 'ENCRYPTED ONLY KEY',
            contentVersion: 3,
            shareId: 'owner-share',
            chunkCount: 2,
            sha256: 'a'.repeat(64),
            byteLength: 100,
            descriptions: ['LearnCard protected resume PDF v1'],
        };
        const result = buildLerPayloadFromResume([], {
            did: 'did:example:owner',
            ...visibleResumeContact(snapshot),
            pdfUrl: descriptor.url,
            pdfAttachment: descriptor,
            pdfHash: descriptor.sha256,
            generatedAt: '2026-10-03T00:00:00.000Z',
        });
        expect(result.attachments).toEqual([descriptor]);
        expect(JSON.stringify(result)).not.toContain('Secret name');
        expect(JSON.stringify(result)).not.toContain('secret@example.com');
    });
});
