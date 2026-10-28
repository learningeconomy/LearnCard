import { afterEach, describe, expect, mock, test } from 'bun:test';
import { configureProductionLogging, logSafeEvent } from './logging';

const originalLog = console.log;
const originalInfo = console.info;
let restore: () => void = () => undefined;

afterEach(() => {
    restore();
    restore = () => undefined;
    console.log = originalLog;
    console.info = originalInfo;
});

describe('production logging', () => {
    test('suppresses strings, serialized credentials, errors, nested objects and sensitive keys', () => {
        const output: unknown[][] = [];
        console.log = mock((...data: unknown[]) => output.push(data));
        restore = configureProductionLogging('production');
        const secret = 'Private Learner Medical History';
        const credential = {
            credentialSubject: { name: secret },
            proof: { jws: 'private-proof-token' },
        };
        const error = new Error(secret);
        error.name = secret;
        Object.assign(error, { code: secret });
        let inspected = false;
        const hostile = {
            get event() {
                inspected = true;
                throw error;
            },
        };

        console.log(JSON.stringify(credential));
        console.log(`Processed ${secret}`);
        console.log(error);
        console.log({
            event: secret,
            provider: secret,
            [secret]: credential,
            count: credential,
        });
        console.log(hostile);
        console.log(() => secret, Symbol(secret));
        console.dir(credential);
        console.table([credential]);
        console.trace(secret);
        console.assert(false, error, credential);
        console.time(secret);
        console.timeLog(secret, credential);
        console.timeEnd(secret);

        const captured = JSON.stringify(output);
        expect(captured).not.toContain(secret);
        expect(captured).not.toContain('private-proof-token');
        expect(captured).not.toContain('credentialSubject');
        expect(inspected).toBe(false);
    });

    test('retains issued event codes and safe metrics but rejects lookalikes and extra fields', () => {
        const output: unknown[][] = [];
        console.log = mock((...data: unknown[]) => output.push(data));
        restore = configureProductionLogging('production');
        const metrics = {
            provider: 'openai' as const,
            durationMs: 42,
            count: 3,
            success: false,
            message: 'private summary',
            token: 'private token',
        };
        logSafeEvent('log', 'ai_operation_failed', metrics);
        console.log({ event: 'ai_operation_failed', ...metrics });
        console.log('ai_operation_failed');

        expect(output[0]).toEqual([
            {
                event: 'ai_operation_failed',
                provider: 'openai',
                durationMs: 42,
                count: 3,
                success: false,
            },
        ]);
        expect(output.slice(1)).toEqual([['[redacted]'], ['[redacted]']]);
        expect(JSON.stringify(output)).not.toContain('private');
    });

    test('session diagnostics retain bounded codes without exposing error payloads', () => {
        const output: unknown[][] = [];
        console.log = mock((...data: unknown[]) => output.push(data));
        restore = configureProductionLogging('production');
        const privatePayload = 'Private Learner Medical History';
        logSafeEvent('log', 'ai_session_start_failed', {
            failureCode: 'provider_request_rejected',
            httpStatus: 400,
            ...({
                error: new Error(privatePayload),
                cause: { body: { prompt: privatePayload } },
                requestId: privatePayload,
            } as object),
        });
        logSafeEvent('log', 'ai_session_start_failed', {
            failureCode: privatePayload as 'unknown',
        });
        logSafeEvent('log', 'ai_session_start_failed', {
            failureCode: { toString: () => privatePayload } as unknown as 'unknown',
        });

        expect(output).toEqual([
            [
                {
                    event: 'ai_session_start_failed',
                    failureCode: 'provider_request_rejected',
                    httpStatus: 400,
                },
            ],
            [{ event: 'ai_session_start_failed' }],
            [{ event: 'ai_session_start_failed' }],
        ]);
        expect(JSON.stringify(output)).not.toContain(privatePayload);
    });

    test('reads metric getters once and never forwards invalid scalar values', () => {
        const output: unknown[][] = [];
        console.log = mock((...data: unknown[]) => output.push(data));
        restore = configureProductionLogging('production');
        let successReads = 0;
        logSafeEvent('log', 'ai_operation_failed', {
            durationMs: Number.NaN,
            count: Number.POSITIVE_INFINITY,
            get success() {
                successReads += 1;
                if (successReads > 1) throw new Error('private getter content');
                return true;
            },
        });
        expect(output).toEqual([[{ event: 'ai_operation_failed', success: true }]]);
        expect(successReads).toBe(1);
    });

    test('fatal exceptions and unhandled rejections exit without printing private payloads', () => {
        const loggingUrl = new URL('./logging.ts', import.meta.url).href;
        for (const failure of [
            'queueMicrotask(() => { throw new Error("private-runtime-payload"); });',
            'void Promise.reject(new Error("private-runtime-payload"));',
        ]) {
            const source = `import { configureProductionLogging } from ${JSON.stringify(loggingUrl)};
        configureProductionLogging(); ${failure}`;
            const result = Bun.spawnSync([process.execPath, '--eval', source], {
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    AI_LOCAL_DEBUG_LOGGING: 'false',
                },
            });
            const output = result.stdout.toString() + result.stderr.toString();
            expect(result.exitCode).toBe(1);
            expect(output).toContain('service_runtime_failed');
            expect(output).not.toContain('private-runtime-payload');
        }
    });

    test('raw debug requires explicit opt-in, a local deployment and a nonproduction runtime', () => {
        const loggingUrl = new URL('./logging.ts', import.meta.url).href;
        const source = `import { configureProductionLogging } from ${JSON.stringify(loggingUrl)};
      configureProductionLogging("development"); console.log("local-private-fixture");`;
        const cases = [
            {
                nodeEnv: 'development',
                debug: 'true',
                domain: 'http://localhost:3001',
                origins: 'http://localhost:3000',
                visible: true,
            },
            {
                nodeEnv: 'development',
                debug: 'false',
                domain: 'http://localhost:3001',
                origins: 'http://localhost:3000',
                visible: false,
            },
            {
                nodeEnv: 'development',
                debug: 'true',
                domain: 'https://staging.example.com',
                origins: 'https://staging.example.com',
                visible: false,
            },
            {
                nodeEnv: 'development',
                debug: 'true',
                domain: 'http://localhost:3001',
                origins: 'https://staging.example.com',
                visible: false,
            },
            {
                nodeEnv: 'production',
                debug: 'true',
                domain: 'http://localhost:3001',
                origins: 'http://localhost:3000',
                visible: false,
            },
        ];
        for (const scenario of cases) {
            const result = Bun.spawnSync([process.execPath, '--eval', source], {
                env: {
                    ...process.env,
                    NODE_ENV: scenario.nodeEnv,
                    AI_LOCAL_DEBUG_LOGGING: scenario.debug,
                    DOMAIN: scenario.domain,
                    CORS_ORIGINS: scenario.origins,
                },
            });
            expect(result.exitCode).toBe(0);
            expect(result.stdout.toString().includes('local-private-fixture')).toBe(
                scenario.visible
            );
        }
    });
});

