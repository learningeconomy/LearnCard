import {
    DEFAULT_SD_JWT_VC_CATEGORY,
    SD_JWT_VC_CATEGORY_MAP,
    categorizeSdJwt,
    registerSdJwtVctCategory,
} from './categorize';

describe('categorizeSdJwt', () => {
    afterEach(() => {
        delete SD_JWT_VC_CATEGORY_MAP['https://test.example/credentials/dynamic'];
    });

    it('maps EUDI PID vct values to "ID"', () => {
        expect(categorizeSdJwt('urn:eu.europa.ec.eudi:pid:1')).toBe('ID');
        expect(categorizeSdJwt('urn:eudi:pid:1')).toBe('ID');
    });

    it('uses the path heuristic to detect identity-shaped vct URLs', () => {
        expect(categorizeSdJwt('https://issuer.example.com/credentials/pid/1')).toBe('ID');
        expect(categorizeSdJwt('https://example.com/identity/v1')).toBe('ID');
        expect(categorizeSdJwt('https://example.com/Identification/1')).toBe('ID');
        expect(categorizeSdJwt('https://example.com/identitycard/v1')).toBe('ID');
    });

    it('defaults to "Achievement" for unknown vct values', () => {
        expect(categorizeSdJwt('https://example.com/credentials/career-passport')).toBe(
            'Achievement'
        );
        expect(categorizeSdJwt('urn:example:test')).toBe('Achievement');
    });

    it('defaults to "Achievement" for empty / malformed input', () => {
        expect(categorizeSdJwt('')).toBe('Achievement');
        expect(categorizeSdJwt(undefined as unknown as string)).toBe('Achievement');
        expect(categorizeSdJwt(null as unknown as string)).toBe('Achievement');
    });

    it('respects runtime registration via registerSdJwtVctCategory', () => {
        const vct = 'https://test.example/credentials/dynamic';
        expect(categorizeSdJwt(vct)).toBe('Achievement');

        registerSdJwtVctCategory(vct, 'Work');
        expect(categorizeSdJwt(vct)).toBe('Work');
    });

    it('exports a sensible DEFAULT_SD_JWT_VC_CATEGORY', () => {
        expect(DEFAULT_SD_JWT_VC_CATEGORY).toBe('Achievement');
    });

    it('built-in PID entries appear in the map', () => {
        expect(SD_JWT_VC_CATEGORY_MAP['urn:eu.europa.ec.eudi:pid:1']).toBe('ID');
        expect(SD_JWT_VC_CATEGORY_MAP['urn:eudi:pid:1']).toBe('ID');
    });
});
