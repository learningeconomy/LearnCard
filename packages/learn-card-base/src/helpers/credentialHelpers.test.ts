import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            location: { hostname: 'localhost' },
            localStorage: {
                getItem: () => null,
                setItem: () => undefined,
                removeItem: () => undefined,
            },
        },
    });
});

const mocks = vi.hoisted(() => ({ sharedRead: vi.fn() }));

vi.mock('./walletHelpers', () => ({
    getBespokeLearnCard: async () => ({ read: { get: mocks.sharedRead } }),
}));

import {
    getEndorsements,
    getEndorsementsForVC,
    getEndorsementTargetId,
    resolveSharedCredential,
    getDefaultCategoryForCredential,
    getAllSortedCredentials,
    formatCredentialAwardedDate,
    getEvidenceAttachmentType,
    getEvidenceAttachments,
} from './credentialHelpers';
import {
    getNotificationType,
    NotificationTypeEnum,
} from '../components/notifications/notifications';

const createWallet = () => {
    const get = vi.fn();
    const read = vi.fn();

    return {
        wallet: {
            index: { LearnCloud: { get } },
            read: { get: read },
        } as never,

        get,
        read,
    };
};
beforeEach(() => {
    vi.clearAllMocks();
});

describe('getEndorsements', () => {
    it('loads an existing endorsement from its canonical original credential link', async () => {
        const { wallet, get, read } = createWallet();
        const record = { id: 'record-1', uri: 'lc:endorsement:1' };
        const endorsement = { id: 'urn:uuid:endorsement-1' };
        get.mockResolvedValue([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsements(wallet, { id: 'urn:uuid:original-1' } as never)
        ).resolves.toEqual([{ endorsement, metadata: record }]);
        expect(get).toHaveBeenCalledWith({
            originalCredentialId: 'urn:uuid:original-1',
        });
    });

    it('falls back to the displayed credential id for wrapped credentials', async () => {
        const { wallet, get, read } = createWallet();
        const record = {
            id: 'record-2',
            uri: 'lc:endorsement:2',
            credentialId: 'urn:uuid:wrapper-credential',
            originalCredentialId: 'urn:uuid:inner-credential',
        };
        const endorsement = { id: 'urn:uuid:endorsement-2' };
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsements(wallet, { id: 'urn:uuid:wrapper-credential' } as never)
        ).resolves.toEqual([{ endorsement, metadata: record }]);
        expect(get).toHaveBeenNthCalledWith(1, {
            originalCredentialId: 'urn:uuid:wrapper-credential',
        });
        expect(get).toHaveBeenNthCalledWith(2, {
            credentialId: 'urn:uuid:wrapper-credential',
        });
    });

    it('uses the shared credential to isolate legacy subject-indexed endorsements', async () => {
        const { wallet, get, read } = createWallet();
        const record = {
            id: 'record-legacy',
            uri: 'lc:endorsement:legacy',
            sharedUri: 'uri=lc%3Ashared&seed=seed&pin=1234',
        };
        const endorsement = { id: 'urn:uuid:endorsement-legacy' };
        const credential = {
            id: 'urn:uuid:credential-a',
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: {
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:example:holder' },
            },
        };
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([record]);
        mocks.sharedRead.mockResolvedValue({
            verifiableCredential: [{ id: 'urn:uuid:credential-a' }],
        });
        read.mockResolvedValue(endorsement);

        await expect(getEndorsements(wallet, credential as never)).resolves.toEqual([
            { endorsement, metadata: record },
        ]);
        expect(get).toHaveBeenNthCalledWith(3, { endorsedId: 'did:example:holder' });

        get.mockReset();
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([record]);

        await expect(
            getEndorsements(wallet, {
                ...credential,
                id: 'urn:uuid:credential-b',
            } as never)
        ).resolves.toEqual([]);
    });

    it('merges current and verified legacy endorsements for the same credential', async () => {
        const { wallet, get, read } = createWallet();
        const currentRecord = {
            id: 'record-current',
            uri: 'lc:endorsement:current',
            originalCredentialId: 'urn:uuid:credential-a',
        };
        const legacyRecord = {
            id: 'record-legacy',
            uri: 'lc:endorsement:legacy',
            sharedUri: 'uri=lc%3Ashared&seed=seed&pin=1234',
        };
        const currentEndorsement = { id: 'urn:uuid:endorsement-current' };
        const legacyEndorsement = { id: 'urn:uuid:endorsement-legacy' };
        const credential = {
            id: 'urn:uuid:credential-a',
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: {
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:example:holder' },
            },
        };
        get.mockResolvedValueOnce([currentRecord])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([legacyRecord]);
        mocks.sharedRead.mockResolvedValue({
            verifiableCredential: [{ id: 'urn:uuid:credential-a' }],
        });
        read.mockImplementation(async uri =>
            uri === currentRecord.uri ? currentEndorsement : legacyEndorsement
        );

        await expect(getEndorsements(wallet, credential as never)).resolves.toEqual([
            { endorsement: currentEndorsement, metadata: currentRecord },
            { endorsement: legacyEndorsement, metadata: legacyRecord },
        ]);
    });

    it('does not resolve a legacy record already returned by a current index', async () => {
        const { wallet, get, read } = createWallet();
        const duplicateRecord = {
            id: 'record-current',
            uri: 'lc:endorsement:current',
            originalCredentialId: 'urn:uuid:credential-a',
            sharedUri: 'uri=lc%3Ashared&seed=seed&pin=1234',
        };
        const endorsement = { id: 'urn:uuid:endorsement-current' };
        const credential = {
            id: 'urn:uuid:credential-a',
            credentialSubject: { id: 'did:example:holder' },
        };
        get.mockResolvedValueOnce([duplicateRecord])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([duplicateRecord]);
        read.mockResolvedValue(endorsement);

        await expect(getEndorsements(wallet, credential as never)).resolves.toEqual([
            { endorsement, metadata: duplicateRecord },
        ]);
        expect(mocks.sharedRead).not.toHaveBeenCalled();
    });

    it('loads endorsements for an idless credential through its content identity', async () => {
        const { wallet, get, read } = createWallet();
        const idlessCredential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:holder' },
            proof: { type: 'Ed25519Signature2020', proofValue: 'zExample' },
        } as never;
        const record = { id: 'record-idless', uri: 'lc:endorsement:idless' };
        const endorsement = { id: 'urn:uuid:endorsement-idless' };
        get.mockResolvedValueOnce([record]).mockResolvedValueOnce([]);
        read.mockResolvedValue(endorsement);

        const targetId = await getEndorsementTargetId(idlessCredential);

        await expect(getEndorsements(wallet, idlessCredential)).resolves.toEqual([
            { endorsement, metadata: record },
        ]);
        expect(targetId).toMatch(/^urn:sha256:[0-9a-f]{64}$/);
        expect(get).toHaveBeenNthCalledWith(1, { originalCredentialId: targetId });
        expect(get).toHaveBeenNthCalledWith(2, { credentialId: targetId });
    });
});