test('resolution diagnostics sink rejects arbitrary fields, codes, labels and operation values', () => {
    const original = console.error;
    const events: any[] = [];
    console.error = event => events.push(event);
    try {
        logSafeEvent('error', 'ai_insight_failed', {
            stage: 'credential_resolution',
            resolutionOperation: 'store_raw',
            errorClass: 'MongoServerError',
            mongoCode: 112,
            mongoLabels: ['TransientTransactionError', 'PRIVATE_SENTINEL' as any],
            rawError: 'PRIVATE_SENTINEL',
        } as any);
        expect(events[0]).toMatchObject({
            resolutionOperation: 'store_raw',
            errorClass: 'MongoServerError',
            mongoCode: 112,
            mongoLabels: ['TransientTransactionError'],
        });
        expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
        logSafeEvent('error', 'ai_insight_failed', {
            stage: 'credential_resolution',
            resolutionOperation: 'PRIVATE_SENTINEL',
            errorClass: 'PRIVATE_SENTINEL',
            mongoCode: 999999999,
            mongoLabels: ['PRIVATE_SENTINEL'],
        } as any);
        expect(events[1]).toEqual({
            event: 'ai_insight_failed',
            stage: 'credential_resolution',
        });
    } finally {
        console.error = original;
    }
});

test('production insight failure logging drops summary text and investigation metadata', () => {
    const output: unknown[][] = [];

    console.log = (...args) => {
        output.push(args);
    };
    restore = configureProductionLogging('production');
    logSafeEvent('log', 'ai_insight_failed', {
        stage: 'generation',
        providerOperation: 'response_validation',
        providerFailureReason: 'response_bounds',
        responseSchema: 'insight_cohort',
        responseBounds: [{ path: 'summary', code: 'too_big', limit: 5000 }],
        summaryExcerpt: 'PRIVATE_SUMMARY_SENTINEL',
    } as never);
    expect(output).toEqual([
        [
            {
                event: 'ai_insight_failed',
                stage: 'generation',
                providerOperation: 'response_validation',
                providerFailureReason: 'response_bounds',
            },
        ],
    ]);
});

test('file processing telemetry keeps only bounded correlated metadata', () => {
    const output: unknown[][] = [];
    console.info = (...args) => {
        output.push(args);
    };
    restore = configureProductionLogging('production');
    const metrics = {
        operationId: '00000000-0000-4000-8000-000000000001',
        attemptId: '00000000-0000-4000-8000-000000000002',
        attempt: 2,
        fileStage: 'complete',
        outcome: 'success',
        sizeBucket: 'under_1mb',
        fileType: 'transcript',
        detectedFileType: 'transcript',
        pipelineVersion: 'file-extraction-v1',
        model: 'us.openai.gpt-6-luna',
        ocrModel: 'tesseract-local',
        count: 1,
        durationMs: 12,
        secret: 'PRIVATE_FILE_TEXT',
        modelName: 'PRIVATE_MODEL',
    };
    logSafeEvent('info', 'file_processing_completed', metrics);
    expect(JSON.stringify(output)).toContain('00000000-0000-4000-8000-000000000001');
    expect(JSON.stringify(output)).toContain('file-extraction-v1');
    expect(JSON.stringify(output)).toContain('us.openai.gpt-6-luna');
    expect(JSON.stringify(output)).toContain('tesseract-local');
    expect(JSON.stringify(output)).not.toContain('PRIVATE');
});

