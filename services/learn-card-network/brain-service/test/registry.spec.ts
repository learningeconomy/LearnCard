describe('Registry Service', () => {
    const originalEnv = process.env;

    const getRegistryServiceForEnvironment = async (
        overrides: Record<string, string | undefined>
    ) => {
        process.env = {
            ...originalEnv,
            SEED: originalEnv.SEED ?? 'registry-test-seed',
            NEO4J_URI: originalEnv.NEO4J_URI ?? 'bolt://localhost:7687',
            NEO4J_USERNAME: originalEnv.NEO4J_USERNAME ?? 'neo4j',
            NEO4J_PASSWORD: originalEnv.NEO4J_PASSWORD ?? 'registry-test-password',
            DOMAIN_NAME: originalEnv.DOMAIN_NAME ?? 'localhost%3A3000',
            CREDENTIAL_REFRESH_DIGEST_SECRET:
                originalEnv.CREDENTIAL_REFRESH_DIGEST_SECRET ?? 'registry-test-refresh-secret',
        };

        Object.entries(overrides).forEach(([key, value]) => {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        });

        vi.resetModules();

        return (await import('@services/registry/registry.factory')).getRegistryService();
    };

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Whitelist Adapter', () => {
        it('should use WhitelistAdapter when TRUSTED_ISSUERS_WHITELIST is set', async () => {
            const registry = await getRegistryServiceForEnvironment({
                NODE_ENV: 'production',
                IS_CI: 'false',
                IS_E2E_TEST: 'false',
                TRUSTED_ISSUERS_WHITELIST: 'did:example:123,did:example:456',
            });
            expect(registry.constructor.name).toBe('WhitelistAdapter');
            expect(await registry.isTrusted('did:example:123')).toBe(true);
            expect(await registry.isTrusted('did:example:456')).toBe(true);
            expect(await registry.isTrusted('did:example:789')).toBe(false);

            const issuerDoc = await registry.getIssuer('did:example:123');
            expect(issuerDoc).not.toBeNull();
            if (!issuerDoc?.matchingIssuers?.[0]) throw new Error('Issuer doc is null');
            expect(issuerDoc.matchingIssuers[0].issuer.federation_entity.organization_name).toBe(
                'Whitelisted Issuer'
            );
        });

        it('should use WhitelistAdapter in test environment', async () => {
            const registry = await getRegistryServiceForEnvironment({
                NODE_ENV: 'test',
                IS_CI: 'false',
                IS_E2E_TEST: 'false',
                TRUSTED_ISSUERS_WHITELIST: undefined,
            });
            expect(registry.constructor.name).toBe('WhitelistAdapter');
        });

        it('should use WhitelistAdapter in E2E environment', async () => {
            const registry = await getRegistryServiceForEnvironment({
                NODE_ENV: 'production',
                IS_CI: 'false',
                IS_E2E_TEST: 'true',
                TRUSTED_ISSUERS_WHITELIST: undefined,
            });
            expect(registry.constructor.name).toBe('WhitelistAdapter');
        });
    });

    describe('DccIssuerRegistryAdapter', () => {
        it('should use DccIssuerRegistryAdapter outside test environments without a whitelist', async () => {
            const registry = await getRegistryServiceForEnvironment({
                NODE_ENV: 'production',
                IS_CI: 'false',
                IS_E2E_TEST: 'false',
                TRUSTED_ISSUERS_WHITELIST: undefined,
            });
            expect(registry.constructor.name).toBe('DccIssuerRegistryAdapter');
        });
    });
});
