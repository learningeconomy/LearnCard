import { describe, expect, it } from 'vitest';

import type { FriendlyErrorInfo } from '../helpers/openid4vcErrors';
import { decideRecovery } from './decideRecovery';
import { createEmptyAttemptLog } from './types';

const friendly = (kind: FriendlyErrorInfo['kind']): FriendlyErrorInfo => ({
    kind,
    title: 't',
    description: 'd',
    suggestion: 's',
});

const sigResolutionError = new Error('No valid public key JWKs found in DID document for did:web:…');
const transportError = new Error('fetch failed');
const formatGapError = new Error('unsupported_format');
const trustGapError = new Error('Issuer not trusted');
const unknownError = new Error('mysterious');

describe('decideRecovery', () => {
    describe('signer-resolution failures', () => {
        it('silently switches to did:key when did:web fails on a walt.id-style error', () => {
            const decision = decideRecovery({
                friendly: friendly('wallet'),
                raw: sigResolutionError,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision).toEqual({
                kind: 'retry_silent',
                nextStrategy: { axis: 'signer', id: 'did:key' },
            });
        });

        it('matches "could not resolve DID" / "invalid_proof" / "unable to dereference"', () => {
            const messages = [
                'could not resolve DID',
                'invalid_proof: kid not found',
                'Unable to dereference verification method',
                'unknown verification method',
            ];
            for (const msg of messages) {
                const decision = decideRecovery({
                    friendly: friendly('wallet'),
                    raw: new Error(msg),
                    attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                    availableSigners: ['did:web', 'did:key'],
                });
                expect(decision.kind).toBe('retry_silent');
            }
        });

        it('reads err.body.message when the plugin wraps the issuer response in a generic VciError', () => {
            // Regression: walt.id returns 500 with the real error in the
            // body, and the plugin wraps it with a generic message like
            // "Credential endpoint returned 500 (unknown)". The pattern
            // match must search err.body.message, not just err.message.
            const wrapped = Object.assign(new Error('Credential endpoint returned 500 (unknown)'), {
                name: 'VciError',
                code: 'credential_request_failed',
                status: 500,
                body: {
                    exception: true,
                    id: 'IllegalStateException',
                    status: 'Internal Server Error',
                    code: '500',
                    message:
                        'No valid public key JWKs found in DID document for did:web:staging.network.learncard.com:users:demo-account',
                },
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
            if (decision.kind !== 'retry_silent') return;
            expect(decision.nextStrategy).toEqual({ axis: 'signer', id: 'did:key' });
        });

        it('reads OAuth2-style error_description on err.body', () => {
            const wrapped = Object.assign(new Error('Generic'), {
                name: 'VciError',
                code: 'credential_request_failed',
                body: { error: 'invalid_proof', error_description: 'kid could not resolve DID' },
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
        });

        it('reads err.cause when the root failure is a wrapped fetch error', () => {
            const wrapped = Object.assign(new Error('Generic'), {
                name: 'VciError',
                code: 'credential_request_failed',
                cause: new Error('No valid public key JWKs in DID document'),
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
        });
    });

    describe('structured signer-failure dispatch', () => {
        it('matches VciError + credential_request_failed + 5xx (the walt.id case) regardless of message text', () => {
            const wrapped = Object.assign(new Error('Generic wrapper'), {
                name: 'VciError',
                code: 'credential_request_failed',
                status: 500,
                body: { something: 'totally unrelated to DIDs' },
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
        });

        it('matches VciError + proof_signing_failed at any status', () => {
            const wrapped = Object.assign(new Error('no status field'), {
                name: 'VciError',
                code: 'proof_signing_failed',
            });

            const decision = decideRecovery({
                friendly: friendly('wallet'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
        });

        it('matches VpSubmitError on 5xx (verifier-side retryable)', () => {
            const wrapped = Object.assign(new Error('Generic'), {
                name: 'VpSubmitError',
                status: 503,
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
        });

        it('matches OAuth2-style body.error = "invalid_proof"', () => {
            const wrapped = Object.assign(new Error('Generic'), {
                name: 'VciError',
                code: 'token_request_failed',
                body: { error: 'invalid_proof', error_description: 'kid not bound' },
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
        });

        it('does NOT match VciError + credential_request_failed at 4xx (user error, not server)', () => {
            const wrapped = Object.assign(new Error('Bad request'), {
                name: 'VciError',
                code: 'credential_request_failed',
                status: 400,
                body: { error: 'invalid_request' },
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('surface_error');
        });

        it('does NOT match VpError (not in the dispatch table)', () => {
            const wrapped = Object.assign(new Error('Generic'), {
                name: 'VpError',
                status: 500,
            });

            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: wrapped,
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('surface_error');
        });

        it('prompts the user before falling back to a non-did:key signer strategy', () => {
            // `decideRecovery` is generic over signer-strategy ids (the
            // app picks which ones are applicable). The policy under test
            // is: any next strategy that isn't `did:key` requires user
            // consent first because it surfaces a different identity to
            // the counterparty.
            const decision = decideRecovery({
                friendly: friendly('wallet'),
                raw: sigResolutionError,
                attempted: {
                    ...createEmptyAttemptLog(),
                    signersTried: ['did:web', 'did:key'],
                },
                availableSigners: ['did:web', 'did:key', 'did:hypothetical'],
            });

            expect(decision.kind).toBe('retry_with_prompt');
            if (decision.kind !== 'retry_with_prompt') return;
            expect(decision.nextStrategy).toEqual({
                axis: 'signer',
                id: 'did:hypothetical',
            });
            expect(decision.prompt.severity).toBe('info');
            expect(decision.prompt.title).not.toMatch(/DID|JWK|wallet/i);
        });

        it('surfaces the error when all signer strategies are exhausted', () => {
            const decision = decideRecovery({
                friendly: friendly('wallet'),
                raw: sigResolutionError,
                attempted: {
                    ...createEmptyAttemptLog(),
                    signersTried: ['did:web', 'did:key'],
                },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('surface_error');
        });

        it('treats request_invalid + matching pattern as signer-resolution too', () => {
            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: new Error('invalid_proof: jwt rejected'),
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('retry_silent');
        });

        it('does NOT treat plain wallet errors without DID-resolution markers as signer failures', () => {
            const decision = decideRecovery({
                friendly: friendly('wallet'),
                raw: new Error('storage quota exceeded'),
                attempted: { ...createEmptyAttemptLog(), signersTried: ['did:web'] },
                availableSigners: ['did:web', 'did:key'],
            });

            expect(decision.kind).toBe('surface_error');
        });
    });

    describe('transport errors', () => {
        it('retries silently with exponential backoff', () => {
            const first = decideRecovery({
                friendly: friendly('transport'),
                raw: transportError,
                attempted: createEmptyAttemptLog(),
                availableSigners: ['did:key'],
            });

            expect(first.kind).toBe('retry_silent');
            if (first.kind !== 'retry_silent') return;
            expect(first.backoffMs).toBe(1000);
            expect(first.nextStrategy.axis).toBe('transport');
        });

        it('uses exponentially growing backoff', () => {
            const second = decideRecovery({
                friendly: friendly('transport'),
                raw: transportError,
                attempted: { ...createEmptyAttemptLog(), transportRetries: 1 },
                availableSigners: ['did:key'],
            });

            expect(second.kind).toBe('retry_silent');
            if (second.kind !== 'retry_silent') return;
            expect(second.backoffMs).toBe(2000);
        });

        it('caps backoff at 5000ms', () => {
            const decision = decideRecovery({
                friendly: friendly('transport'),
                raw: transportError,
                attempted: { ...createEmptyAttemptLog(), transportRetries: 1 },
                availableSigners: ['did:key'],
            });
            expect(decision.kind).toBe('retry_silent');
            if (decision.kind !== 'retry_silent') return;
            expect(decision.backoffMs).toBeLessThanOrEqual(5000);
        });

        it('gives up after MAX_TRANSPORT_RETRIES', () => {
            const decision = decideRecovery({
                friendly: friendly('transport'),
                raw: transportError,
                attempted: { ...createEmptyAttemptLog(), transportRetries: 2 },
                availableSigners: ['did:key'],
            });

            expect(decision.kind).toBe('surface_error');
        });
    });

    describe('trust gap', () => {
        it('prompts the user with a warning-severity dialog on first occurrence', () => {
            const decision = decideRecovery({
                friendly: friendly('trust_gap'),
                raw: trustGapError,
                attempted: createEmptyAttemptLog(),
                availableSigners: ['did:key'],
            });

            expect(decision.kind).toBe('retry_with_prompt');
            if (decision.kind !== 'retry_with_prompt') return;
            expect(decision.prompt.severity).toBe('warning');
            expect(decision.nextStrategy).toEqual({ axis: 'trust', id: 'accept-untrusted' });
        });

        it('does not re-prompt for the same trust gap twice', () => {
            const decision = decideRecovery({
                friendly: friendly('trust_gap'),
                raw: trustGapError,
                attempted: { ...createEmptyAttemptLog(), trustGapsAccepted: 1 },
                availableSigners: ['did:key'],
            });
            expect(decision.kind).toBe('surface_error');
        });
    });

    describe('terminal classifications', () => {
        it('format_gap is non-recoverable', () => {
            const decision = decideRecovery({
                friendly: friendly('format_gap'),
                raw: formatGapError,
                attempted: createEmptyAttemptLog(),
                availableSigners: ['did:key'],
            });
            expect(decision.kind).toBe('surface_error');
        });

        it('plain request_invalid (without signer-resolution markers) is non-recoverable', () => {
            const decision = decideRecovery({
                friendly: friendly('request_invalid'),
                raw: new Error('Bad request'),
                attempted: createEmptyAttemptLog(),
                availableSigners: ['did:key'],
            });
            expect(decision.kind).toBe('surface_error');
        });

        it('unknown is non-recoverable', () => {
            const decision = decideRecovery({
                friendly: friendly('unknown'),
                raw: unknownError,
                attempted: createEmptyAttemptLog(),
                availableSigners: ['did:key'],
            });
            expect(decision.kind).toBe('surface_error');
        });
    });
});
