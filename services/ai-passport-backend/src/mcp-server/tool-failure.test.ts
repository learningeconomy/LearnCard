import { expect, test } from 'bun:test';
import { ZodError } from 'zod';
import { pickAllowlistedMcpFailureTags, scrubMcpSentryEvent } from './instrument';
import { attachVerifyFailureDiagnostics } from '../credentials/verify-diagnostics';
import { classifyToolFailure, sanitizeDiagnosticToken, withToolStage } from './tool-failure';

const PRIVATE = 'did:example:private-subject SYNTHETIC_STACK';

const namedError = (name: string, extras: Record<string, unknown> = {}, message = PRIVATE) =>
    Object.assign(new Error(message), {
        name,
        stack: `${name}: ${message}\n    at node:internal/process:1:1`,
        ...extras,
    });
const SANITIZED_PRIVATE = 'unrecognized';

test('classifies allowlisted consent and learner-context codes without reading messages', () => {
    expect(classifyToolFailure(namedError('AiConsentError', { reason: 'revoked' }))).toEqual({
        error_name: 'AiConsentError',
        error_code: 'revoked',
    });
    expect(
        classifyToolFailure(
            namedError('LearnerContextPromptError', { code: 'learner_context_unavailable' })
        )
    ).toEqual({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
    });
    expect(classifyToolFailure(namedError('BedrockConfigurationError'))).toEqual({
        error_name: 'BedrockConfigurationError',
    });
});

test('keeps AWS-style names and Zod paths, never values or raw messages', () => {
    const aws = namedError('AccessDenied', { code: 'AccessDenied' });
    expect(classifyToolFailure(aws)).toEqual({
        error_name: 'AccessDenied',
        error_code: 'AccessDenied',
    });

    const zod = new ZodError([
        {
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            path: ['question'],
            message: PRIVATE,
        } as never,
    ]);
    expect(classifyToolFailure(zod)).toEqual({
        error_name: 'ZodError',
        error_code: 'question',
    });
    expect(JSON.stringify(classifyToolFailure(zod))).not.toContain(PRIVATE);
    expect(JSON.stringify(classifyToolFailure(aws))).not.toContain('did:example');
});

test('records the first stage wrapper and the inner allowlisted cause', async () => {
    const failure = await withToolStage('llm', async () => {
        await withToolStage('consent', async () => {
            throw namedError('AiConsentError', { reason: 'missing' });
        });
    }).catch(error => error);

    expect(classifyToolFailure(failure)).toEqual({
        error_name: 'AiConsentError',
        error_code: 'missing',
        stage: 'consent',
    });
    expect(JSON.stringify(classifyToolFailure(failure))).not.toContain(PRIVATE);
});

test('drops unsafe tokens rather than passing them through', () => {
    expect(sanitizeDiagnosticToken(`AccessDenied ${PRIVATE}`)).toBeUndefined();
    expect(sanitizeDiagnosticToken({ toString: () => PRIVATE })).toBeUndefined();
    expect(classifyToolFailure({ name: `leak ${PRIVATE}`, message: PRIVATE })).toEqual({});
    expect(
        JSON.stringify(classifyToolFailure({ name: `leak ${PRIVATE}`, message: PRIVATE }))
    ).not.toContain('did:example');
});

