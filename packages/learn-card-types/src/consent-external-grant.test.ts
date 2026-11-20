import { describe, expect, it } from 'vitest';
import {
    ConsentFlowExternalGrantValidator,
    ConsentFlowExternalGrantExpectationValidator,
    ConsentFlowTermsValidator,
} from './lcn';

const grant = { issuer: 'did:example:issuer', ref: 'consent-1', revision: 0, hash: 'sha256:abc' };

describe('external consent grant schema', () => {
    it('preserves a complete binding and permits revision zero', () => {
        expect(ConsentFlowExternalGrantValidator.parse(grant)).toEqual(grant);
        expect(ConsentFlowTermsValidator.parse({ externalGrant: grant }).externalGrant).toEqual(
            grant
        );
    });

    it('does not add an external grant to legacy terms', () => {
        expect(ConsentFlowTermsValidator.parse({})).not.toHaveProperty('externalGrant');
    });

    it.each([
        { issuer: '' },
        { issuer: ' ' },
        { ref: '' },
        { ref: 'a b' },
        { hash: '' },
        { hash: 'a\nb' },
        { revision: -1 },
        { revision: 0.5 },
        { revision: '1' },
        { revision: Number.MAX_SAFE_INTEGER + 1 },
        { revision: null },
        { revision: undefined },
        { extra: true },
    ])('rejects invalid binding %j', override => {
        expect(ConsentFlowExternalGrantValidator.safeParse({ ...grant, ...override }).success).toBe(
            false
        );
    });

    it('requires exactly revision and hash for expectations', () => {
        expect(
            ConsentFlowExternalGrantExpectationValidator.parse({ revision: 0, hash: grant.hash })
        ).toEqual({ revision: 0, hash: grant.hash });
        expect(
            ConsentFlowExternalGrantExpectationValidator.safeParse({ revision: 0 }).success
        ).toBe(false);
        expect(ConsentFlowExternalGrantExpectationValidator.safeParse(grant).success).toBe(false);
    });
});
