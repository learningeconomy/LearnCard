import { describe, expect, it } from 'vitest';
import {
    CredentialDisplayValidator,
    PublishCredentialRefreshInputValidator,
} from '@learncard/types';
import { getPublicBoostDisplayName } from './credential-display.helpers';
import { buildCredentialUpdatedEmailModel } from './credential-refresh-email-content.helpers';

describe('public credential display', () => {
    it('never infers an anchor title from private claims or the generic list label', () => {
        const name = getPublicBoostDisplayName({
            name: 'Credential',
            boost: JSON.stringify({ display: {}, name: 'PRIVATE CLAIM' }),
        });
        expect(name).toBeUndefined();
        expect(
            JSON.stringify(buildCredentialUpdatedEmailModel({ credentialTitle: name }))
        ).not.toContain('PRIVATE CLAIM');
    });

    it('uses only explicit public display fields', () => {
        const display = CredentialDisplayValidator.parse({
            name: 'Public label',
            claims: 'PRIVATE',
        });
        expect(display).toEqual({ name: 'Public label' });
        expect(getPublicBoostDisplayName({ boost: JSON.stringify({ display }) })).toBe(
            'Public label'
        );
    });

    it('leaves reusable Boost metadata unchanged', () => {
        expect(getPublicBoostDisplayName({ name: 'Public template', boost: '{}' })).toBe(
            'Public template'
        );
    });

    it('bounds public summaries and rejects arbitrary update reasons', () => {
        const input = {
            refreshId: 'refresh',
            mode: 'issuer-signed',
            updateSummary: 'x'.repeat(281),
            updateReason: 'PRIVATE',
        };
        const result = PublishCredentialRefreshInputValidator.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.map(issue => issue.path[0])).toEqual(
                expect.arrayContaining(['updateSummary', 'updateReason'])
            );
        }
    });
});
