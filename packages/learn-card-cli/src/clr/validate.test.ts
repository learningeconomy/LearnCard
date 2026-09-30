import { describe, expect, it } from 'vitest';
import { clrProvisionalTranscript, clrWestbridgeFull } from '@learncard/credential-library';

import { validateClr } from './validate';

const clone = <T>(value: T): T => structuredClone(value);

const provisional = (): Record<string, unknown> =>
    clone(clrProvisionalTranscript.credential) as Record<string, unknown>;

describe('validateClr', () => {
    it('passes the library provisional transcript with zero errors', () => {
        const result = validateClr(provisional(), { profile: 'provisional' });
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });

    it('errors on partial when the same transcript is checked as official', () => {
        const result = validateClr(provisional(), { profile: 'official' });
        expect(result.errors.some(e => /partial/i.test(e))).toBe(true);
    });

    it('errors when @context uses the 2.0.1 URL that requires remote loading', () => {
        const credential = clone(clrWestbridgeFull.credential) as Record<string, unknown>;
        credential['@context'] = (credential['@context'] as unknown[]).map(entry =>
            entry === 'https://purl.imsglobal.org/spec/clr/v2p0/context.json'
                ? 'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json'
                : entry
        );
        const result = validateClr(credential);
        expect(
            result.errors.some(e => e.includes('2.0.1 URL requires remote context loading'))
        ).toBe(true);
    });

    it('errors when id is missing', () => {
        const credential = clone(clrWestbridgeFull.credential) as Record<string, unknown>;
        delete credential.id;
        const result = validateClr(credential);
        expect(result.errors.some(e => /^id:/.test(e))).toBe(true);
    });

    it('warns on a dateOfBirth field added anywhere in the document', () => {
        const credential = clone(clrWestbridgeFull.credential) as Record<string, unknown>;
        (credential.credentialSubject as Record<string, unknown>).dateOfBirth = '1999-03-14';
        const result = validateClr(credential, { profile: 'official' });
        expect(result.warnings.some(e => /dateOfBirth/.test(e))).toBe(true);
    });

    it('warns when a provisional transcript omits validUntil', () => {
        const credential = provisional();
        delete credential.validUntil;
        const result = validateClr(credential, { profile: 'provisional' });
        expect(result.warnings.some(e => /validUntil/.test(e))).toBe(true);
    });

    it('errors when an InProgress result has no Status-typed ResultDescription', () => {
        const credential = provisional();
        const subject = credential.credentialSubject as Record<string, unknown>;
        const achievement = (subject.achievement as Record<string, unknown>[])[0]!;
        (achievement.resultDescription as Record<string, unknown>[])[0]!.resultType = 'RawScore';
        const result = validateClr(credential, { profile: 'provisional' });
        expect(result.errors.some(e => /resultType "Status"/.test(e))).toBe(true);
    });
});
