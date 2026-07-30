/**
 * Smoke tests for the OpenID4VC friendly-error mapper. The actual error
 * classes live in `@learncard/openid4vc-plugin`, but this mapper deliberately
 * does not depend on that package \u2014 it discriminates on `error.name` and
 * `error.code`. These tests use plain object literals to mirror what the
 * plugin would throw at runtime.
 */

import { describe, it, expect } from 'vitest';

import { getFriendlyOpenID4VCError } from '../openid4vcErrors';

describe('getFriendlyOpenID4VCError', () => {
    describe('VciError', () => {
        it('maps a known code to specific copy', () => {
            const result = getFriendlyOpenID4VCError({
                name: 'VciError',
                code: 'tx_code_required',
                message: 'Issuer requires a transaction code',
            });

            expect(result.title).toBe('Transaction code required');
            expect(result.suggestion).toContain('code');
        });

        it('falls back to generic copy for an unknown code', () => {
            const result = getFriendlyOpenID4VCError({
                name: 'VciError',
                code: 'not_a_real_code',
                message: 'Mystery error',
            });

            expect(result.title).toBe('Something went wrong');
        });
    });

    describe('CredentialOfferParseError', () => {
        it('maps invalid_uri to the "Invalid offer link" message', () => {
            const result = getFriendlyOpenID4VCError({
                name: 'CredentialOfferParseError',
                code: 'invalid_uri',
                message: 'Offer URI must be a non-empty string',
            });

            expect(result.title).toBe('Invalid offer link');
        });

        it('maps missing_credentials to a credential-list message', () => {
            const result = getFriendlyOpenID4VCError({
                name: 'CredentialOfferParseError',
                code: 'missing_credentials',
                message: '...',
            });

            expect(result.title).toBe('Offer missing credentials');
        });
    });

    describe('VpError', () => {
        it('maps no_match to a "no matching credentials" message', () => {
            const result = getFriendlyOpenID4VCError({
                name: 'VpError',
                code: 'no_match',
                message: '...',
            });

            expect(result.title).toBe('No matching credentials');
        });

        it('also handles VpSubmitError, BuildPresentationError, etc. via the same VP map', () => {
            const result = getFriendlyOpenID4VCError({
                name: 'VpSubmitError',
                code: 'server_error',
                message: '...',
            });

            expect(result.title).toBe('Verifier server error');
        });
    });

    describe('RequestObjectError', () => {
        it('maps signature errors to a security-flavored warning', () => {
            const result = getFriendlyOpenID4VCError({
                name: 'RequestObjectError',
                code: 'request_signature_invalid',
                message: '...',
            });

            expect(result.title).toBe('Verifier signature invalid');
            expect(result.suggestion.toLowerCase()).toContain('don\u2019t share credentials');
        });
    });

    describe('fallback paths', () => {
        it('returns the network-flavored copy for fetch failures', () => {
            const result = getFriendlyOpenID4VCError(new Error('Failed to fetch'));

            expect(result.title).toBe('Connection issue');
        });

        it('falls back to generic copy for an opaque Error', () => {
            const result = getFriendlyOpenID4VCError(new Error('Mystery error'));

            expect(result.title).toBe('Something went wrong');
        });

        it('handles strings, undefined, and unrelated values gracefully', () => {
            expect(getFriendlyOpenID4VCError('boom').title).toBe('Something went wrong');
            expect(getFriendlyOpenID4VCError(undefined).title).toBe('Something went wrong');
            expect(getFriendlyOpenID4VCError(42).title).toBe('Something went wrong');
        });

        it('cross-matches a code by lookup if the error name is unrecognized', () => {
            // Some plugin internals throw with `code` but no custom `name`;
            // the mapper should still match by code lookup across all maps.
            const result = getFriendlyOpenID4VCError({
                name: 'Error',
                code: 'tx_code_required',
                message: '...',
            });

            expect(result.title).toBe('Transaction code required');
        });
    });
});
