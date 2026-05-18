import { SignJWT, generateKeyPair } from 'jose';

import { storeAcceptedCredentials } from './store';
import { AcceptedCredentialResult } from './types';
import { LearnCard } from '@learncard/core';

const signVcJwt = async (payload: Record<string, unknown>): Promise<string> => {
    const { privateKey } = await generateKeyPair('EdDSA', { extractable: true });
    return new SignJWT(payload).setProtectedHeader({ alg: 'EdDSA' }).sign(privateKey);
};

const makeLearnCard = (overrides: {
    upload?: jest.Mock;
    uploadEncrypted?: jest.Mock;
    add?: jest.Mock;
    storage?: string;
} = {}) => {
    const storage = overrides.storage ?? 'LearnCloud';
    return {
        store: {
            [storage]: {
                upload: overrides.upload,
                uploadEncrypted: overrides.uploadEncrypted,
            },
        },
        index: {
            [storage]: {
                add: overrides.add,
            },
        },
    } as unknown as LearnCard<any, any, any>;
};

const baseAccepted = async (overrides: Partial<AcceptedCredentialResult> = {}): Promise<AcceptedCredentialResult> => {
    const jwt = await signVcJwt({
        iss: 'did:web:issuer.example.com',
        sub: 'did:key:z6Mkholder',
        nbf: 1_700_000_000,
        vc: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            credentialSubject: { name: 'Alice' },
        },
    });

    return {
        credentials: [
            {
                format: 'jwt_vc_json',
                credential: jwt,
                configuration_id: 'OpenBadge_jwt_vc_json',
            },
        ],
        ...overrides,
    };
};

