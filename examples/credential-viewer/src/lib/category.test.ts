import { describe, expect, it } from 'vitest';
import { getFixture, isCredentialFixture } from '@learncard/credential-library';
import { getCategoryForCredential, getCategoryForFixture } from './category';

describe('Qualifications fixture categorization', () => {
    it.each(['license', 'certification', 'apprenticeship', 'journeyman', 'master'])(
        'indexes the %s fixture in Qualifications',
        slug => {
            const fixture = getFixture(`obv3/qualification-${slug}`);
            expect(getCategoryForFixture(fixture)).toBe('Qualifications');
        }
    );

    it('keeps BoostID precedence over a qualification achievement type', () => {
        const fixture = getFixture('obv3/qualification-license');
        if (!isCredentialFixture(fixture)) throw new Error('Expected W3C fixture');
        expect(
            getCategoryForCredential({
                ...fixture.credential,
                type: ['VerifiableCredential', 'BoostID'],
            })
        ).toBe('ID');
    });
});