test('keeps allowlisted cause name and code from a wrapped dependency error', () => {
    const cause = namedError('CredentialVerificationUnavailableError', {
        verificationSubreason: 'read_empty',
    });
    const wrapped = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'verify',
        cause,
    });
    expect(classifyToolFailure(wrapped)).toEqual({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
        cause_name: 'CredentialVerificationUnavailableError',
        cause_code: 'read_empty',
        cause_dependency: 'verify',
        cause_message: SANITIZED_PRIVATE,
    });
    expect(
        classifyToolFailure(namedError('AbortError', { cause: namedError('AbortError') }))
    ).toEqual({
        error_name: 'AbortError',
        error_code: 'timeout',
        cause_name: 'AbortError',
        cause_code: 'timeout',
        cause_message: SANITIZED_PRIVATE,
    });
    const mongo = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'credential_store',
        cause: namedError('MongoServerError', { code: 50 }),
    });
    expect(classifyToolFailure(mongo)).toEqual({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
        cause_name: 'MongoServerError',
        cause_code: '50',
        cause_dependency: 'credential_store',
        cause_message: SANITIZED_PRIVATE,
    });
    const chain = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'wallet',
        cause: namedError('Error', {
            message: PRIVATE,
            cause: namedError('MongoNetworkError', {
                cause: namedError('MongoServerError', { code: 89 }),
            }),
        }),
    });
    expect(classifyToolFailure(chain)).toEqual({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
        cause_name: 'MongoServerError',
        cause_code: '89',
        cause_dependency: 'wallet',
        cause_message: SANITIZED_PRIVATE,
    });
    const leaked = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: `did:${PRIVATE}`,
        cause: namedError(`leak ${PRIVATE}`, { message: PRIVATE }),
    });
    expect(JSON.stringify(classifyToolFailure(leaked))).not.toContain('did:example');
    expect(JSON.stringify(classifyToolFailure(leaked))).not.toContain(PRIVATE);
    expect(classifyToolFailure(leaked).cause_dependency).toBeUndefined();
    expect(classifyToolFailure(leaked)).toMatchObject({
        cause_name: 'Error',
        cause_code: 'unknown',
    });
});

test('a plain Error cause still gets a cause name and code', () => {
    const wrapped = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'verify',
        cause: namedError('Error', { message: PRIVATE }),
    });
    expect(classifyToolFailure(wrapped)).toEqual({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
        cause_name: 'Error',
        cause_code: 'unknown',
        cause_dependency: 'verify',
        cause_message: SANITIZED_PRIVATE,
    });
    expect(JSON.stringify(classifyToolFailure(wrapped))).not.toContain(PRIVATE);
});

test('the all-skipped path carries a cause code and skip counts', () => {
    const first = namedError('Error', { message: PRIVATE });
    const wrapper = namedError('CredentialBatchEmptyError', {
        code: 'all_skipped',
        cause: first,
    });
    attachVerifyFailureDiagnostics(wrapper, {
        kind: 'all_skipped',
        skipCounts: { unknown: 2 },
    });
    const wrapped = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'verify',
        cause: wrapper,
    });
    expect(classifyToolFailure(wrapped)).toEqual({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
        cause_name: 'CredentialBatchEmptyError',
        cause_code: 'all_skipped',
        cause_dependency: 'verify',
        verify_failure_kind: 'all_skipped',
        skip_counts: { unknown: 2 },
        cause_message: SANITIZED_PRIVATE,
    });
    expect(JSON.stringify(classifyToolFailure(wrapped))).not.toContain(PRIVATE);
});

test('the verify-failure path produces a cause code plus sanitized errors', () => {
    const cause = attachVerifyFailureDiagnostics(
        namedError('InvalidCredentialError', { message: PRIVATE, code: 'credential_invalid' }),
        {
            kind: 'verify_errors',
            checks: ['proof', 'not-safe'],
            errors: [
                'signature error: Verification equation was not satisfied',
                'issuer did:example:secret mailed user@example.com see https://status.example/1',
                'id 550e8400-e29b-41d4-a716-446655440000',
            ],
            warnings: ['https://example.com/status'],
        }
    );
    const wrapped = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'verify',
        cause,
    });
    const tags = classifyToolFailure(wrapped);
    expect(tags).toEqual({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
        cause_name: 'InvalidCredentialError',
        cause_code: 'credential_invalid',
        cause_dependency: 'verify',
        verify_failure_kind: 'verify_errors',
        verify_checks: ['proof'],
        verify_errors: ['verification_equation_unsatisfied', 'unrecognized', 'unrecognized'],
        verify_warnings: ['unrecognized'],
        cause_message: SANITIZED_PRIVATE,
    });
    expect(JSON.stringify(tags)).not.toContain('did:example');
    expect(JSON.stringify(tags)).not.toContain(PRIVATE);
    expect(JSON.stringify(tags)).not.toContain('user@example.com');
    expect(JSON.stringify(tags)).not.toContain('https://');
});

