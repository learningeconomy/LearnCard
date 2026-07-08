import { VerificationStatusEnum } from '@learncard/types';

import { prettifyVerificationItem, prettifyVerificationItems } from '../verificationPrettifier';

describe('verificationPrettifier', () => {
    describe('SD-JWT-VC success checks', () => {
        it('prettifies parse', () => {
            expect(
                prettifyVerificationItem({
                    check: 'parse',
                    message: 'parse',
                    status: VerificationStatusEnum.Success,
                })
            ).toEqual({
                check: 'Format',
                message: 'Valid',
                status: VerificationStatusEnum.Success,
            });
        });

        it('prettifies disclosure_hash_integrity', () => {
            expect(
                prettifyVerificationItem({
                    check: 'disclosure_hash_integrity',
                    message: 'disclosure_hash_integrity',
                    status: VerificationStatusEnum.Success,
                })
            ).toEqual({
                check: 'Selective Disclosure',
                message: 'Claims verified',
                status: VerificationStatusEnum.Success,
            });
        });

        it('prettifies issuer_resolved and issuer_signature', () => {
            const resolved = prettifyVerificationItem({
                check: 'issuer_resolved',
                message: 'issuer_resolved',
                status: VerificationStatusEnum.Success,
            });
            const signature = prettifyVerificationItem({
                check: 'issuer_signature',
                message: 'issuer_signature',
                status: VerificationStatusEnum.Success,
            });
            expect(resolved.check).toBe('Issuer');
            expect(resolved.message).toBe('Identified');
            expect(signature.check).toBe('Signature');
            expect(signature.message).toBe('Valid');
        });

        it('prettifies expiration success', () => {
            expect(
                prettifyVerificationItem({
                    check: 'expiration',
                    message: 'expiration',
                    status: VerificationStatusEnum.Success,
                })
            ).toEqual({
                check: 'Expiration',
                message: 'Does Not Expire',
                status: VerificationStatusEnum.Success,
            });
        });
    });

    describe('SD-JWT-VC failure cases', () => {
        it('extracts error code from message and labels it', () => {
            expect(
                prettifyVerificationItem({
                    check: 'signature_invalid',
                    message: 'signature_invalid: signature verification failed',
                    status: VerificationStatusEnum.Failed,
                })
            ).toEqual({
                check: 'Signature',
                message: 'Invalid',
                status: VerificationStatusEnum.Failed,
            });
        });

        it('handles expired error', () => {
            expect(
                prettifyVerificationItem({
                    check: 'expired',
                    message: 'expired: Credential expired at 2024-01-01T00:00:00.000Z',
                    status: VerificationStatusEnum.Failed,
                })
            ).toEqual({
                check: 'Expiration',
                message: 'Expired',
                status: VerificationStatusEnum.Failed,
            });
        });

        it('handles disclosure tampering', () => {
            const result = prettifyVerificationItem({
                check: 'disclosure_hash_mismatch',
                message: 'disclosure_hash_mismatch: hash does not match',
                status: VerificationStatusEnum.Failed,
            });
            expect(result.check).toBe('Selective Disclosure');
            expect(result.message).toBe('Tampered');
        });
    });

    describe('idempotency', () => {
        it('leaves already-prettified items alone (capitalized check)', () => {
            const item = {
                check: 'Expiration',
                message: 'Does Not Expire',
                status: VerificationStatusEnum.Success,
            };
            expect(prettifyVerificationItem(item)).toEqual(item);
        });

        it('leaves already-prettified items alone (space in check)', () => {
            const item = {
                check: 'Credential Type',
                message: 'Verified',
                status: VerificationStatusEnum.Success,
            };
            expect(prettifyVerificationItem(item)).toEqual(item);
        });

        it('handles double-prettify (no double-application)', () => {
            const raw = {
                check: 'parse',
                message: 'parse',
                status: VerificationStatusEnum.Success,
            };
            const once = prettifyVerificationItem(raw);
            const twice = prettifyVerificationItem(once);
            expect(twice).toEqual(once);
        });
    });

    describe('W3C VC checks', () => {
        it('prettifies proof', () => {
            const result = prettifyVerificationItem({
                check: 'proof',
                message: 'proof',
                status: VerificationStatusEnum.Success,
            });
            expect(result.check).toBe('Proof');
            expect(result.message).toBe('Valid');
        });

        it('prettifies credentialStatus and credentialSchema', () => {
            const status = prettifyVerificationItem({
                check: 'credentialStatus',
                message: 'credentialStatus',
                status: VerificationStatusEnum.Success,
            });
            expect(status.check).toBe('Status');
            expect(status.message).toBe('Active');
        });
    });

    describe('preserves humanized messages from upstream verifiers (regression)', () => {
        it('preserves W3C VC expiration date message', () => {
            const item = {
                check: 'expiration',
                message: 'Expires 28 FEB 2023',
                status: VerificationStatusEnum.Success,
            };
            expect(prettifyVerificationItem(item)).toEqual({
                check: 'Expiration',
                message: 'Expires 28 FEB 2023',
                status: VerificationStatusEnum.Success,
            });
        });

        it('preserves W3C VC "Does Not Expire" message verbatim', () => {
            const item = {
                check: 'expiration',
                message: 'Does Not Expire',
                status: VerificationStatusEnum.Success,
            };
            expect(prettifyVerificationItem(item)).toEqual({
                check: 'Expiration',
                message: 'Does Not Expire',
                status: VerificationStatusEnum.Success,
            });
        });

        it('preserves humanized proof message', () => {
            const item = {
                check: 'proof',
                message: 'Valid',
                status: VerificationStatusEnum.Success,
            };
            expect(prettifyVerificationItem(item)).toEqual({
                check: 'Proof',
                message: 'Valid',
                status: VerificationStatusEnum.Success,
            });
        });

        it('still replaces raw lowercase message (SD-JWT-VC shape)', () => {
            expect(
                prettifyVerificationItem({
                    check: 'expiration',
                    message: 'expiration',
                    status: VerificationStatusEnum.Success,
                })
            ).toEqual({
                check: 'Expiration',
                message: 'Does Not Expire',
                status: VerificationStatusEnum.Success,
            });
        });

        it('still replaces undefined message (SD-JWT-VC shape)', () => {
            expect(
                prettifyVerificationItem({
                    check: 'expiration',
                    status: VerificationStatusEnum.Success,
                })
            ).toEqual({
                check: 'Expiration',
                message: 'Does Not Expire',
                status: VerificationStatusEnum.Success,
            });
        });
    });

    describe('failed items do not leak into SUCCESS_LABELS (regression)', () => {
        it('failed expiration check does not become "Does Not Expire"', () => {
            const item = {
                check: 'expiration',
                status: VerificationStatusEnum.Failed,
                details: 'Expired 28 FEB 2023',
            };
            const result = prettifyVerificationItem(item);
            expect(result.check).not.toBe('Expiration');
            expect(result.message).not.toBe('Does Not Expire');
            expect(result.status).toBe(VerificationStatusEnum.Failed);
        });

        it('failed proof check does not become "Valid"', () => {
            const item = {
                check: 'proof',
                status: VerificationStatusEnum.Failed,
                details: 'signature mismatch',
            };
            const result = prettifyVerificationItem(item);
            expect(result.message).not.toBe('Valid');
            expect(result.status).toBe(VerificationStatusEnum.Failed);
        });

        it('failed item with known ERROR_LABEL still gets prettified', () => {
            expect(
                prettifyVerificationItem({
                    check: 'expired',
                    message: 'expired',
                    status: VerificationStatusEnum.Failed,
                })
            ).toEqual({
                check: 'Expiration',
                message: 'Expired',
                status: VerificationStatusEnum.Failed,
            });
        });
    });

    describe('fallback behavior', () => {
        it('leaves unknown checks alone', () => {
            const item = {
                check: 'unknown_check',
                message: 'some message',
                status: VerificationStatusEnum.Success,
            };
            expect(prettifyVerificationItem(item)).toEqual(item);
        });

        it('handles empty check', () => {
            const item = {
                check: '',
                message: 'just a message',
                status: VerificationStatusEnum.Success,
            };
            expect(prettifyVerificationItem(item)).toEqual(item);
        });
    });

    describe('real W3C verifier (learn-card/verify.ts) failure shape', () => {
        it('prettifies a failure whose code lives in a spaced check + details (not message)', () => {
            const result = prettifyVerificationItem({
                check: 'signature_invalid: bad signature',
                details: 'signature_invalid: bad signature',
                status: VerificationStatusEnum.Failed,
            });
            expect(result.check).toBe('Signature');
        });

        it('preserves humanized details on a failure rather than synthesizing a generic message', () => {
            const result = prettifyVerificationItem({
                check: 'expired',
                details: 'Expired 28 FEB 2023',
                status: VerificationStatusEnum.Failed,
            });
            expect(result.check).toBe('Expiration');
            expect(result.details).toBe('Expired 28 FEB 2023');
            expect(result.message).toBeUndefined();
        });

        it('does not map a failed status row (check "status") to a generic label', () => {
            const result = prettifyVerificationItem({
                check: 'status',
                details: 'Status: Revoked',
                status: VerificationStatusEnum.Failed,
            });
            expect(result.details).toBe('Status: Revoked');
            expect(result.message).not.toBe('Revoked or suspended');
        });
    });

    describe('W3C verifier status success normalization (NB2)', () => {
        it('prettifies a lowercase "status" success check', () => {
            const result = prettifyVerificationItem({
                check: 'status',
                message: 'status',
                status: VerificationStatusEnum.Success,
            });
            expect(result.check).toBe('Status');
            expect(result.message).toBe('Active');
        });

        it('preserves a humanized status message like "Not Revoked"', () => {
            const result = prettifyVerificationItem({
                check: 'status',
                message: 'Not Revoked',
                status: VerificationStatusEnum.Success,
            });
            expect(result.check).toBe('Status');
            expect(result.message).toBe('Not Revoked');
        });
    });

    describe('double-prettify idempotency on real shapes', () => {
        it('is idempotent on a failed signature shape', () => {
            const raw = {
                check: 'signature_invalid',
                message: 'signature_invalid: bad signature',
                status: VerificationStatusEnum.Failed,
            };
            const once = prettifyVerificationItem(raw);
            const twice = prettifyVerificationItem(once);
            expect(twice).toEqual(once);
        });

        it('is idempotent on a status success shape', () => {
            const raw = {
                check: 'status',
                message: 'status',
                status: VerificationStatusEnum.Success,
            };
            const once = prettifyVerificationItem(raw);
            const twice = prettifyVerificationItem(once);
            expect(twice).toEqual(once);
        });

        it('is idempotent on a failure with humanized details', () => {
            const raw = {
                check: 'expired',
                details: 'Expired 28 FEB 2023',
                status: VerificationStatusEnum.Failed,
            };
            const once = prettifyVerificationItem(raw);
            const twice = prettifyVerificationItem(once);
            expect(twice).toEqual(once);
        });
    });

    describe('batch', () => {
        it('prettifies a full SD-JWT-VC verification result', () => {
            const raw = [
                { check: 'parse', message: 'parse', status: VerificationStatusEnum.Success },
                {
                    check: 'disclosure_hash_integrity',
                    message: 'disclosure_hash_integrity',
                    status: VerificationStatusEnum.Success,
                },
                {
                    check: 'issuer_resolved',
                    message: 'issuer_resolved',
                    status: VerificationStatusEnum.Success,
                },
                {
                    check: 'issuer_signature',
                    message: 'issuer_signature',
                    status: VerificationStatusEnum.Success,
                },
                {
                    check: 'expiration',
                    message: 'expiration',
                    status: VerificationStatusEnum.Success,
                },
            ];
            const result = prettifyVerificationItems(raw);
            expect(result.map(r => r.check)).toEqual([
                'Format',
                'Selective Disclosure',
                'Issuer',
                'Signature',
                'Expiration',
            ]);
            expect(result.every(r => r.message && r.message !== r.check)).toBe(true);
        });
    });

    describe('raw resolver / diagnostic failures (LC-1946)', () => {
        it('maps an in-browser did:web resolution/fetch failure to friendly copy', () => {
            const result = prettifyVerificationItem({
                check:
                    'Unable to filter proofs: Unable to resolve: Error sending HTTP request ' +
                    '(https://participate.community/.well-known/did.json):',
                message:
                    'Unable to filter proofs: Unable to resolve: Error sending HTTP request ' +
                    '(https://participate.community/.well-known/did.json): error sending request: ' +
                    'JsValue(TypeError: Failed to fetch)',
                status: VerificationStatusEnum.Failed,
            });

            expect(result.check).toBe('Issuer');
            expect(result.message).toBe('Could not be reached');
            // Raw diagnostic must not leak through message or details.
            expect(result.message).not.toMatch(/fetch|resolve|http|did\.json/i);
            expect(result.details).toBeUndefined();
        });

        it('maps a bare WASM/stack diagnostic to a generic friendly message', () => {
            const result = prettifyVerificationItem({
                check: 'proof',
                message:
                    'at https://staging.learncard.ai/assets/didkit_wasm.wasm:wasm-function[4263]:0x683',
                status: VerificationStatusEnum.Failed,
            });

            expect(result.check).toBe('Verification');
            expect(result.message).toBe('Could not be verified');
            expect(result.message).not.toMatch(/wasm|assets|0x/i);
        });

        it('is idempotent on a mapped resolution failure', () => {
            const raw = {
                check: 'Unable to resolve',
                message: 'Unable to resolve: Failed to fetch',
                status: VerificationStatusEnum.Failed,
            };
            const once = prettifyVerificationItem(raw);
            const twice = prettifyVerificationItem(once);
            expect(twice).toEqual(once);
            expect(once.message).toBe('Could not be reached');
        });

        it('does not touch a humanized non-resolver failure detail', () => {
            const result = prettifyVerificationItem({
                check: 'status',
                details: 'Status: Revoked',
                status: VerificationStatusEnum.Failed,
            });
            expect(result.details).toBe('Status: Revoked');
            expect(result.check).toBe('status');
        });
    });
});
