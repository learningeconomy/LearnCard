import { describe, expect, it } from 'vitest';

import { resolveShareLinkPublicApiConfig } from '../src/helpers/share-link-public/config';

/**
 * LC-2187 public API configuration is disabled by default and independent of the
 * owner API and the maintenance scheduler. A disabled/invalid resolution never
 * echoes a value, and only the shared validated transport namespace/origin/
 * audience can enable it.
 */

const enabledEnv = {
    SHARE_LINK_PUBLIC_API_ENABLED: 'true',
    SHARE_LINK_MAINTENANCE_NAMESPACE: 'deployment-ns',
    SHARE_LINK_MAINTENANCE_ORIGIN: 'https://learncloud.example',
    SHARE_LINK_MAINTENANCE_AUDIENCE: 'did:web:learncloud.example',
};

describe('resolveShareLinkPublicApiConfig', () => {
    it('is disabled when the flag is absent, false or empty', () => {
        expect(resolveShareLinkPublicApiConfig({})).toEqual({ status: 'disabled' });
        expect(resolveShareLinkPublicApiConfig({ SHARE_LINK_PUBLIC_API_ENABLED: 'false' })).toEqual(
            { status: 'disabled' }
        );
        expect(resolveShareLinkPublicApiConfig({ SHARE_LINK_PUBLIC_API_ENABLED: '' })).toEqual({
            status: 'disabled',
        });
    });

    it('is invalid on a non-boolean flag or malformed transport', () => {
        expect(resolveShareLinkPublicApiConfig({ SHARE_LINK_PUBLIC_API_ENABLED: 'yes' })).toEqual({
            status: 'invalid',
        });
        expect(
            resolveShareLinkPublicApiConfig({
                SHARE_LINK_PUBLIC_API_ENABLED: 'true',
                SHARE_LINK_MAINTENANCE_NAMESPACE: 'ns',
                SHARE_LINK_MAINTENANCE_ORIGIN: 'not-a-url',
                SHARE_LINK_MAINTENANCE_AUDIENCE: 'did:web:x',
            })
        ).toEqual({ status: 'invalid' });
        expect(
            resolveShareLinkPublicApiConfig({
                SHARE_LINK_PUBLIC_API_ENABLED: true,
                SHARE_LINK_MAINTENANCE_NAMESPACE: '',
                SHARE_LINK_MAINTENANCE_ORIGIN: 'https://learncloud.example',
                SHARE_LINK_MAINTENANCE_AUDIENCE: 'did:web:learncloud.example',
            })
        ).toEqual({ status: 'invalid' });
    });

    it('enables only with the shared validated transport and never couples to owner/maintenance flags', () => {
        expect(
            resolveShareLinkPublicApiConfig({
                ...enabledEnv,
                SHARE_LINK_OWNER_API_ENABLED: 'false',
                SHARE_LINK_MAINTENANCE_ENABLED: 'false',
            })
        ).toEqual({
            status: 'enabled',
            namespace: 'deployment-ns',
            origin: 'https://learncloud.example',
            audience: 'did:web:learncloud.example',
            allowInsecureLoopback: false,
        });
    });

    it('never echoes a raw value on malformed input', () => {
        const result = resolveShareLinkPublicApiConfig({
            SHARE_LINK_PUBLIC_API_ENABLED: 'true',
            SHARE_LINK_MAINTENANCE_NAMESPACE: 'secret namespace',
        });

        expect(JSON.stringify(result)).not.toContain('secret namespace');
    });
});
