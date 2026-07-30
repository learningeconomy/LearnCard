import { vpBaseContextFor, VC_V1_CONTEXT, VC_V2_CONTEXT } from './context';

describe('vpBaseContextFor', () => {
    it('returns v1 when all embedded credentials use the v1 context', () => {
        expect(
            vpBaseContextFor([
                {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiableCredential'],
                },
            ])
        ).toBe(VC_V1_CONTEXT);
    });

    it('returns v2 when any embedded credential uses the v2 context', () => {
        expect(
            vpBaseContextFor([
                { '@context': ['https://www.w3.org/2018/credentials/v1'] },
                { '@context': ['https://www.w3.org/ns/credentials/v2'] },
            ])
        ).toBe(VC_V2_CONTEXT);
    });

    it('handles string @context values', () => {
        expect(vpBaseContextFor([{ '@context': 'https://www.w3.org/ns/credentials/v2' }])).toBe(
            VC_V2_CONTEXT
        );
    });

    it('defaults to v1 for JWT strings and empty pools', () => {
        expect(vpBaseContextFor(['eyJ.a.b'])).toBe(VC_V1_CONTEXT);
        expect(vpBaseContextFor([])).toBe(VC_V1_CONTEXT);
    });
});
