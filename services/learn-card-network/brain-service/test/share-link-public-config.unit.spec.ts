import { describe, expect, it } from 'vitest';
import { resolveShareLinkPublicApiConfig } from '../src/helpers/share-link-public/config';

const configuredEnv = {
    SHARE_LINK_MAINTENANCE_NAMESPACE: 'deployment-ns',
    SHARE_LINK_MAINTENANCE_ORIGIN: 'https://learncloud.example',
    SHARE_LINK_MAINTENANCE_AUDIENCE: 'did:web:learncloud.example',
};

describe('resolveShareLinkPublicApiConfig', () => {
    it('does no setup without service wiring', () => {
        expect(resolveShareLinkPublicApiConfig({})).toEqual({ status: 'disabled' });
        expect(
            resolveShareLinkPublicApiConfig({
                SHARE_LINK_MAINTENANCE_NAMESPACE: '',
                SHARE_LINK_MAINTENANCE_ORIGIN: '',
                SHARE_LINK_MAINTENANCE_AUDIENCE: '',
            })
        ).toEqual({ status: 'disabled' });
    });
    it('rejects partial or malformed transport', () => {
        expect(resolveShareLinkPublicApiConfig({ SHARE_LINK_MAINTENANCE_NAMESPACE: 'ns' })).toEqual(
            { status: 'invalid' }
        );
        expect(
            resolveShareLinkPublicApiConfig({
                ...configuredEnv,
                SHARE_LINK_MAINTENANCE_ORIGIN: 'not-a-url',
            })
        ).toEqual({ status: 'invalid' });
        expect(
            resolveShareLinkPublicApiConfig({
                ...configuredEnv,
                SHARE_LINK_MAINTENANCE_NAMESPACE: '',
            })
        ).toEqual({ status: 'invalid' });
    });
    it('is available with valid service wiring and no rollout flag', () => {
        expect(resolveShareLinkPublicApiConfig(configuredEnv)).toEqual({
            status: 'enabled',
            namespace: 'deployment-ns',
            origin: 'https://learncloud.example',
            audience: 'did:web:learncloud.example',
            allowInsecureLoopback: false,
        });
    });
    it('ignores a retired rollout flag rather than disabling configured APIs', () => {
        expect(
            resolveShareLinkPublicApiConfig({
                ...configuredEnv,
                SHARE_LINK_PUBLIC_API_ENABLED: 'false',
            }).status
        ).toBe('enabled');
    });
    it('never echoes malformed values', () => {
        expect(
            JSON.stringify(
                resolveShareLinkPublicApiConfig({
                    SHARE_LINK_MAINTENANCE_NAMESPACE: 'secret namespace',
                })
            )
        ).not.toContain('secret namespace');
    });
});
