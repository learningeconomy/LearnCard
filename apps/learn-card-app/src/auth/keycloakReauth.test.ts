import { beforeEach, describe, expect, it } from 'vitest';
import {
    assertCurrentKeycloakReauth,
    beginKeycloakReauth,
    clearKeycloakReauth,
    readKeycloakReauth,
    validateKeycloakReauth,
} from './keycloakReauth';

describe('Keycloak reauthentication intent', () => {
    beforeEach(() => {
        sessionStorage.clear();
        window.history.replaceState({}, '', '/wallet?tab=security#recovery');
    });
    it('retains the exact route and action without credentials', () => {
        const intent = beginKeycloakReauth('same-user', 'account-recovery');
        expect(readKeycloakReauth()).toEqual(intent);
        expect(intent.returnTo).toBe('/wallet?tab=security#recovery');
        expect(Object.keys(intent).sort()).toEqual([
            'action',
            'createdAt',
            'id',
            'returnTo',
            'userId',
        ]);
        clearKeycloakReauth();
        expect(readKeycloakReauth()).toBeNull();
    });
    it('requires matching OIDC state and the same account', () => {
        const intent = beginKeycloakReauth('same-user', 'recovery-setup');
        const user = { id: 'same-user', providerType: 'keycloak' };
        expect(() => validateKeycloakReauth(user, { reauthId: intent.id })).not.toThrow();
        expect(() => validateKeycloakReauth(user, { reauthId: 'unrelated' })).toThrow();
        expect(() =>
            validateKeycloakReauth({ ...user, id: 'other-user' }, { reauthId: intent.id })
        ).toThrow();
        expect(() => validateKeycloakReauth(user, undefined)).toThrow();
    });
    it.each(['//evil.example', '/\\evil.example', 'https://evil.example'])(
        'rejects unsafe destinations %s',
        returnTo => {
            const intent = beginKeycloakReauth('same-user', 'account-recovery');
            sessionStorage.setItem(
                'learncard:keycloak:reauth',
                JSON.stringify({ ...intent, returnTo })
            );
            expect(readKeycloakReauth()).toBeNull();
        }
    );
    it('rejects expired, malformed and orphaned callback intents', () => {
        const intent = beginKeycloakReauth('same-user', 'account-recovery');
        sessionStorage.setItem(
            'learncard:keycloak:reauth',
            JSON.stringify({ ...intent, createdAt: Date.now() - 600001 })
        );
        expect(readKeycloakReauth()).toBeNull();
        expect(() =>
            validateKeycloakReauth(
                { id: 'same-user', providerType: 'keycloak' },
                { reauthId: intent.id }
            )
        ).toThrow();
        sessionStorage.setItem('learncard:keycloak:reauth', '{');
        expect(readKeycloakReauth()).toBeNull();
    });
    it('drops credentials from the return URL', () => {
        window.history.replaceState(
            {},
            '',
            '/wallet?tab=security&seed=secret&pin=1234#token=secret'
        );
        expect(beginKeycloakReauth('same-user', 'account-recovery').returnTo).toBe(
            '/wallet?tab=security'
        );
    });
    it('preserves the recovery setup method without serializing callbacks', () => {
        beginKeycloakReauth('same-user', 'recovery-setup', '/dashboard', 'passkey');
        expect(readKeycloakReauth()).toMatchObject({
            action: 'recovery-setup',
            initialMethod: 'passkey',
        });
    });
    it('rejects continuation after account switch, cancellation or expiration', () => {
        const intent = beginKeycloakReauth('same-user', 'recovery-setup');
        expect(() => assertCurrentKeycloakReauth(intent, 'other-user')).toThrow();
        clearKeycloakReauth();
        expect(() => assertCurrentKeycloakReauth(intent, 'same-user')).toThrow();
        sessionStorage.setItem(
            'learncard:keycloak:reauth',
            JSON.stringify({ ...intent, createdAt: Date.now() - 600001 })
        );
        expect(() => assertCurrentKeycloakReauth(intent, 'same-user')).toThrow();
    });
});