test('step labels and a sanitized cause message come through from a wrapped verify error', async () => {
    const { attachCauseStep } = await import('../credentials/verify-diagnostics');
    const cause = attachCauseStep(
        namedError(
            'Error',
            {
                message:
                    'consent snapshot reuse failed for did:example:alice see https://secret.example',
                stack: `Error: consent snapshot reuse failed
    at settleCredentialBatch (file:///app/src/credentials/batch.ts:40:11)
    at loadSharedContextUris (/app/src/mcp-server/controllers/get-user-context.ts:20:9)`,
            },
            'consent snapshot reuse failed for did:example:alice see https://secret.example'
        ),
        'uri_list'
    );
    const wrapped = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'verify',
        cause,
    });
    const tags = classifyToolFailure(wrapped);
    expect(tags).toMatchObject({
        error_name: 'LearnerContextPromptError',
        error_code: 'learner_context_unavailable',
        cause_name: 'Error',
        cause_code: 'unknown',
        cause_dependency: 'verify',
        cause_step: 'uri_list',
        cause_message: 'unrecognized',
        cause_frame: 'settleCredentialBatch@batch.ts',
    });
    expect(JSON.stringify(tags)).not.toContain('did:example');
    expect(JSON.stringify(tags)).not.toContain('https://');
    expect(JSON.stringify(tags)).not.toContain('/app/');
});

test('Sentry keeps the cause step as a tag and the sanitized message in extra', () => {
    const tags = pickAllowlistedMcpFailureTags({
        tool: 'get_user_context',
        cause_step: 'batch',
        leaked: PRIVATE,
    });
    expect(tags).toEqual({
        tool: 'get_user_context',
        cause_step: 'batch',
    });
    const scrubbed = scrubMcpSentryEvent(
        {
            event_id: 'c'.repeat(32),
            message: PRIVATE,
            extra: {
                did: PRIVATE,
                mcpCauseMessage: 'consent snapshot reuse failed for did:example:alice',
                mcpCauseFrame: 'settleCredentialBatch@batch.ts',
            },
            tags: {
                tool: 'get_user_context',
                cause_step: 'uri_list',
                leaked: PRIVATE,
            },
        } as never,
        { attachments: [] }
    );
    expect(scrubbed.tags).toEqual({
        tool: 'get_user_context',
        cause_step: 'uri_list',
    });
    expect(scrubbed.extra).toEqual({
        mcpCauseMessage: 'unrecognized',
        mcpCauseFrame: 'settleCredentialBatch@batch.ts',
    });
    expect(JSON.stringify(scrubbed)).not.toContain(PRIVATE);
    expect(JSON.stringify(scrubbed)).not.toContain('did:example');
});

test('Sentry rebuild keeps allowlisted tags and drops message, DID, and stack', () => {
    const tags = pickAllowlistedMcpFailureTags({
        tool: 'get_user_context',
        error_name: 'AccessDenied',
        error_code: 'AccessDenied',
        cause_name: 'CredentialVerificationUnavailableError',
        cause_code: 'read_empty',
        cause_dependency: 'credential_store',
        stage: 'llm',
        user: PRIVATE,
        message: PRIVATE,
        leaked_dependency: 'did:example:nope',
    });
    expect(tags).toEqual({
        tool: 'get_user_context',
        error_name: 'AccessDenied',
        error_code: 'AccessDenied',
        cause_name: 'CredentialVerificationUnavailableError',
        cause_code: 'read_empty',
        cause_dependency: 'credential_store',
        stage: 'llm',
    });

    const event = scrubMcpSentryEvent(
        {
            event_id: 'a'.repeat(32),
            message: PRIVATE,
            extra: { did: PRIVATE },
            user: { id: PRIVATE },
            exception: {
                values: [{ value: PRIVATE, stacktrace: { frames: [{ filename: PRIVATE }] } }],
            },
            tags: {
                tool: 'get_answer_about_user',
                error_name: 'AiConsentError',
                error_code: 'guardian_required',
                cause_name: 'MongoServerError',
                cause_code: '50',
                cause_dependency: 'wallet',
                stage: 'consent',
                leaked: PRIVATE,
            },
        } as never,
        { attachments: [{ filename: PRIVATE, data: PRIVATE }] }
    );

    expect(event).toEqual({
        type: undefined,
        event_id: 'a'.repeat(32),
        level: 'error',
        platform: 'node',
        message: 'backend_operation_failed',
        tags: {
            tool: 'get_answer_about_user',
            error_name: 'AiConsentError',
            error_code: 'guardian_required',
            cause_name: 'MongoServerError',
            cause_code: '50',
            cause_dependency: 'wallet',
            stage: 'consent',
        },
    });
    expect(JSON.stringify(event)).not.toContain(PRIVATE);
    expect(JSON.stringify(event)).not.toContain('did:example');

    const scrubbed = scrubMcpSentryEvent(
        {
            event_id: 'b'.repeat(32),
            message: PRIVATE,
            extra: {
                did: PRIVATE,
                mcpVerifyErrors: [
                    'signature error: Verification equation was not satisfied',
                    'issuer did:example:secret',
                ],
                mcpVerifyChecks: ['proof', 'nope'],
            },
            tags: {
                tool: 'get_user_context',
                verify_failure_kind: 'verify_errors',
                leaked: PRIVATE,
            },
        } as never,
        { attachments: [] }
    );
    expect(scrubbed.tags).toEqual({
        tool: 'get_user_context',
        verify_failure_kind: 'verify_errors',
    });
    expect(scrubbed.extra).toEqual({
        mcpVerifyErrors: ['verification_equation_unsatisfied', 'unrecognized'],
        mcpVerifyChecks: ['proof'],
    });
    expect(JSON.stringify(scrubbed)).not.toContain(PRIVATE);
    expect(JSON.stringify(scrubbed)).not.toContain('did:example');
});

