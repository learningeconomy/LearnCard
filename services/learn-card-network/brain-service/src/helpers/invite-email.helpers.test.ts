import { describe, expect, it } from 'vitest';

import {
    CONTRACT_REQUEST_INVITE_EMAIL_LIMIT,
    CONTRACT_REQUEST_INVITE_EMAIL_WINDOW_MS,
    CONTRACT_REQUEST_INVITE_TTL_MS,
    normalizeInviteEmail,
} from './invite-email.helpers';

describe('normalizeInviteEmail', () => {
    it('trims and lower-cases', () => {
        expect(normalizeInviteEmail('  Person.Name@Example.COM \n')).toBe(
            'person.name@example.com'
        );
    });

    it('leaves a normalised email unchanged', () => {
        const email = 'person+tag@example.com';
        expect(normalizeInviteEmail(email)).toBe(email);
        expect(normalizeInviteEmail(normalizeInviteEmail('A@B.C'))).toBe('a@b.c');
    });

    it('exposes the invite limits', () => {
        expect(CONTRACT_REQUEST_INVITE_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
        expect(CONTRACT_REQUEST_INVITE_EMAIL_LIMIT).toBe(3);
        expect(CONTRACT_REQUEST_INVITE_EMAIL_WINDOW_MS).toBe(24 * 60 * 60 * 1000);
    });
});
