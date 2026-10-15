import { expect, test } from 'bun:test';
import { credentialCategoryForDisplay } from './credential-category';

const vc = (achievementType: string, tag?: string[]) => ({
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    credentialSubject: { achievement: { achievementType, tag } },
    proof: { proofValue: 'unchanged' },
});

test('stored web categories and unknown partner values survive presentation', () => {
    for (const category of [
        'Accomplishment',
        'Accommodation',
        'Qualifications',
        'Course',
        'Social Badge',
        'partner.custom',
    ]) {
        expect(credentialCategoryForDisplay(category, vc('Badge'))).toBe(category);
    }
    expect(credentialCategoryForDisplay(undefined, {})).toBeUndefined();
});
test('legacy qualification records follow the web migration rules without writes', () => {
    for (const [type, historic] of [
        ['License', 'ID'],
        ['Certification', 'Achievement'],
        ['ApprenticeshipCertificate', 'Work History'],
        ['JourneymanCertificate', 'Work History'],
        ['MasterCertificate', 'Work History'],
    ]) {
        const raw = vc(type),
            before = JSON.stringify(raw);
        expect(credentialCategoryForDisplay(historic, raw)).toBe('Qualifications');
        expect(credentialCategoryForDisplay(undefined, raw)).toBe('Qualifications');
        expect(credentialCategoryForDisplay('Accomplishment', raw)).toBe('Accomplishment');
        expect(JSON.stringify(raw)).toBe(before);
    }
});
test('explicit issuer tags override qualification inference and retain last-valid precedence', () => {
    expect(credentialCategoryForDisplay('ID', vc('License', ['lc:category:Social Badge']))).toBe(
        'Social Badge'
    );
    expect(
        credentialCategoryForDisplay(
            'Accomplishment',
            vc('Badge', [
                'lc:category:Social Badge',
                'LC:CATEGORY:Qualifications',
                'lc:category:invalid',
            ])
        )
    ).toBe('Qualifications');
    expect(
        credentialCategoryForDisplay(
            'Qualifications',
            vc('License', ['lc:category:Qualifications', 'lc:category:Social Badge'])
        )
    ).toBe('Social Badge');
});
test('Certificate is not Certification and non-qualification achievement data prevents a false move', () => {
    expect(credentialCategoryForDisplay('Learning History', vc('Certificate'))).toBe(
        'Learning History'
    );
    expect(credentialCategoryForDisplay('Achievement', vc('Certificate'))).toBe('Achievement');
    expect(
        credentialCategoryForDisplay('ID', {
            ...vc('Badge'),
            type: ['VerifiableCredential', 'License'],
        })
    ).toBe('ID');
});
test('vanilla credential types, subject arrays and certified wrappers are readable', () => {
    expect(credentialCategoryForDisplay('ID', { type: ['VerifiableCredential', 'License'] })).toBe(
        'Qualifications'
    );
    const raw = {
        type: ['VerifiableCredential', 'CertifiedBoostCredential'],
        boostCredential: {
            ...vc('Certification'),
            credentialSubject: [{ achievement: [{ achievementType: 'Certification' }] }],
        },
    };
    expect(credentialCategoryForDisplay('Achievement', raw)).toBe('Qualifications');
    expect(credentialCategoryForDisplay('ID', { credentialSubject: 'bad data', type: null })).toBe(
        'ID'
    );
});
