import { describe, expect, it } from 'vitest';
import { buildLinkedInCertificationUrl, buildLinkedInPostUrl } from './linkedInSharing';

const input = {
    name: 'Leadership & enterprise',
    issuer: 'Example School',
    issuedAt: '2026-05-31T23:00:00Z',
    shareLink: 'https://tenant.example/share-boost?uri=one&seed=two&pin=1234',
};

describe('LinkedIn sharing URLs', () => {
    it('links the certification to the issuer organization and keeps the credential identity', () => {
        const url = new URL(
            buildLinkedInCertificationUrl({
                ...input,
                organizationId: '12345',
                credentialId: 'urn:uuid:credential',
                credentialRecordUri: 'lc:credential:fallback',
            })
        );
        expect(url.searchParams.get('organizationId')).toBe('12345');
        expect(url.searchParams.has('organizationName')).toBe(false);
        expect(url.searchParams.get('name')).toBe(input.name);
        expect(url.searchParams.get('certUrl')).toBe(input.shareLink);
        expect(url.searchParams.get('certId')).toBe('urn:uuid:credential');
        expect(url.searchParams.get('issueYear')).toBe('2026');
        expect(url.searchParams.get('issueMonth')).toBe('5');
    });

    it.each([undefined, '', 'example-school', '12&organizationId=34'])(
        'uses the issuer name rather than an invalid organization ID (%s)',
        organizationId => {
            const url = new URL(buildLinkedInCertificationUrl({ ...input, organizationId }));
            expect(url.searchParams.has('organizationId')).toBe(false);
            expect(url.searchParams.get('organizationName')).toBe(input.issuer);
        }
    );

    it('uses a unique credential record URI when there is no credential ID', () => {
        const params = { ...input, credentialRecordUri: 'lc:credential:record-1' };
        const first = new URL(buildLinkedInCertificationUrl(params));
        const second = new URL(
            buildLinkedInCertificationUrl({
                ...params,
                credentialRecordUri: 'lc:credential:record-2',
            })
        );
        expect(first.searchParams.get('certId')).toBe('lc:credential:record-1');
        expect(second.searchParams.get('certId')).toBe('lc:credential:record-2');
    });

    it.each(['credentialId', 'credentialRecordUri'] as const)(
        'keeps deterministic IDs up to LinkedIn’s 80-character limit (%s)',
        source => {
            const value = 'x'.repeat(80);
            const url = new URL(buildLinkedInCertificationUrl({ ...input, [source]: value }));
            expect(url.searchParams.get('certId')).toBe(value);
            expect(url.searchParams.get('certUrl')).toBe(input.shareLink);
        }
    );

    it.each(['credentialId', 'credentialRecordUri'] as const)(
        'omits overlong IDs instead of truncating them (%s)',
        source => {
            const value =
                'lc:network:staging.network.learncard.com/trpc:credential:b4ea57d7-887a-4f45-b18a-7c7b6b52cede';
            expect(value.length).toBeGreaterThan(80);
            const params = { ...input, [source]: value };
            const first = new URL(buildLinkedInCertificationUrl(params));
            const second = new URL(buildLinkedInCertificationUrl(params));
            expect(first.searchParams.has('certId')).toBe(false);
            expect(second.searchParams.has('certId')).toBe(false);
            expect(first.searchParams.get('certUrl')).toBe(input.shareLink);
        }
    );

    it.each(['credentialId', 'credentialRecordUri'] as const)(
        'omits an 81-character ID while retaining the complete viewing URL (%s)',
        source => {
            const link = `${input.shareLink}&preview=public-preview`;
            const url = new URL(
                buildLinkedInCertificationUrl({
                    ...input,
                    [source]: 'x'.repeat(81),
                    shareLink: link,
                })
            );
            expect(url.searchParams.has('certId')).toBe(false);
            expect(url.searchParams.get('certUrl')).toBe(link);
        }
    );

    it('omits a missing credential ID and invalid or missing issuance dates', () => {
        const url = new URL(buildLinkedInCertificationUrl({ ...input, issuedAt: 'not-a-date' }));
        expect(url.searchParams.has('certId')).toBe(false);
        expect(url.searchParams.has('issueYear')).toBe(false);
        expect(url.searchParams.has('issueMonth')).toBe(false);
        const undated = new URL(buildLinkedInCertificationUrl({ ...input, issuedAt: undefined }));
        expect(undated.searchParams.has('issueYear')).toBe(false);
    });

    it('opens the LinkedIn composer with the complete share URL, including its preview', () => {
        const link = `${input.shareLink}&preview=public-preview`;
        const url = new URL(buildLinkedInPostUrl(link));
        expect(url.origin + url.pathname).toBe('https://www.linkedin.com/sharing/share-offsite/');
        expect(url.searchParams.get('url')).toBe(link);
    });
});