describe('getEndorsementTargetId', () => {
    it('preserves explicit ids and ignores local display metadata in content ids', async () => {
        await expect(
            getEndorsementTargetId({ id: 'urn:uuid:credential-a' } as never)
        ).resolves.toBe('urn:uuid:credential-a');

        const credential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:holder' },
            proof: { type: 'Ed25519Signature2020', proofValue: 'zExample' },
        };
        const contentId = await getEndorsementTargetId(credential as never);

        await expect(
            getEndorsementTargetId({
                ...credential,
                boostID: { backgroundImage: 'local-display-only' },
            } as never)
        ).resolves.toBe(contentId);
        expect(contentId).toMatch(/^urn:sha256:[0-9a-f]{64}$/);
    });
});

describe('resolveSharedCredential', () => {
    it('shares an in-flight read for the same presentation', async () => {
        const request = Promise.withResolvers<{
            verifiableCredential: { id: string };
        }>();
        const sharedUri = 'uri=lc%3Ashared&seed=seed&pin=1234';
        mocks.sharedRead.mockReturnValue(request.promise);

        const first = resolveSharedCredential(sharedUri);
        const second = resolveSharedCredential(sharedUri);

        await vi.waitFor(() => expect(mocks.sharedRead).toHaveBeenCalledOnce());
        request.resolve({ verifiableCredential: { id: 'urn:uuid:credential-a' } });

        await expect(Promise.all([first, second])).resolves.toEqual([
            { id: 'urn:uuid:credential-a' },
            { id: 'urn:uuid:credential-a' },
        ]);
    });
});

