import { normalizeCredentialOffer } from './normalize';
import { CredentialOfferParseError, PRE_AUTHORIZED_CODE_GRANT } from './types';

describe('normalizeCredentialOffer', () => {
    it('passes Draft 13 offers through unchanged', () => {
        const input = {
            credential_issuer: 'https://issuer.example.com',
            credential_configuration_ids: ['foo', 'bar'],
            grants: {
                [PRE_AUTHORIZED_CODE_GRANT]: {
                    'pre-authorized_code': 'xyz',
                    tx_code: { input_mode: 'text' as const, length: 6, description: 'code' },
                    interval: 5,
                },
                authorization_code: {
                    issuer_state: 'state123',
                },
            },
        };

        const result = normalizeCredentialOffer(input);

        expect(result.credential_configuration_ids).toEqual(['foo', 'bar']);
        expect(result.grants?.[PRE_AUTHORIZED_CODE_GRANT]).toEqual({
            'pre-authorized_code': 'xyz',
            tx_code: { input_mode: 'text', length: 6, description: 'code' },
            interval: 5,
            authorization_server: undefined,
        });
        expect(result.grants?.authorization_code?.issuer_state).toBe('state123');
    });

    it('converts Draft 11 `credentials` string array to `credential_configuration_ids`', () => {
        const input = {
            credential_issuer: 'https://issuer.example.com',
            credentials: ['UniversityDegree', 'StudentId'],
            grants: {
                [PRE_AUTHORIZED_CODE_GRANT]: {
                    'pre-authorized_code': 'code',
                },
            },
        };

        const result = normalizeCredentialOffer(input);

        expect(result.credential_configuration_ids).toEqual(['UniversityDegree', 'StudentId']);
    });

    it('extracts identifiers from Draft 11 inline credential-metadata objects', () => {
        const input = {
            credential_issuer: 'https://issuer.example.com',
            credentials: [
                { format: 'jwt_vc_json', types: ['VerifiableCredential', 'UniversityDegree'] },
                { id: 'StudentId', format: 'ldp_vc' },
                'BareString',
            ],
        };

        const result = normalizeCredentialOffer(input);

        // First entry: no `id`, falls back to types[0]
        // Second entry: explicit `id`
        // Third entry: bare string
        expect(result.credential_configuration_ids).toEqual([
            'VerifiableCredential',
            'StudentId',
            'BareString',
        ]);
    });

    it('translates Draft 11 user_pin_required into a marker tx_code', () => {
        const input = {
            credential_issuer: 'https://issuer.example.com',
            credentials: ['foo'],
            grants: {
                [PRE_AUTHORIZED_CODE_GRANT]: {
                    'pre-authorized_code': 'code',
                    user_pin_required: true,
                },
            },
        };

        const result = normalizeCredentialOffer(input);

        expect(result.grants?.[PRE_AUTHORIZED_CODE_GRANT]?.tx_code).toEqual({});
    });

    it('does NOT emit a tx_code when Draft 11 user_pin_required is false', () => {
        const input = {
            credential_issuer: 'https://issuer.example.com',
            credentials: ['foo'],
            grants: {
                [PRE_AUTHORIZED_CODE_GRANT]: {
                    'pre-authorized_code': 'code',
                    user_pin_required: false,
                },
            },
        };

        const result = normalizeCredentialOffer(input);

        expect(result.grants?.[PRE_AUTHORIZED_CODE_GRANT]?.tx_code).toBeUndefined();
    });

    it('prefers Draft 13 tx_code over Draft 11 user_pin_required when both present', () => {
        const input = {
            credential_issuer: 'https://issuer.example.com',
            credentials: ['foo'],
            grants: {
                [PRE_AUTHORIZED_CODE_GRANT]: {
                    'pre-authorized_code': 'code',
                    user_pin_required: true,
                    tx_code: { input_mode: 'numeric', length: 4 },
                },
            },
        };

        const result = normalizeCredentialOffer(input);

        expect(result.grants?.[PRE_AUTHORIZED_CODE_GRANT]?.tx_code).toEqual({
            input_mode: 'numeric',
            length: 4,
        });
    });

    it('omits grants entirely when the input has no grants', () => {
        const result = normalizeCredentialOffer({
            credential_issuer: 'https://issuer.example.com',
            credential_configuration_ids: ['foo'],
        });

        expect(result.grants).toBeUndefined();
    });

    it('throws on non-object input', () => {
        expect(() => normalizeCredentialOffer(null)).toThrow(CredentialOfferParseError);
        expect(() => normalizeCredentialOffer('not an object')).toThrow(CredentialOfferParseError);
        expect(() => normalizeCredentialOffer([1, 2, 3])).toThrow(CredentialOfferParseError);
    });

    it('throws when credential_issuer is missing or empty', () => {
        expect(() =>
            normalizeCredentialOffer({ credential_configuration_ids: ['foo'] })
        ).toThrow(/credential_issuer/);

        expect(() =>
            normalizeCredentialOffer({
                credential_issuer: '',
                credential_configuration_ids: ['foo'],
            })
        ).toThrow(/credential_issuer/);
    });

    it('throws when Draft 13 credential_configuration_ids is empty', () => {
        expect(() =>
            normalizeCredentialOffer({
                credential_issuer: 'https://issuer.example.com',
                credential_configuration_ids: [],
            })
        ).toThrow(/empty/);
    });

    it('throws when Draft 11 credentials yields no resolvable ids', () => {
        expect(() =>
            normalizeCredentialOffer({
                credential_issuer: 'https://issuer.example.com',
                credentials: [{ format: 'jwt_vc_json' }],
            })
        ).toThrow(/resolvable/);
    });

    it('throws when the pre-authorized_code grant is missing its code', () => {
        expect(() =>
            normalizeCredentialOffer({
                credential_issuer: 'https://issuer.example.com',
                credential_configuration_ids: ['foo'],
                grants: {
                    [PRE_AUTHORIZED_CODE_GRANT]: {
                        // no pre-authorized_code
                    },
                },
            })
        ).toThrow(/pre-authorized_code/);
    });

    it('throws when grants is not an object', () => {
        expect(() =>
            normalizeCredentialOffer({
                credential_issuer: 'https://issuer.example.com',
                credential_configuration_ids: ['foo'],
                grants: 'not an object',
            })
        ).toThrow(/grants/);
    });
});
