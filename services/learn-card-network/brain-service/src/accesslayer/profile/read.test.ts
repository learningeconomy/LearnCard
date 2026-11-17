import { describe, expect, it, vi } from 'vitest';

vi.mock('@environment', () => ({
    environment: { DOMAIN_NAME: 'network.example.com', PORT: 3000 },
}));
vi.mock('@models', () => ({ Profile: {} }));
vi.mock('@helpers/profile.helpers', () => ({ transformProfileId: vi.fn() }));
vi.mock('@helpers/objects.helpers', () => ({ inflateObject: vi.fn() }));
vi.mock('neogma', () => ({ BindParam: class {}, QueryBuilder: class {}, QueryRunner: {} }));

import { localUsersProfileId } from './read';

describe('localUsersProfileId', () => {
    it('resolves a local users DID to its profile id', () => {
        expect(localUsersProfileId('did:web:network.example.com:users:local-user')).toBe(
            'local-user'
        );
    });

    it('does not resolve a foreign users DID to a local profile id', () => {
        expect(localUsersProfileId('did:web:evil.example:users:local-user')).toBeNull();
    });
});