describe('getEndorsementsForVC', () => {
    it('includes public canonical endorsements and excludes private ones', async () => {
        const { wallet, get, read } = createWallet();
        const publicRecord = {
            id: 'record-public',
            uri: 'lc:endorsement:public',
            visibility: 'public',
        };
        const privateRecord = {
            id: 'record-private',
            uri: 'lc:endorsement:private',
            visibility: 'private',
        };
        const publicEndorsement = { id: 'urn:uuid:endorsement-public' };
        get.mockResolvedValue([publicRecord, privateRecord]);
        read.mockResolvedValue(publicEndorsement);

        await expect(
            getEndorsementsForVC(wallet, { id: 'urn:uuid:original-1' } as never)
        ).resolves.toEqual([publicEndorsement]);
        expect(get).toHaveBeenCalledWith({
            originalCredentialId: 'urn:uuid:original-1',
        });
        expect(read).toHaveBeenCalledOnce();
        expect(read).toHaveBeenCalledWith(publicRecord.uri);
    });

    it('falls back to the displayed credential id for wrapped credentials', async () => {
        const { wallet, get, read } = createWallet();
        const record = {
            id: 'record-wrapper',
            uri: 'lc:endorsement:wrapper',
            credentialId: 'urn:uuid:wrapper-credential',
            originalCredentialId: 'urn:uuid:inner-credential',
            visibility: 'public',
        };
        const endorsement = { id: 'urn:uuid:endorsement-wrapper' };
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsementsForVC(wallet, { id: 'urn:uuid:wrapper-credential' } as never)
        ).resolves.toEqual([endorsement]);
        expect(get).toHaveBeenNthCalledWith(1, {
            originalCredentialId: 'urn:uuid:wrapper-credential',
        });
        expect(get).toHaveBeenNthCalledWith(2, {
            credentialId: 'urn:uuid:wrapper-credential',
        });
    });

    it('falls back when canonical endorsements do not match the requested visibility', async () => {
        const { wallet, get, read } = createWallet();
        const privateCanonicalRecord = {
            id: 'record-private-canonical',
            uri: 'lc:endorsement:private-canonical',
            visibility: 'private',
        };
        const publicWrapperRecord = {
            id: 'record-public-wrapper',
            uri: 'lc:endorsement:public-wrapper',
            credentialId: 'urn:uuid:wrapper-credential',
            originalCredentialId: 'urn:uuid:inner-credential',
            visibility: 'public',
        };
        const publicEndorsement = { id: 'urn:uuid:endorsement-public-wrapper' };
        get.mockResolvedValueOnce([privateCanonicalRecord]).mockResolvedValueOnce([
            publicWrapperRecord,
        ]);
        read.mockResolvedValue(publicEndorsement);

        await expect(
            getEndorsementsForVC(wallet, { id: 'urn:uuid:wrapper-credential' } as never)
        ).resolves.toEqual([publicEndorsement]);
        expect(get).toHaveBeenNthCalledWith(1, {
            originalCredentialId: 'urn:uuid:wrapper-credential',
        });
        expect(get).toHaveBeenNthCalledWith(2, {
            credentialId: 'urn:uuid:wrapper-credential',
        });
        expect(read).toHaveBeenCalledWith(publicWrapperRecord.uri);
    });
    it('includes public endorsements for an idless credential when sharing', async () => {
        const { wallet, get, read } = createWallet();
        const credential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:holder' },
            proof: { type: 'Ed25519Signature2020', proofValue: 'zExample' },
        } as never;
        const publicRecord = {
            id: 'record-idless-public',
            uri: 'lc:endorsement:idless-public',
            visibility: 'public',
        };
        const endorsement = { id: 'urn:uuid:endorsement-idless-public' };
        get.mockResolvedValueOnce([publicRecord]).mockResolvedValueOnce([]);
        read.mockResolvedValue(endorsement);

        await expect(getEndorsementsForVC(wallet, credential)).resolves.toEqual([endorsement]);
    });
});

