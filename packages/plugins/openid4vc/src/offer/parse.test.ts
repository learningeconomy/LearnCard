import { parseCredentialOfferUri, resolveCredentialOfferByReference } from './parse';
import { CredentialOfferParseError, PRE_AUTHORIZED_CODE_GRANT } from './types';

const DRAFT_13_OFFER = {
    credential_issuer: 'https://issuer.example.com',
    credential_configuration_ids: ['UniversityDegree_jwt_vc_json'],
    grants: {
        [PRE_AUTHORIZED_CODE_GRANT]: {
            'pre-authorized_code': 'abc123',
            tx_code: { input_mode: 'numeric', length: 4 },
        },
    },
};

const DRAFT_11_OFFER = {
    credential_issuer: 'https://issuer.example.com',
    credentials: ['UniversityDegree_jwt_vc_json'],
    grants: {
        [PRE_AUTHORIZED_CODE_GRANT]: {
            'pre-authorized_code': 'abc123',
            user_pin_required: true,
        },
    },
};

const encode = (offer: unknown) => encodeURIComponent(JSON.stringify(offer));

describe('parseCredentialOfferUri', () => {
    describe('by_value', () => {
        it('parses a Draft 13 offer from an openid-credential-offer:// URI', () => {
            const uri = `openid-credential-offer://?credential_offer=${encode(DRAFT_13_OFFER)}`;
            const result = parseCredentialOfferUri(uri);

            expect(result.kind).toBe('by_value');
            if (result.kind !== 'by_value') return;

            expect(result.offer.credential_issuer).toBe('https://issuer.example.com');
            expect(result.offer.credential_configuration_ids).toEqual([
                'UniversityDegree_jwt_vc_json',
            ]);
            expect(result.offer.grants?.[PRE_AUTHORIZED_CODE_GRANT]?.tx_code).toEqual({
                input_mode: 'numeric',
                length: 4,
            });
        });

        it('normalizes a Draft 11 offer to the Draft 13 shape', () => {
            const uri = `openid-credential-offer://?credential_offer=${encode(DRAFT_11_OFFER)}`;
            const result = parseCredentialOfferUri(uri);

            expect(result.kind).toBe('by_value');
            if (result.kind !== 'by_value') return;

            // Draft 11 `credentials` maps to `credential_configuration_ids`
            expect(result.offer.credential_configuration_ids).toEqual([
                'UniversityDegree_jwt_vc_json',
            ]);

            // Draft 11 `user_pin_required: true` becomes a marker tx_code `{}`.
            // We intentionally don't invent `input_mode`/`length` because the
            // spec didn't carry them — UI should prompt generically.
            expect(result.offer.grants?.[PRE_AUTHORIZED_CODE_GRANT]?.tx_code).toEqual({});
        });

        it('accepts the haip:// scheme', () => {
            const uri = `haip://?credential_offer=${encode(DRAFT_13_OFFER)}`;
            const result = parseCredentialOfferUri(uri);
            expect(result.kind).toBe('by_value');
        });

        it('accepts openid-credential-offer: with no double slash', () => {
            const uri = `openid-credential-offer:?credential_offer=${encode(DRAFT_13_OFFER)}`;
            const result = parseCredentialOfferUri(uri);
            expect(result.kind).toBe('by_value');
        });

        it('accepts a bare ?query string', () => {
            const uri = `?credential_offer=${encode(DRAFT_13_OFFER)}`;
            const result = parseCredentialOfferUri(uri);
            expect(result.kind).toBe('by_value');
        });

        it('accepts a raw query fragment with no leading ?', () => {
            const uri = `credential_offer=${encode(DRAFT_13_OFFER)}`;
            const result = parseCredentialOfferUri(uri);
            expect(result.kind).toBe('by_value');
        });
    });

    describe('by_reference', () => {
        it('parses a credential_offer_uri pointer', () => {
            const uri =
                'openid-credential-offer://?credential_offer_uri=' +
                encodeURIComponent('https://issuer.example.com/offers/abc123');

            const result = parseCredentialOfferUri(uri);

            expect(result).toEqual({
                kind: 'by_reference',
                uri: 'https://issuer.example.com/offers/abc123',
            });
        });

        it('rejects a non-https credential_offer_uri', () => {
            const uri =
                'openid-credential-offer://?credential_offer_uri=' +
                encodeURIComponent('http://issuer.example.com/offers/abc123');

            expect(() => parseCredentialOfferUri(uri)).toThrow(CredentialOfferParseError);
            expect(() => parseCredentialOfferUri(uri)).toThrow(/https/);
        });
    });

    describe('error cases', () => {
        it('throws on an empty string', () => {
            expect(() => parseCredentialOfferUri('')).toThrow(CredentialOfferParseError);
        });

        it('throws when both credential_offer and credential_offer_uri are present', () => {
            const uri =
                'openid-credential-offer://?credential_offer=' +
                encode(DRAFT_13_OFFER) +
                '&credential_offer_uri=' +
                encodeURIComponent('https://issuer.example.com/offers/abc123');

            try {
                parseCredentialOfferUri(uri);
                fail('expected to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(CredentialOfferParseError);
                expect((e as CredentialOfferParseError).code).toBe('both_offer_and_uri');
            }
        });

        it('throws when neither parameter is present', () => {
            const uri = 'openid-credential-offer://?foo=bar';

            try {
                parseCredentialOfferUri(uri);
                fail('expected to throw');
            } catch (e) {
                expect((e as CredentialOfferParseError).code).toBe('missing_offer');
            }
        });

        it('throws on invalid JSON in credential_offer', () => {
            const uri = 'openid-credential-offer://?credential_offer=' + encodeURIComponent('{not json');

            try {
                parseCredentialOfferUri(uri);
                fail('expected to throw');
            } catch (e) {
                expect((e as CredentialOfferParseError).code).toBe('invalid_json');
            }
        });

        it('throws when the offer is missing credential_issuer', () => {
            const offer = { credential_configuration_ids: ['foo'] };
            const uri = 'openid-credential-offer://?credential_offer=' + encode(offer);

            try {
                parseCredentialOfferUri(uri);
                fail('expected to throw');
            } catch (e) {
                expect((e as CredentialOfferParseError).code).toBe('missing_issuer');
            }
        });

        it('throws when neither credential_configuration_ids nor credentials is present', () => {
            const offer = { credential_issuer: 'https://issuer.example.com' };
            const uri = 'openid-credential-offer://?credential_offer=' + encode(offer);

            try {
                parseCredentialOfferUri(uri);
                fail('expected to throw');
            } catch (e) {
                expect((e as CredentialOfferParseError).code).toBe('missing_credentials');
            }
        });

        it('throws on a URI with no query string at all', () => {
            try {
                parseCredentialOfferUri('openid-credential-offer://');
                fail('expected to throw');
            } catch (e) {
                expect((e as CredentialOfferParseError).code).toBe('invalid_uri');
            }
        });
    });
});

describe('resolveCredentialOfferByReference', () => {
    it('fetches and normalizes a by-reference offer', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => DRAFT_13_OFFER,
        } as Response);

        const result = await resolveCredentialOfferByReference(
            'https://issuer.example.com/offers/abc123',
            fetchMock as unknown as typeof fetch
        );

        expect(fetchMock).toHaveBeenCalledWith('https://issuer.example.com/offers/abc123', {
            method: 'GET',
        });
        expect(result.kind).toBe('by_value');
    });

    it('rejects a non-https uri', async () => {
        await expect(
            resolveCredentialOfferByReference('http://insecure.example.com/offers/abc')
        ).rejects.toThrow(/https/);
    });

    it('surfaces HTTP errors as CredentialOfferParseError', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        } as Response);

        await expect(
            resolveCredentialOfferByReference(
                'https://issuer.example.com/missing',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'invalid_uri' });
    });

    it('surfaces JSON parse errors', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
                throw new Error('not json');
            },
        } as unknown as Response);

        await expect(
            resolveCredentialOfferByReference(
                'https://issuer.example.com/offers/abc',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'invalid_json' });
    });

    it('surfaces network errors', async () => {
        const fetchMock = jest.fn().mockRejectedValue(new Error('network down'));

        await expect(
            resolveCredentialOfferByReference(
                'https://issuer.example.com/offers/abc',
                fetchMock as unknown as typeof fetch
            )
        ).rejects.toMatchObject({ code: 'invalid_uri' });
    });
});
