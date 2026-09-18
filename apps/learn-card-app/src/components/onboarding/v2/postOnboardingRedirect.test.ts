import { describe, expect, it } from 'vitest';

import { resolvePostOnboardingRedirect } from './postOnboardingRedirect';

describe('resolvePostOnboardingRedirect', () => {
    it('resumes a preserved in-app claim redirect after onboarding', () => {
        const claimPath = '/request?vc_request_url=https%3A%2F%2Fexample.com%2Fexchange';

        expect(resolvePostOnboardingRedirect(claimPath)).toBe(claimPath);
    });

    it('returns null when nothing is pending', () => {
        expect(resolvePostOnboardingRedirect(null)).toBeNull();
        expect(resolvePostOnboardingRedirect(undefined)).toBeNull();
        expect(resolvePostOnboardingRedirect('')).toBeNull();
        expect(resolvePostOnboardingRedirect('   ')).toBeNull();
    });

    it('rejects external, protocol-relative, and non-path values', () => {
        expect(resolvePostOnboardingRedirect('https://evil.example.com')).toBeNull();
        expect(resolvePostOnboardingRedirect('//evil.example.com')).toBeNull();
        expect(resolvePostOnboardingRedirect('javascript:alert(1)')).toBeNull();
        expect(resolvePostOnboardingRedirect('dashboard')).toBeNull();
        expect(resolvePostOnboardingRedirect('/\\evil.example.com')).toBeNull();
    });

    it('trims surrounding whitespace from a valid path', () => {
        expect(resolvePostOnboardingRedirect('  /request?vc_request_url=x  ')).toBe(
            '/request?vc_request_url=x'
        );
    });
});