describe('Qualifications classification', () => {
    const qualification = (achievementType: string, tags?: string[]) => ({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:qualification',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: 'did:example:issuer',
        validFrom: '2025-01-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:holder',
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:achievement',
                type: ['Achievement'],
                name: 'Professional qualification',
                description: 'Qualification awarded by the issuer.',
                criteria: { narrative: 'Complete the requirements.' },
                achievementType,
                ...(tags ? { tag: tags } : {}),
            },
        },
    });

    it.each([
        'License',
        'Certification',
        'JourneymanCertificate',
        'MasterCertificate',
        'ApprenticeshipCertificate',
    ])('places %s in Qualifications without changing the credential', achievementType => {
        const credential = qualification(achievementType);
        const original = structuredClone(credential);
        expect(getDefaultCategoryForCredential(credential as never)).toBe('Qualifications');
        expect(credential).toEqual(original);
    });

    it.each(['expirationDate', 'validUntil'])(
        'keeps expired credentials in Qualifications with %s',
        expirationField => {
            const credential = {
                ...qualification('License'),
                [expirationField]: '2025-02-01T00:00:00Z',
            };
            expect(getDefaultCategoryForCredential(credential as never)).toBe('Qualifications');
        }
    );

    it('preserves an explicit issuer category override', () => {
        expect(
            getDefaultCategoryForCredential(qualification('License', ['lc:category:ID']) as never)
        ).toBe('ID');
    });

    it('allows an explicit Qualifications category on another achievement type', () => {
        expect(
            getDefaultCategoryForCredential(
                qualification('Certificate', ['lc:category:Qualifications']) as never
            )
        ).toBe('Qualifications');
    });

    it('classifies a wrapped qualification using the inner credential', () => {
        expect(
            getDefaultCategoryForCredential({
                type: ['VerifiableCredential', 'CertifiedBoostCredential'],
                boostCredential: qualification('JourneymanCertificate'),
            } as never)
        ).toBe('Qualifications');
    });

    it('preserves custom category overrides', () => {
        expect(
            getDefaultCategoryForCredential(qualification('ext:LCA_CUSTOM:ID:License') as never)
        ).toBe('ID');
    });

    it.each([
        ['Certificate', 'Achievement'],
        ['CertificateOfCompletion', 'Learning History'],
        ['ext:DriversLicense', 'ID'],
        ['ext:Passport', 'ID'],
    ])('does not reclassify %s as a professional qualification', (achievementType, category) => {
        expect(getDefaultCategoryForCredential(qualification(achievementType) as never)).toBe(
            category
        );
    });
});

describe('Qualifications share-picker grouping', () => {
    it('makes Qualifications credentials available in their own share category', async () => {
        const credential = {
            type: ['VerifiableCredential'],
            credentialSubject: {
                achievement: { achievementType: 'License' },
            },
        } as never;

        const sorted = await getAllSortedCredentials([credential]);

        expect(sorted.qualifications).toEqual([credential]);
        expect(sorted.achievements).toEqual([]);
    });
});

describe('Qualifications notifications', () => {
    it('classifies standard and custom Qualifications notifications separately', () => {
        expect(getNotificationType('License')).toBe(NotificationTypeEnum.Qualifications);
        expect(getNotificationType('ext:LCA_CUSTOM:Qualifications:Continuing_Education')).toBe(
            NotificationTypeEnum.Qualifications
        );
    });
});