test('Sentry and classified failures drop names, phones, secrets and credential prose', () => {
    const leaked =
        'Invalid credential for Alice Smith; phone 202-555-0123; student ID stu_12345; token secret-short-token; mailed user@example.com did:example:alice Completed Algebra at Lincoln High';
    const cause = attachVerifyFailureDiagnostics(
        namedError(
            'InvalidCredentialError',
            { message: leaked, code: 'credential_invalid' },
            leaked
        ),
        {
            kind: 'verify_errors',
            checks: ['proof'],
            errors: [leaked, 'Invalid signature'],
            warnings: [leaked],
        }
    );
    const wrapped = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: 'verify',
        cause,
    });
    const tags = classifyToolFailure(wrapped);
    expect(tags.cause_message).toBe('unrecognized');
    expect(tags.verify_errors).toEqual(['unrecognized', 'invalid_signature']);
    expect(tags.verify_warnings).toEqual(['unrecognized']);
    const payload = JSON.stringify(tags);
    expect(payload).not.toContain('Alice Smith');
    expect(payload).not.toContain('202-555-0123');
    expect(payload).not.toContain('stu_12345');
    expect(payload).not.toContain('secret-short-token');
    expect(payload).not.toContain('user@example.com');
    expect(payload).not.toContain('did:example');
    expect(payload).not.toContain('Lincoln High');

    const scrubbed = scrubMcpSentryEvent(
        {
            event_id: 'd'.repeat(32),
            message: leaked,
            extra: {
                mcpCauseMessage: leaked,
                mcpVerifyErrors: [leaked, 'Source cleanup busy; retry'],
                mcpVerifyWarnings: [leaked],
                mcpCauseFrame: 'withSourceCleanupLease@index.ts',
            },
            tags: {
                tool: 'get_user_context',
                error_name: 'LearnerContextPromptError',
                leaked,
            },
        } as never,
        { attachments: [] }
    );
    const sentry = JSON.stringify(scrubbed);
    expect(scrubbed.extra).toEqual({
        mcpCauseMessage: 'unrecognized',
        mcpVerifyErrors: ['unrecognized', 'source_cleanup_busy'],
        mcpVerifyWarnings: ['unrecognized'],
        mcpCauseFrame: 'withSourceCleanupLease@index.ts',
    });
    expect(sentry).not.toContain('Alice Smith');
    expect(sentry).not.toContain('202-555-0123');
    expect(sentry).not.toContain('stu_12345');
    expect(sentry).not.toContain('secret-short-token');
    expect(sentry).not.toContain('user@example.com');
    expect(sentry).not.toContain('did:example');
    expect(sentry).not.toContain('Lincoln High');
});
