import { beforeEach, describe, expect, it, vi } from 'vitest';

const environment = vi.hoisted(() => ({
    DOMAIN_NAME: 'network.example.com' as string | undefined,
    PORT: 3000 as number | undefined,
    IS_OFFLINE: false,
}));

vi.mock('@environment', () => ({
    environment,
}));
vi.mock('@models', () => ({ Profile: {} }));
vi.mock('@helpers/profile.helpers', () => ({ transformProfileId: vi.fn() }));
vi.mock('@helpers/objects.helpers', () => ({ inflateObject: vi.fn() }));
vi.mock('neogma', () => ({ BindParam: class {}, QueryBuilder: class {}, QueryRunner: {} }));

import { localUsersProfileId } from './read';

describe('localUsersProfileId', () => {
    beforeEach(() => {
        environment.DOMAIN_NAME = 'network.example.com';
        environment.PORT = 3000;
        environment.IS_OFFLINE = false;
    });

    it('resolves a local users DID to its profile id', () => {
        expect(localUsersProfileId('did:web:network.example.com:users:local-user')).toBe(
            'local-user'
        );
    });

    it.each([
        'did:web:localhost%3A3000:users:local-user',
        'did:web:localhost:3000:users:local-user',
    ])('resolves local development DID form %s', did => {
        environment.DOMAIN_NAME = undefined;
        environment.IS_OFFLINE = true;
        expect(localUsersProfileId(did)).toBe('local-user');
    });

    it.each([
        'did:web:localhost%3A3000:users:local-user',
        'did:web:localhost:3000:users:local-user',
    ])('resolves configured integration and verification DID form %s', did => {
        environment.DOMAIN_NAME = 'localhost%3A3000';
        expect(localUsersProfileId(did)).toBe('local-user');
    });

    it.each([false, true])('rejects an unminted localhost alias with IS_OFFLINE=%s', offline => {
        environment.IS_OFFLINE = offline;
        expect(localUsersProfileId('did:web:localhost%3A3000:users:local-user')).toBeNull();
        expect(localUsersProfileId('did:web:localhost:3000:users:local-user')).toBeNull();
    });

    it('does not enable the offline fallback in an unconfigured online deployment', () => {
        environment.DOMAIN_NAME = undefined;
        expect(localUsersProfileId('did:web:localhost%3A3000:users:local-user')).toBeNull();
    });

    it('does not interpolate an absent port into an offline authority', () => {
        environment.DOMAIN_NAME = undefined;
        environment.IS_OFFLINE = true;
        environment.PORT = undefined;
        expect(localUsersProfileId('did:web:localhost%3Aundefined:users:local-user')).toBeNull();
        expect(localUsersProfileId('did:web:localhost:undefined:users:local-user')).toBeNull();
    });

    it('rejects other localhost ports in offline mode', () => {
        environment.DOMAIN_NAME = undefined;
        environment.IS_OFFLINE = true;
        expect(localUsersProfileId('did:web:localhost%3A4000:users:local-user')).toBeNull();
    });

    it.each([false, true])('rejects a foreign users DID with IS_OFFLINE=%s', offline => {
        environment.IS_OFFLINE = offline;
        expect(localUsersProfileId('did:web:evil.example:users:local-user')).toBeNull();
    });
});