test('file telemetry drops invalid bounds, identifiers and prototype-key enum values', () => {
    const output: unknown[][] = [];
    console.info = (...args) => {
        output.push(args);
    };
    restore = configureProductionLogging('production');
    logSafeEvent('info', 'file_processing_completed', {
        count: 10_001,
        durationMs: 3_600_001,
        httpStatus: 99,
        attempt: 101,
        operationId: 'PRIVATE_SENTINEL',
        attemptId: 'did:example:private',
        fileStage: 'toString',
        outcome: 'constructor',
        fileType: 'PRIVATE_SENTINEL',
        sizeBucket: 'PRIVATE_SENTINEL',
        model: 'PRIVATE_SENTINEL',
        ocrModel: 'PRIVATE_SENTINEL',
    });
    expect(output).toEqual([[{ event: 'file_processing_completed' }]]);
});

test('credential preload and context failures keep only an allowlisted verification subreason', () => {
    const original = console.warn;
    const events: any[] = [];
    console.warn = event => events.push(event);
    try {
        for (const code of ['credential_preload_failed', 'credential_context_failed'] as const) {
            logSafeEvent('warn', code, {
                failureCode: 'credential_verification_unavailable',
                learncardErrorClass: 'Error',
                verificationSubreason: 'sdk_timeout',
                rawError: 'PRIVATE_SENTINEL',
            } as any);
            // Not an allowlisted subreason: dropped, never echoed.
            logSafeEvent('warn', code, {
                failureCode: 'credential_verification_unavailable',
                verificationSubreason: 'PRIVATE_SENTINEL',
            } as any);
            // Only an unavailable verification carries a subreason.
            logSafeEvent('warn', code, {
                failureCode: 'learncard_timeout',
                verificationSubreason: 'sdk_timeout',
            });
        }
        expect(events).toEqual(
            ['credential_preload_failed', 'credential_context_failed'].flatMap(event => [
                {
                    event,
                    failureCode: 'credential_verification_unavailable',
                    learncardErrorClass: 'Error',
                    verificationSubreason: 'sdk_timeout',
                },
                { event, failureCode: 'credential_verification_unavailable' },
                { event, failureCode: 'learncard_timeout' },
            ])
        );
        expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
    } finally {
        console.warn = original;
    }
});

test('LearnCard cause fields keep only their enums and a bounded attempt count', () => {
    const original = console.warn;
    const originalError = console.error;
    const events: any[] = [];
    console.warn = event => events.push(event);
    console.error = event => events.push(event);
    try {
        logSafeEvent('warn', 'credential_context_failed', {
            failureCode: 'learncard_unavailable',
            learncardErrorClass: 'unknown',
            causeKind: 'key_mismatch',
            initAttempts: 2,
        });
        logSafeEvent('error', 'ai_session_start_failed', {
            failureCode: 'learncard_unavailable',
            learncardErrorClass: 'unknown',
            causeKind: 'other',
            initAttempts: 2,
        });
        logSafeEvent('warn', 'credential_preload_failed', {
            failureCode: 'learncard_unavailable',
            causeKind: 'PRIVATE_SENTINEL',
            initAttempts: 1_000,
        } as any);
        expect(events).toEqual([
            {
                event: 'credential_context_failed',
                failureCode: 'learncard_unavailable',
                learncardErrorClass: 'unknown',
                causeKind: 'key_mismatch',
                initAttempts: 2,
            },
            {
                event: 'ai_session_start_failed',
                failureCode: 'learncard_unavailable',
                learncardErrorClass: 'unknown',
                causeKind: 'other',
                initAttempts: 2,
            },
            { event: 'credential_preload_failed', failureCode: 'learncard_unavailable' },
        ]);
    } finally {
        console.warn = original;
        console.error = originalError;
    }
});

describe('credential batch events', () => {
    test('keep only the batch, position, counts and allowlisted codes', () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            logSafeEvent('warn', 'credential_skipped', {
                credentialBatch: 'context',
                index: 3,
                count: 9,
                failureCode: 'credential_verification_unavailable',
                verificationSubreason: 'unrecognized_verifier_error',
                verifierErrorKind: 'undefined_jsonld_term',
                ...({ uri: 'lc:private', did: 'did:example:private' } as object),
            });
            logSafeEvent('warn', 'credential_batch_completed', {
                credentialBatch: 'bogus' as never,
                loadedCount: 1.5,
                skippedCount: 20_000,
                index: -1,
                count: 2,
            });
        } finally {
            console.warn = originalWarn;
        }
        expect(output).toEqual([
            {
                event: 'credential_skipped',
                credentialBatch: 'context',
                index: 3,
                count: 9,
                failureCode: 'credential_verification_unavailable',
                verificationSubreason: 'unrecognized_verifier_error',
                verifierErrorKind: 'undefined_jsonld_term',
            },
            { event: 'credential_batch_completed', count: 2 },
        ]);
    });
});
