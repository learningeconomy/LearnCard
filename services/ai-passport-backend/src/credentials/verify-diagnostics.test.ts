import { expect, test } from 'bun:test';
import {
    attachVerifyFailureDiagnostics,
    readVerifyFailureDiagnostics,
    sanitizeCauseFrame,
    sanitizeCauseMessage,
    sanitizeVerifyDiagnosticList,
    sanitizeVerifyDiagnosticText,
    withCauseStep,
} from './verify-diagnostics';

test('maps known verifier messages to codes and drops unknown prose', () => {
    expect(sanitizeVerifyDiagnosticText('Invalid signature')).toBe('invalid_signature');
    expect(
        sanitizeVerifyDiagnosticText('signature error: Verification equation was not satisfied')
    ).toBe('verification_equation_unsatisfied');
    expect(sanitizeVerifyDiagnosticText('Source cleanup busy; retry')).toBe('source_cleanup_busy');
    expect(sanitizeVerifyDiagnosticText('did:example:only')).toBe('unrecognized');
    expect(sanitizeVerifyDiagnosticText('http://insecure.example/x')).toBe('unrecognized');
    expect(sanitizeCauseMessage('source_cleanup_busy')).toBe('source_cleanup_busy');
});

test('caps sanitized lists at five entries and drops empty values', () => {
    expect(
        sanitizeVerifyDiagnosticList([
            'Invalid signature',
            'did:example:drop-me',
            '   ',
            12,
            'Credential is revoked.',
            'second',
            'third',
            'fourth',
            'fifth-should-fit',
            'sixth-should-drop',
        ])
    ).toEqual([
        'invalid_signature',
        'unrecognized',
        'credential_revoked',
        'unrecognized',
        'unrecognized',
    ]);
});

test('attached diagnostics keep mapped verify codes and the outer kind', () => {
    const inner = attachVerifyFailureDiagnostics(new Error('inner'), {
        kind: 'verify_errors',
        checks: ['proof', 'not-a-check', 'credentialStatus'],
        errors: [
            'signature error: Verification equation was not satisfied',
            'issuer did:example:secret',
        ],
        warnings: ['status https://example.com/status/1'],
    });
    const outer = attachVerifyFailureDiagnostics(new Error('all skipped', { cause: inner }), {
        kind: 'all_skipped',
        skipCounts: { unknown: 2, 'did:example:nope': 1, credential_invalid: 0 },
    });
    expect(readVerifyFailureDiagnostics(outer)).toEqual({
        kind: 'all_skipped',
        checks: ['proof', 'credentialStatus'],
        errors: ['verification_equation_unsatisfied', 'unrecognized'],
        warnings: ['unrecognized'],
        skipCounts: { unknown: 2 },
    });
});

test('unknown cause messages become unrecognized instead of redacted prose', () => {
    const long = `did:example:issuer proof failed because ${'the check repeated '.repeat(20)}`;
    expect(sanitizeCauseMessage(long)).toBe('unrecognized');
    expect(sanitizeCauseMessage('Source cleanup busy; retry')).toBe('source_cleanup_busy');
});

test('sanitized cause frames keep only the function name and file basename', () => {
    const error = new Error('hidden did:example:alice');
    error.stack = `Error: hidden did:example:alice
    at settleCredentialBatch (file:///app/src/credentials/batch.ts:40:11)
    at loadSharedContextUris (/app/src/mcp-server/controllers/get-user-context.ts:20:9)`;
    expect(sanitizeCauseFrame(error)).toBe('settleCredentialBatch@batch.ts');
    const nested = new Error('inner');
    nested.stack = `Error: inner
    at Object.anonymous (node:internal/process:1:1)
    at loadSharedContextUris (/tmp/secret/get-user-context.ts:9:3)`;
    expect(sanitizeCauseFrame(nested)).toBe('loadSharedContextUris@get-user-context.ts');
});

test('withCauseStep keeps the innermost step when wrappers catch the same error', async () => {
    const error = await withCauseStep('batch', async () => {
        await withCauseStep('uri_list', async () => {
            throw new Error('listing failed');
        });
    }).catch(caught => caught);
    const { readCauseStep } = await import('./verify-diagnostics');
    expect(readCauseStep(error)).toBe('uri_list');
});
