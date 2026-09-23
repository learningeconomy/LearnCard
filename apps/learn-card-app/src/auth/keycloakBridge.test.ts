import { describe, it, expect } from 'vitest';
import { buildKeycloakBridgeUrl } from './keycloakBridge';

describe('buildKeycloakBridgeUrl', () => {
    it('returns authorizeUrl if bridgeUrl is not provided', () => {
        const authorizeUrl = 'https://keycloak.example.com/auth';
        expect(buildKeycloakBridgeUrl(authorizeUrl)).toBe(authorizeUrl);
    });

    it('appends authorizeUrl as next hash parameter to bridgeUrl', () => {
        const authorizeUrl = 'https://keycloak.example.com/auth?client_id=123';
        const bridgeUrl = 'https://app.example.com/auth/continue.html';

        const result = buildKeycloakBridgeUrl(authorizeUrl, bridgeUrl);

        expect(result).toBe(
            'https://app.example.com/auth/continue.html#next=https%3A%2F%2Fkeycloak.example.com%2Fauth%3Fclient_id%3D123'
        );
    });

    it('strips existing fragment from bridgeUrl', () => {
        const authorizeUrl = 'https://keycloak.example.com/auth';
        const bridgeUrl = 'https://app.example.com/auth/continue.html#old=hash';

        const result = buildKeycloakBridgeUrl(authorizeUrl, bridgeUrl);

        expect(result).toBe(
            'https://app.example.com/auth/continue.html#next=https%3A%2F%2Fkeycloak.example.com%2Fauth'
        );
    });
});
