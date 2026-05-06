import { describe, it, expect, beforeEach } from 'vitest';

import {
    resolveTenantFromRequest,
    registerOriginMapping,
    registerTenantBranding,
} from '../tenant-registry';
import type { RequestHeaders } from '../tenant-registry';

// ---------------------------------------------------------------------------
// resolveTenantFromRequest
// ---------------------------------------------------------------------------

describe('resolveTenantFromRequest', () => {
    // -- Priority 1: X-Tenant-Id header --------------------------------------

    describe('X-Tenant-Id header', () => {
        it('resolves tenant from explicit header', () => {
            const headers: RequestHeaders = { 'x-tenant-id': 'vetpass' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('header');
        });

        it('takes priority over Origin header', () => {
            const headers: RequestHeaders = {
                'x-tenant-id': 'vetpass',
                origin: 'https://learncard.app',
            };

            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('header');
        });

        it('takes priority over env default', () => {
            const headers: RequestHeaders = { 'x-tenant-id': 'vetpass' };
            const result = resolveTenantFromRequest(headers, 'learncard');

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('header');
        });

        it('handles array header values (takes first)', () => {
            const headers: RequestHeaders = { 'x-tenant-id': ['vetpass', 'learncard'] };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
        });
    });

    // -- Priority 2: Origin / Referer header ---------------------------------

    describe('Origin header', () => {
        it('resolves learncard from learncard.app origin', () => {
            const headers: RequestHeaders = { origin: 'https://learncard.app' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('learncard');
            expect(result.resolvedVia).toBe('origin');
        });

        it('resolves vetpass from vetpass.app origin', () => {
            const headers: RequestHeaders = { origin: 'https://vetpass.app' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('origin');
        });

        it('resolves vetpass from alpha.vetpass.app', () => {
            const headers: RequestHeaders = { origin: 'https://alpha.vetpass.app' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('origin');
        });

        it('resolves vetpass from staging.vetpass.app', () => {
            const headers: RequestHeaders = { origin: 'https://staging.vetpass.app' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('origin');
        });

        it('resolves learncard from staging.learncard.app', () => {
            const headers: RequestHeaders = { origin: 'https://staging.learncard.app' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('learncard');
            expect(result.resolvedVia).toBe('origin');
        });

        it('resolves learncard from app.learncard.com', () => {
            const headers: RequestHeaders = { origin: 'https://app.learncard.com' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('learncard');
            expect(result.resolvedVia).toBe('origin');
        });

        it('resolves learncard from localhost', () => {
            const headers: RequestHeaders = { origin: 'http://localhost:3000' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('learncard');
            expect(result.resolvedVia).toBe('origin');
        });

        it('strips subdomains progressively (deep subdomain)', () => {
            const headers: RequestHeaders = { origin: 'https://deep.nested.vetpass.app' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('origin');
        });
    });

    describe('Referer fallback', () => {
        it('uses referer when origin is missing', () => {
            const headers: RequestHeaders = { referer: 'https://vetpass.app/some/page' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('origin');
        });
    });

    // -- Priority 3: env default ---------------------------------------------

    describe('env default', () => {
        it('uses envTenantId when no headers match', () => {
            const headers: RequestHeaders = {};
            const result = resolveTenantFromRequest(headers, 'vetpass');

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('env');
        });

        it('ignores unknown origin and falls through to env', () => {
            const headers: RequestHeaders = { origin: 'https://unknown-site.com' };
            const result = resolveTenantFromRequest(headers, 'vetpass');

            expect(result.id).toBe('vetpass');
            expect(result.resolvedVia).toBe('env');
        });
    });

    // -- Priority 4: safe default --------------------------------------------

    describe('safe default', () => {
        it('returns learncard when nothing matches', () => {
            const headers: RequestHeaders = {};
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('learncard');
            expect(result.resolvedVia).toBe('default');
        });

        it('returns learncard for unknown origin with no env fallback', () => {
            const headers: RequestHeaders = { origin: 'https://random-site.io' };
            const result = resolveTenantFromRequest(headers);

            expect(result.id).toBe('learncard');
            expect(result.resolvedVia).toBe('default');
        });
    });

    // -- Branding resolved correctly -----------------------------------------

    describe('emailBranding', () => {
        it('returns empty branding for learncard (uses defaults)', () => {
            const result = resolveTenantFromRequest({ 'x-tenant-id': 'learncard' });

            expect(result.emailBranding).toEqual({});
        });

        it('returns vetpass overrides for vetpass tenant', () => {
            const result = resolveTenantFromRequest({ 'x-tenant-id': 'vetpass' });

            expect(result.emailBranding.brandName).toBe('VetPass');
            expect(result.emailBranding.primaryColor).toBe('#1B5E20');
            expect(result.emailBranding.supportEmail).toBe('support@vetpass.app');
        });

        it('returns empty branding for unknown tenant', () => {
            const result = resolveTenantFromRequest({ 'x-tenant-id': 'unknown-tenant' });

            expect(result.emailBranding).toEqual({});
        });
    });

    // -- Edge cases ----------------------------------------------------------

    describe('edge cases', () => {
        it('handles empty string header gracefully', () => {
            const headers: RequestHeaders = { 'x-tenant-id': '' };
            const result = resolveTenantFromRequest(headers);

            // Empty string is falsy → falls through to default
            expect(result.resolvedVia).not.toBe('header');
        });

        it('handles malformed origin URL gracefully', () => {
            const headers: RequestHeaders = { origin: 'not-a-url' };
            const result = resolveTenantFromRequest(headers);

            // Should not throw, falls through to default
            expect(result.id).toBe('learncard');
            expect(result.resolvedVia).toBe('default');
        });
    });
});

// ---------------------------------------------------------------------------
// registerOriginMapping
// ---------------------------------------------------------------------------

describe('registerOriginMapping', () => {
    it('allows resolving a newly registered origin', () => {
        registerOriginMapping('custom-deploy.example.com', 'custom-tenant');

        const result = resolveTenantFromRequest({
            origin: 'https://custom-deploy.example.com',
        });

        expect(result.id).toBe('custom-tenant');
        expect(result.resolvedVia).toBe('origin');
    });
});

// ---------------------------------------------------------------------------
// registerTenantBranding
// ---------------------------------------------------------------------------

describe('registerTenantBranding', () => {
    it('adds branding for a new tenant', () => {
        registerTenantBranding('new-tenant', { brandName: 'NewBrand' });

        const result = resolveTenantFromRequest({ 'x-tenant-id': 'new-tenant' });

        expect(result.emailBranding.brandName).toBe('NewBrand');
    });

    it('merges branding with existing values', () => {
        registerTenantBranding('vetpass', { logoUrl: 'https://vetpass.app/logo.png' });

        const result = resolveTenantFromRequest({ 'x-tenant-id': 'vetpass' });

        // Merged — both old and new values present
        expect(result.emailBranding.brandName).toBe('VetPass');
        expect(result.emailBranding.logoUrl).toBe('https://vetpass.app/logo.png');
    });
});
