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

test('redacts DIDs, URLs, emails, UUIDs, long hex and base64, then truncates', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const hex = 'a'.repeat(40);
    const b64 = `${'A'.repeat(40)}==`;
    expect(
        sanitizeVerifyDiagnosticText(
            `signature error for did:example:issuer at https://status.example/list#1 mailed to user@example.com id ${uuid} ${hex} ${b64}`
        )
    ).toBe('signature error for [did] at [url] mailed to [email] id [uuid] [hex] [b64]');
    expect(sanitizeVerifyDiagnosticText(`did:example:only`)).toBe('[did]');
    expect(sanitizeVerifyDiagnosticText(`http://insecure.example/x`)).toBe('[url]');
    const long = `proof failed because ${'the check repeated '.repeat(12)}`;
    const truncated = sanitizeVerifyDiagnosticText(long);
    expect(truncated?.startsWith('proof failed because ')).toBe(true);
    expect(truncated?.endsWith('...')).toBe(true);
    expect(truncated?.length).toBe(123);
});

test('caps sanitized lists at five entries and drops empty redactions', () => {
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
    ).toEqual(['Invalid signature', '[did]', 'Credential is revoked.', 'second', 'third']);
});

test('attached diagnostics keep sanitized verify strings and the outer kind', () => {
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
        errors: ['signature error: Verification equation was not satisfied', 'issuer [did]'],
        warnings: ['status [url]'],
        skipCounts: { unknown: 2 },
    });
});

test('sanitized cause messages cap at 160 characters and redact identifiers', () => {
    const long = `did:example:issuer proof failed because ${'the check repeated '.repeat(20)}`;
    const sanitized = sanitizeCauseMessage(long);
    expect(sanitized?.includes('[did]')).toBe(true);
    expect(sanitized?.endsWith('...')).toBe(true);
    expect(sanitized?.length).toBe(163);
    expect(sanitized).not.toContain('did:example');
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
