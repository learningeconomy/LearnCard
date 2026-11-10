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

test('Sentry rebuild keeps allowlisted tags and drops message, DID, and stack', () => {
    const tags = pickAllowlistedMcpFailureTags({
        tool: 'get_user_context',
        error_name: 'AccessDenied',
        error_code: 'AccessDenied',
        stage: 'llm',
        user: PRIVATE,
        message: PRIVATE,
    });
    expect(tags).toEqual({
        tool: 'get_user_context',
        error_name: 'AccessDenied',
        error_code: 'AccessDenied',
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
            stage: 'consent',
        },
    });
    expect(JSON.stringify(event)).not.toContain(PRIVATE);
    expect(JSON.stringify(event)).not.toContain('did:example');
});
