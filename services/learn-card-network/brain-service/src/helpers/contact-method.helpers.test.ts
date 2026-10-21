import { describe, expect, it, vi } from 'vitest';

const environment = vi.hoisted(() => ({
    CLIENT_APP_DOMAIN_NAME: undefined as string | undefined,
    CLIENT_APP_PORT: undefined as number | undefined,
    PORT: 4000,
    IS_OFFLINE: true,
}));
vi.mock('@environment', () => ({ environment }));
vi.mock('@cache', () => ({ default: {} }));

import { generateClaimUrl } from './contact-method.helpers';

describe('inbox claim links', () => {
    it('opens the default frontend instead of the backend port', () => {
        expect(generateClaimUrl('test-token')).toBe(
            'http://localhost:3000/interactions/inbox-claim/test-token?iuv=1'
        );
    });

    it('uses the configured frontend port locally', () => {
        environment.CLIENT_APP_PORT = 3100;
        try {
            expect(generateClaimUrl('test-token')).toContain('http://localhost:3100/');
        } finally {
            environment.CLIENT_APP_PORT = undefined;
        }
    });

    it('honors a configured app domain locally and keeps production HTTPS', () => {
        environment.CLIENT_APP_DOMAIN_NAME = 'app.example.org';
        try {
            expect(generateClaimUrl('test-token')).toContain('http://app.example.org/');
            environment.IS_OFFLINE = false;
            expect(generateClaimUrl('test-token')).toBe(
                'https://app.example.org/interactions/inbox-claim/test-token?iuv=1'
            );
        } finally {
            environment.IS_OFFLINE = true;
            environment.CLIENT_APP_DOMAIN_NAME = undefined;
        }
    });
});
