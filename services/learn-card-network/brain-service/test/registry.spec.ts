import { getRegistryService } from '@services/registry/registry.factory';

describe('Registry Service', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Whitelist Adapter', () => {
        it('should use WhitelistAdapter when TRUSTED_ISSUERS_WHITELIST is set', async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = 'did:example:123,did:example:456';
            const registry = getRegistryService();
            expect(registry.constructor.name).toBe('WhitelistAdapter');
            expect(await registry.isTrusted('did:example:123')).toBe(true);
            expect(await registry.isTrusted('did:example:456')).toBe(true);
            expect(await registry.isTrusted('did:example:789')).toBe(false);

            const issuerDoc = await registry.getIssuer('did:example:123');
            expect(issuerDoc).not.toBeNull();
            if (!issuerDoc?.matchingIssuers?.[0]) throw new Error('Issuer doc is null');
            expect(issuerDoc.matchingIssuers[0].issuer.federation_entity.organization_name).toBe('Whitelisted Issuer');
        });

        it('should use WhitelistAdapter in test environment', async () => {
            process.env.NODE_ENV = 'test';
            const registry = getRegistryService();
            expect(registry.constructor.name).toBe('WhitelistAdapter');
        });
    });

    describe('DccIssuerRegistryAdapter', () => {
        it('should use DccIssuerRegistryAdapter when TRUSTED_ISSUERS_WHITELIST is not set and not in test env', () => {
            process.env.NODE_ENV = 'production';
            delete process.env.TRUSTED_ISSUERS_WHITELIST;
            const registry = getRegistryService();
            expect(registry.constructor.name).toBe('DccIssuerRegistryAdapter');
        });
    });
});
