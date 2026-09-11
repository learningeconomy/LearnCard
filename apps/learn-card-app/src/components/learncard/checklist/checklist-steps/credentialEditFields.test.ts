import { expect, it } from 'vitest';
import { getField, setField } from './credentialEditFields';

it.each([false, true])('round-trips edits and deletion with array subject=%s', array => {
    const subject = { achievement: { name: 'Original', achievementType: ['Certificate'] } };
    const vc = { credentialSubject: array ? [subject, { id: 'untouched' }] : subject };
    const field = 'credentialSubject.achievement.name';
    expect(getField(vc, field)).toBe('Original');
    expect(getField(vc, 'credentialSubject.achievement.achievementType')).toBe('Certificate');
    const saved = JSON.parse(JSON.stringify(setField(vc, field, 'Edited')));
    expect(getField(saved, field)).toBe('Edited');
    expect(getField(vc, field)).toBe('Original');
    if (array) expect(saved.credentialSubject[1]).toEqual({ id: 'untouched' });
    expect(getField(setField(saved, field, ''), field)).toBe('');
});

it.each([{ subject: [] }, { subject: [null] }, { subject: ['did:example:123'] }])(
    'supports empty or primitive subjects $subject',
    ({ subject }) => {
        const vc = { credentialSubject: subject };
        const field = 'credentialSubject.achievement.name';
        expect(getField(vc, field)).toBe('');
        expect(getField(setField(vc, field, 'Edited'), field)).toBe('Edited');
    }
);

it.each([
    '__proto__.polluted',
    'constructor.prototype.polluted',
    'credentialSubject.__proto__.polluted',
])('rejects unsafe path %s', field => {
    const original = { credentialSubject: {} };
    expect(setField(original, field, 'yes')).toEqual(original);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
});
