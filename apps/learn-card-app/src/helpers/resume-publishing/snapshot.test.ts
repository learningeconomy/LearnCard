import { describe, expect, it } from 'vitest';
import type { ResumeBuilderSnapshot } from '../../stores/resumeBuilderStore';
import { visibleResumeContact } from './snapshot';
describe('visible resume contact', () => {
    it('omits hidden name and email instead of restoring account values', () => {
        const snapshot = {
            personalDetails: {
                name: 'SECRET NAME',
                email: 'secret@example.com',
                phone: ' 555 ',
                career: 'Designer',
            },
            hiddenPersonalDetails: { name: true, email: true },
        } as unknown as ResumeBuilderSnapshot;
        expect(visibleResumeContact(snapshot)).toMatchObject({
            fullName: '',
            email: undefined,
            phone: '555',
            career: 'Designer',
        });
        expect(JSON.stringify(visibleResumeContact(snapshot))).not.toContain('SECRET');
        expect(JSON.stringify(visibleResumeContact(snapshot))).not.toContain('secret@example.com');
    });
    it('does not inject a placeholder identity for blank visible fields', () => {
        const snapshot = {
            personalDetails: { name: ' ', email: '' },
            hiddenPersonalDetails: {},
        } as unknown as ResumeBuilderSnapshot;
        expect(visibleResumeContact(snapshot).fullName).toBe('');
        expect(visibleResumeContact(snapshot).email).toBeUndefined();
    });
});