describe('credential award date display', () => {
    it('prefers the standard top-level awardedDate without changing the credential', () => {
        const credential = {
            awardedDate: '2027-10-01T00:00:00.000Z',
            validFrom: '2026-10-26T12:00:00.000Z',
            credentialSubject: { id: 'did:example:learner' },
        } as never;
        expect(formatCredentialAwardedDate(credential)).toBe('October 01, 2027');
        expect(credential).toHaveProperty('validFrom', '2026-10-26T12:00:00.000Z');
    });

    it.each([
        [{ issuanceDate: '2026-10-26' }, 'October 26, 2026'],
        [{ validFrom: '2026-10-26' }, 'October 26, 2026'],
        [{ awardedDate: 'invalid', validFrom: '2026-10-26' }, 'October 26, 2026'],
        [{ awardedDate: '' }, ''],
        [{}, ''],
        [{ validFrom: 'invalid' }, ''],
        [undefined, ''],
        [
            { boostCredential: { awardedDate: '2027-10-01', validFrom: '2026-10-26' } },
            'October 01, 2027',
        ],
    ])('handles legacy, wrapped, missing and invalid dates: %j', (credential, expected) => {
        expect(formatCredentialAwardedDate(credential as never)).toBe(expected);
    });

    it('keeps the award day aligned with UTC spreadsheet editing across timezones', () => {
        expect(formatCredentialAwardedDate({ awardedDate: '2027-10-01T00:00:00Z' } as never)).toBe(
            'October 01, 2027'
        );
        expect(
            formatCredentialAwardedDate({ awardedDate: '2027-10-01T23:30:00-02:00' } as never)
        ).toBe('October 02, 2027');
    });
});

describe('evidence attachment classification', () => {
    it.each([
        ['https://evidence.example.test/course/12', 'link'],
        ['https://portfolio.example.test/ada', 'link'],
        ['https://drive.google.com/file/d/example/view', 'link'],
        ['https://docs.google.com/document/d/example/edit', 'link'],
        ['https://example.test/report.pdf?download=1', 'document'],
        ['https://example.test/photo.PNG?download=1', 'photo'],
        ['data:application/pdf;base64,AAAA', 'document'],
        ['An explanation with no link', 'text'],
        ['', 'text'],
    ])('classifies %s as %s', async (url, expected) => {
        const fetch = vi
            .spyOn(globalThis, 'fetch')
            .mockRejectedValue(new Error('No network in test'));
        try {
            expect(await getEvidenceAttachmentType(url)).toBe(expected);
        } finally {
            fetch.mockRestore();
        }
    });

    it('still recognizes known video hosts even if optional metadata is unavailable', async () => {
        const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
        try {
            for (const url of [
                'https://youtu.be/abc123',
                'https://vimeo.com/12345',
                'https://www.loom.com/share/abc123',
            ]) {
                expect(await getEvidenceAttachmentType(url)).toBe('video');
            }
        } finally {
            fetch.mockRestore();
        }
    });

    it('keeps two independently mapped plain evidence URLs as clickable links', async () => {
        const attachments = await getEvidenceAttachments([
            { id: 'https://evidence.example.test/course', type: ['Evidence'], name: 'Evidence' },
            { id: 'https://portfolio.example.test/ada', type: ['Evidence'], name: 'Portfolio' },
        ] as never);
        expect(attachments).toEqual([
            expect.objectContaining({
                title: 'Evidence',
                type: 'link',
                url: 'https://evidence.example.test/course',
            }),
            expect.objectContaining({
                title: 'Portfolio',
                type: 'link',
                url: 'https://portfolio.example.test/ada',
            }),
        ]);
    });
});

it('preserves explicit media genres when URLs cannot identify the uploaded type', async () => {
    const attachments = await getEvidenceAttachments([
        {
            id: 'https://files.example.test/opaque',
            type: ['Evidence'],
            genre: 'video',
            name: 'Recorded work',
        },
        {
            id: 'https://files.example.test/opaque2',
            type: ['EvidenceFile'],
            genre: 'document',
            name: 'Report',
        },
    ] as never);
    expect(attachments?.map(item => item.type)).toEqual(['video', 'document']);
});