describe('storeAcceptedCredentials', () => {
    it('uploads each credential and indexes it with a computed category', async () => {
        const upload = jest.fn().mockResolvedValue('lc:network:abc');
        const add = jest.fn().mockResolvedValue(true);
        const learnCard = makeLearnCard({ uploadEncrypted: upload, add });

        const accepted = await baseAccepted();
        const result = await storeAcceptedCredentials(learnCard, accepted);

        expect(result.failures).toEqual([]);
        expect(result.stored).toHaveLength(1);
        expect(result.stored[0].uri).toBe('lc:network:abc');
        expect(result.stored[0].configurationId).toBe('OpenBadge_jwt_vc_json');
        expect(result.stored[0].format).toBe('jwt_vc_json');

        // Default encrypt=true → uses uploadEncrypted
        expect(upload).toHaveBeenCalledTimes(1);
        const [uploadedVc] = upload.mock.calls[0];
        expect(uploadedVc.type).toEqual(['VerifiableCredential', 'OpenBadgeCredential']);
        expect(uploadedVc.issuer).toBe('did:web:issuer.example.com');
        expect(uploadedVc.proof).toEqual(expect.objectContaining({ type: 'JwtProof2020' }));

        // Index record shape
        expect(add).toHaveBeenCalledTimes(1);
        const [record] = add.mock.calls[0];
        expect(record).toEqual(
            expect.objectContaining({
                uri: 'lc:network:abc',
                category: 'Achievement',
                __v: 1,
            })
        );
        expect(typeof record.id).toBe('string');
        expect(record.id.length).toBeGreaterThan(0);
    });

    it('falls back to `upload` when encryption is disabled', async () => {
        const upload = jest.fn().mockResolvedValue('lc:network:plain');
        const uploadEncrypted = jest.fn();
        const add = jest.fn().mockResolvedValue(true);
        const learnCard = makeLearnCard({ upload, uploadEncrypted, add });

        const accepted = await baseAccepted();
        await storeAcceptedCredentials(learnCard, accepted, { encrypt: false });

        expect(upload).toHaveBeenCalledTimes(1);
        expect(uploadEncrypted).not.toHaveBeenCalled();
    });

    it('falls back to `upload` when the store plugin has no uploadEncrypted', async () => {
        const upload = jest.fn().mockResolvedValue('lc:network:plain');
        const add = jest.fn().mockResolvedValue(true);
        const learnCard = makeLearnCard({ upload, add }); // no uploadEncrypted

        const accepted = await baseAccepted();
        const result = await storeAcceptedCredentials(learnCard, accepted);

        expect(result.failures).toEqual([]);
        expect(upload).toHaveBeenCalledTimes(1);
    });

    it('honors a caller-supplied category override (string)', async () => {
        const add = jest.fn().mockResolvedValue(true);
        const learnCard = makeLearnCard({
            uploadEncrypted: jest.fn().mockResolvedValue('uri'),
            add,
        });

        await storeAcceptedCredentials(learnCard, await baseAccepted(), { category: 'ID' });

        expect(add.mock.calls[0][0].category).toBe('ID');
    });

    it('honors a caller-supplied category function', async () => {
        const add = jest.fn().mockResolvedValue(true);
        const learnCard = makeLearnCard({
            uploadEncrypted: jest.fn().mockResolvedValue('uri'),
            add,
        });

        const accepted = await baseAccepted();
        await storeAcceptedCredentials(learnCard, accepted, {
            category: vc => (Array.isArray(vc.type) && vc.type.includes('OpenBadgeCredential') ? 'Badges' : 'Other'),
        });

        expect(add.mock.calls[0][0].category).toBe('Badges');
    });

    it('infers default category from a VCDM ID credential', async () => {
        const add = jest.fn().mockResolvedValue(true);
        const learnCard = makeLearnCard({
            uploadEncrypted: jest.fn().mockResolvedValue('uri'),
            add,
        });

        const jwt = await signVcJwt({
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential', 'IdentityCredential'],
                credentialSubject: { id: 'did:key:z6M' },
            },
        });

        await storeAcceptedCredentials(
            learnCard,
            {
                credentials: [
                    { format: 'jwt_vc_json', credential: jwt, configuration_id: 'ID_jwt_vc_json' },
                ],
            }
        );

        expect(add.mock.calls[0][0].category).toBe('ID');
    });

    it('includes optional title and imgUrl when provided', async () => {
        const add = jest.fn().mockResolvedValue(true);
        const learnCard = makeLearnCard({
            uploadEncrypted: jest.fn().mockResolvedValue('uri'),
            add,
        });

        await storeAcceptedCredentials(learnCard, await baseAccepted(), {
            title: 'My Badge',
            imgUrl: 'https://example.com/img.png',
        });

        const record = add.mock.calls[0][0];
        expect(record.title).toBe('My Badge');
        expect(record.imgUrl).toBe('https://example.com/img.png');
    });

    it('throws store_plane_missing when the store plugin is absent', async () => {
        const learnCard = { store: {}, index: {} } as unknown as LearnCard<any, any, any>;

        const accepted = await baseAccepted();

        await expect(
            storeAcceptedCredentials(learnCard, accepted)
        ).rejects.toMatchObject({ code: 'store_plane_missing' });
    });

    it('throws index_plane_missing when the index plugin is absent', async () => {
        const learnCard = {
            store: { LearnCloud: { uploadEncrypted: jest.fn().mockResolvedValue('uri') } },
            index: {},
        } as unknown as LearnCard<any, any, any>;

        const accepted = await baseAccepted();

        await expect(
            storeAcceptedCredentials(learnCard, accepted)
        ).rejects.toMatchObject({ code: 'index_plane_missing' });
    });

    it('isolates per-credential failures so one bad credential does not abort the batch', async () => {
        const jwtGood = await signVcJwt({
            vc: {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:key:z6M' },
            },
        });

        const upload = jest
            .fn()
            // first call: good
            .mockResolvedValueOnce('lc:network:one')
            // second call: good (but add will fail)
            .mockResolvedValueOnce('lc:network:two')
            // third call: good
            .mockResolvedValueOnce('lc:network:three');

        const add = jest
            .fn()
            .mockResolvedValueOnce(true)
            .mockRejectedValueOnce(new Error('index write failed'))
            .mockResolvedValueOnce(true);

        const learnCard = makeLearnCard({ uploadEncrypted: upload, add });

        const accepted: AcceptedCredentialResult = {
            credentials: [
                { format: 'jwt_vc_json', credential: jwtGood, configuration_id: 'a' },
                { format: 'jwt_vc_json', credential: jwtGood, configuration_id: 'b' },
                { format: 'jwt_vc_json', credential: jwtGood, configuration_id: 'c' },
            ],
        };

        const result = await storeAcceptedCredentials(learnCard, accepted);

        expect(result.stored).toHaveLength(2);
        expect(result.stored.map(s => s.configurationId)).toEqual(['a', 'c']);
        expect(result.failures).toHaveLength(1);
        expect(result.failures[0]).toMatchObject({
            configurationId: 'b',
            error: expect.objectContaining({ code: 'index_failed' }),
        });
    });

    it('captures unsupported formats as per-credential failures', async () => {
        const add = jest.fn();
        const upload = jest.fn();
        const learnCard = makeLearnCard({ uploadEncrypted: upload, add });

        const accepted: AcceptedCredentialResult = {
            credentials: [
                {
                    format: 'mso_mdoc',
                    credential: 'some-cbor-base64',
                    configuration_id: 'mdl',
                },
            ],
        };

        const result = await storeAcceptedCredentials(learnCard, accepted);

        expect(result.stored).toEqual([]);
        expect(result.failures).toHaveLength(1);
        expect(result.failures[0]).toMatchObject({
            configurationId: 'mdl',
            format: 'mso_mdoc',
            error: expect.objectContaining({ code: 'unsupported_format' }),
        });
        expect(upload).not.toHaveBeenCalled();
        expect(add).not.toHaveBeenCalled();
    });

    it('treats an empty upload URI as a failure', async () => {
        const upload = jest.fn().mockResolvedValue('');
        const add = jest.fn();
        const learnCard = makeLearnCard({ uploadEncrypted: upload, add });

        const result = await storeAcceptedCredentials(learnCard, await baseAccepted());

        expect(result.stored).toEqual([]);
        expect(result.failures[0].error.code).toBe('store_failed');
        expect(add).not.toHaveBeenCalled();
    });

    it('respects the caller-supplied upload / addToIndex callbacks', async () => {
        const upload = jest.fn().mockResolvedValue('custom:uri');
        const addToIndex = jest.fn().mockResolvedValue(undefined);
        const learnCard = { store: {}, index: {} } as unknown as LearnCard<any, any, any>;

        const result = await storeAcceptedCredentials(learnCard, await baseAccepted(), {
            upload,
            addToIndex,
        });

        expect(result.failures).toEqual([]);
        expect(upload).toHaveBeenCalledTimes(1);
        expect(addToIndex).toHaveBeenCalledTimes(1);
        expect(result.stored[0].uri).toBe('custom:uri');
    });

    describe('SD-JWT-VC delegation', () => {
        const makeLearnCardWithSdJwt = (
            parseFn?: jest.Mock,
            categorizeFn?: jest.Mock
        ) => {
            const invoke: Record<string, unknown> = {};
            if (parseFn) invoke.parseSdJwtVc = parseFn;
            if (categorizeFn) invoke.categorizeSdJwtVct = categorizeFn;
            return {
                store: { LearnCloud: { uploadEncrypted: jest.fn().mockResolvedValue('lc:abc') } },
                index: { LearnCloud: { add: jest.fn().mockResolvedValue(true) } },
                invoke,
            } as unknown as LearnCard<any, any, any>;
        };

        const sdJwtAccepted = (format = 'dc+sd-jwt'): AcceptedCredentialResult => ({
            credentials: [
                {
                    format,
                    credential:
                        'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.payload.sig~',
                    configuration_id: 'TestSdJwtVc',
                },
            ],
        });

        const fakeParsed = {
            vct: 'https://ca.gov/credentials/career-passport-test',
            issuer: 'did:web:issuer.example.com',
            issuedAt: new Date('2024-01-01T00:00:00.000Z'),
            claims: {
                iss: 'did:web:issuer.example.com',
                iat: 1704067200,
                vct: 'https://ca.gov/credentials/career-passport-test',
                given_name: 'Ada',
            },
            header: { alg: 'EdDSA', typ: 'dc+sd-jwt', kid: 'did:web:issuer.example.com#key-1' },
            rawSdJwt: 'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.payload.sig~',
            hasKeyBinding: false,
        };

        it('delegates parse to the sd-jwt-vc plugin and category to categorizeSdJwtVct', async () => {
            const parseFn = jest.fn().mockResolvedValue(fakeParsed);
            const categorizeFn = jest.fn().mockReturnValue('ID');
            const learnCard = makeLearnCardWithSdJwt(parseFn, categorizeFn);

            const result = await storeAcceptedCredentials(learnCard, sdJwtAccepted());

            expect(result.failures).toEqual([]);
            expect(result.stored).toHaveLength(1);
            expect(parseFn).toHaveBeenCalledTimes(1);
            expect(categorizeFn).toHaveBeenCalledWith(
                'https://ca.gov/credentials/career-passport-test'
            );
            const addedRecord = (
                (learnCard.index as unknown as { LearnCloud: { add: jest.Mock } }).LearnCloud.add
                    .mock.calls[0] as unknown[]
            )[0] as { category: string };
            expect(addedRecord.category).toBe('ID');
        });

        it('also handles the legacy vc+sd-jwt format string', async () => {
            const parseFn = jest.fn().mockResolvedValue(fakeParsed);
            const categorizeFn = jest.fn().mockReturnValue('Achievement');
            const learnCard = makeLearnCardWithSdJwt(parseFn, categorizeFn);

            const result = await storeAcceptedCredentials(learnCard, sdJwtAccepted('vc+sd-jwt'));

            expect(result.failures).toEqual([]);
            expect(parseFn).toHaveBeenCalledTimes(1);
            expect(result.stored[0].format).toBe('vc+sd-jwt');
        });

        it('falls back to the W3C heuristic when categorizeSdJwtVct is unavailable', async () => {
            const parseFn = jest.fn().mockResolvedValue(fakeParsed);
            const learnCard = makeLearnCardWithSdJwt(parseFn);

            const result = await storeAcceptedCredentials(learnCard, sdJwtAccepted());

            expect(result.failures).toEqual([]);
            const addedRecord = (
                (learnCard.index as unknown as { LearnCloud: { add: jest.Mock } }).LearnCloud.add
                    .mock.calls[0] as unknown[]
            )[0] as { category: string };
            expect(addedRecord.category).toBe('Achievement');
        });

        it('records a failure when the sd-jwt-vc plugin is not installed', async () => {
            const learnCard = makeLearnCardWithSdJwt();

            const result = await storeAcceptedCredentials(learnCard, sdJwtAccepted());

            expect(result.stored).toEqual([]);
            expect(result.failures).toHaveLength(1);
            expect(result.failures[0].error.code).toBe('unsupported_format');
            expect(result.failures[0].error.message).toMatch(/sd-jwt-vc-plugin/);
        });

        it('preserves the SD-JWT compact form under proof.jwt of the synthesized VC', async () => {
            const parseFn = jest.fn().mockResolvedValue(fakeParsed);
            const learnCard = makeLearnCardWithSdJwt(parseFn, jest.fn().mockReturnValue('ID'));

            const result = await storeAcceptedCredentials(learnCard, sdJwtAccepted());

            expect(result.stored[0].vc.type).toEqual([
                'VerifiableCredential',
                'SdJwtVcCredential',
            ]);
            expect((result.stored[0].vc.proof as { jwt: string }).jwt).toBe(fakeParsed.rawSdJwt);
            expect((result.stored[0].vc as Record<string, unknown>).sdJwtVct).toBe(
                fakeParsed.vct
            );
        });
    });
});
