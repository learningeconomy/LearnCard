import { expect, test } from 'bun:test';
import { ZodError } from 'zod';
import { pickAllowlistedMcpFailureTags, scrubMcpSentryEvent } from './instrument';
import { classifyToolFailure, sanitizeDiagnosticToken, withToolStage } from './tool-failure';

const PRIVATE = 'did:example:private-subject SYNTHETIC_STACK';

const namedError = (name: string, extras: Record<string, unknown> = {}, message = PRIVATE) =>
    Object.assign(new Error(message), { name, ...extras });

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
    });
    expect(
        classifyToolFailure(namedError('AbortError', { cause: namedError('AbortError') }))
    ).toEqual({
        error_name: 'AbortError',
        error_code: 'timeout',
        cause_name: 'AbortError',
        cause_code: 'timeout',
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
    });
    const leaked = namedError('LearnerContextPromptError', {
        code: 'learner_context_unavailable',
        dependency: `did:${PRIVATE}`,
        cause: namedError(`leak ${PRIVATE}`, { message: PRIVATE }),
    });
    expect(JSON.stringify(classifyToolFailure(leaked))).not.toContain('did:example');
    expect(JSON.stringify(classifyToolFailure(leaked))).not.toContain(PRIVATE);
    expect(classifyToolFailure(leaked).cause_dependency).toBeUndefined();
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
});
