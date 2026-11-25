import { afterEach, expect, mock, spyOn, test } from 'bun:test';
import { AiProviderError } from '../ai/errors';
import { LearnCardTimeoutError } from '../learncard/errors';
import {
    AI_INSIGHT_STAGES,
    configureProductionLogging,
    logSafeEvent,
    AI_INSIGHT_TIMINGS,
    VERIFICATION_ORIGINS,
    VERIFICATION_SUBREASONS,
    VERIFIER_ERROR_KINDS,
} from '../logging';
import {
    CredentialVerificationUnavailableError,
    verifyCredentialForIngestion,
    type CredentialConsentReceipt,
} from '../credentials/verification';
import type { VC } from '@learncard/types';
import { runAiInsightDiagnostics, withAiInsightStage, withAiInsightTiming } from './ai-insight';

const originalError = console.error;
const originalInfo = console.info;
let restore = () => {};
afterEach(() => {
    restore();
    restore = () => {};
    console.error = originalError;
    console.info = originalInfo;
});
const capture = (lifecycle = false) => {
    const events: Record<string, unknown>[] = [];
    const collect = (event: Record<string, unknown>) => {
        if (
            lifecycle ||
            ![
                'ai_insight_started',
                'ai_insight_stage_completed',
                'ai_insight_interrupted',
                'ai_insight_resolution_progress',
            ].includes(String(event.event))
        )
            events.push(event);
    };
    console.error = mock(collect);
    console.info = mock(collect);
    restore = configureProductionLogging('production');
    return events;
};

for (const stage of AI_INSIGHT_STAGES.filter(stage => stage !== 'complete')) {
    test(`attributes ${stage} and rethrows the original failure without inspecting payloads`, async () => {
        const events = capture();
        const error = Object.assign(new Error('learner content token=private'), {
            name: 'private DID',
            code: 'private token',
            cause: { credentialSubject: 'private' },
        });
        await expect(
            runAiInsightDiagnostics(() =>
                withAiInsightStage(stage, () => {
                    throw error;
                })
            )
        ).rejects.toBe(error);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            event: 'ai_insight_failed',
            stage,
            failureCode: 'unknown',
            success: false,
        });
        expect(events[0]!.diagnosticId).toMatch(/^[0-9a-f-]{36}$/);
        expect(Object.keys(events[0]!).sort()).toEqual([
            'diagnosticId',
            'event',
            'failureCode',
            'stage',
            'success',
        ]);
        expect(JSON.stringify(events)).not.toContain('private');
        expect(JSON.stringify(events)).not.toContain('learner');
    });
}

test('allowlists classifications and never reads error getters', async () => {
    const events = capture();
    for (const [name, code] of [
        ['AiConsentError', 'consent_denied'],
        ['CredentialVerificationUnavailableError', 'credential_verification_unavailable'],
        ['AiAuditPersistenceError', 'audit_unavailable'],
    ]) {
        const error = new Error('private');
        error.name = name!;
        await runAiInsightDiagnostics(() =>
            withAiInsightStage('request', () => {
                throw error;
            })
        ).catch(() => {});
        expect(events.at(-1)!.failureCode).toBe(code);
    }
    let accessed = false;
    const error = Object.defineProperty(new Error('private'), 'name', {
        get() {
            accessed = true;
            throw new Error('private');
        },
    });
    await runAiInsightDiagnostics(() =>
        withAiInsightStage('privacy_filter', () => {
            throw error;
        })
    ).catch(() => {});
    expect(accessed).toBe(false);
    expect(events.at(-1)!.failureCode).toBe('unknown');
});

test('retains safe provider codes without provider causes', async () => {
    const events = capture();
    const error = new AiProviderError({
        code: 'ai_request_timeout',
        provider: 'openai',
        httpStatus: 504,
        retryable: true,
        cause: { token: 'private' },
    });
    await expect(
        runAiInsightDiagnostics(() =>
            withAiInsightStage('generation', () => {
                throw error;
            })
        )
    ).rejects.toBe(error);
    expect(events[0]!.failureCode).toBe('ai_request_timeout');
    expect(JSON.stringify(events)).not.toContain('private');
});

test('success returns the original result without logging it; other requests remain inert', async () => {
    const events = capture();
    const value = { credentialSubject: 'private learner' };
    expect(await runAiInsightDiagnostics(() => withAiInsightStage('issuance', () => value))).toBe(
        value
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
        event: 'ai_insight_completed',
        stage: 'complete',
        success: true,
    });
    expect(JSON.stringify(events)).not.toContain('private learner');
    await withAiInsightStage('generation', () => {
        throw new Error('private');
    }).catch(() => {});
    expect(events).toHaveLength(1);
});

test('concurrent requests retain independent correlation and nested errors retain the innermost stage', async () => {
    const events = capture();
    await Promise.all(
        ['privacy_filter', 'credential_verification'].map(stage =>
            runAiInsightDiagnostics(() =>
                withAiInsightStage('generation', () =>
                    withAiInsightStage(
                        stage as 'privacy_filter' | 'credential_verification',
                        async () => {
                            await Promise.resolve();
                            throw new Error('private');
                        }
                    )
                )
            ).catch(() => {})
        )
    );
    expect(events).toHaveLength(2);
    expect(new Set(events.map(e => e.diagnosticId)).size).toBe(2);
    expect(events.map(e => e.stage).sort()).toEqual(['credential_verification', 'privacy_filter']);
});

test('sink rejects nonallowlisted stages, arbitrary correlation strings and extra payloads', () => {
    const events = capture();
    logSafeEvent('error', 'ai_insight_failed', {
        stage: 'private learner',
        diagnosticId: 'did:private',
        failureCode: 'private token',
        credential: { private: true },
        verificationOrigin: 'private DID',
        verificationSubreason: 'private error',
    } as never);
    expect(events).toEqual([{ event: 'ai_insight_failed' }]);
});

test('bounds concurrent failures to eight events per request', async () => {
    const events = capture();
    await runAiInsightDiagnostics(() =>
        Promise.all(
            Array.from({ length: 20 }, () =>
                withAiInsightStage('credential_verification', () => {
                    throw new Error('private');
                })
            )
        )
    ).catch(() => {});
    expect(events).toHaveLength(8);
    expect(new Set(events.map(e => e.diagnosticId)).size).toBe(1);
});

test('a failed logging sink preserves successful results and original exceptions', async () => {
    console.error = () => {
        throw new Error('sink failed');
    };
    console.info = () => {
        throw new Error('sink failed');
    };
    const error = new Error('private');
    await expect(
        runAiInsightDiagnostics(() =>
            withAiInsightStage('generation', () => {
                throw error;
            })
        )
    ).rejects.toBe(error);
    expect(await runAiInsightDiagnostics(async () => 42)).toBe(42);
});

const verificationInput = {
    credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        id: 'urn:uuid:00000000-0000-4000-8000-000000000001',
        issuer: 'did:example:private-issuer',
        proof: {
            type: 'Ed25519Signature2020',
            created: '2026-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:private-issuer#key',
        },
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: {
            id: 'did:example:private-learner',
            name: 'private learner',
        },
    } as VC,
    credentialUri: 'https://private.example/credential?token=private',
    subjectDid: 'did:example:private-learner',
    consent: {
        contractUri: 'private:contract',
        receiptId: 'private:receipt',
        status: 'live',
        updatedAt: '2026-01-01T00:00:00Z',
        contractUpdatedAt: '2026-01-01T00:00:00Z',
        categories: [],
        credentialUris: [],
        personalFields: [],
        purpose: 'credential-ingestion',
        revision: 'private-revision',
        guardian: { required: false, approved: false },
    } as CredentialConsentReceipt,
};
// Every subreason the verifier itself can raise. read_empty comes from the
// credential read before verification and is covered in service.test.ts.
const unavailableVerifiers = {
    sdk_timeout: async () => {
        throw new LearnCardTimeoutError();
    },
    sdk_exception: async () => {
        throw new Error('private learner token=private');
    },
    result_schema: async () => ({
        errors: [],
        checks: [],
        warnings: { private: 'payload' },
    }),
    unrecognized_verifier_error: async () => ({
        errors: ['Boost authenticity could not be verified.', 'private credential error'],
        checks: [],
        warnings: [],
    }),
    proof_not_confirmed: async () => ({ errors: [], checks: [], warnings: [] }),
};
test('every verification subreason is covered by a verifier case or the read', () => {
    expect([...Object.keys(unavailableVerifiers), 'read_empty'].toSorted()).toEqual(
        [...VERIFICATION_SUBREASONS].toSorted()
    );
});
for (const verificationOrigin of VERIFICATION_ORIGINS) {
    for (const verificationSubreason of Object.keys(
        unavailableVerifiers
    ) as (keyof typeof unavailableVerifiers)[]) {
        test(`verifier reports ${verificationOrigin}/${verificationSubreason} without retaining private data`, async () => {
            const events = capture();
            const error = await runAiInsightDiagnostics(() =>
                withAiInsightStage('generation', () =>
                    verifyCredentialForIngestion({
                        ...verificationInput,
                        verificationOrigin,
                        verify: unavailableVerifiers[verificationSubreason],
                    })
                )
            ).catch(failure => failure);
            expect(error).toBeInstanceOf(CredentialVerificationUnavailableError);
            expect(error.message).toBe('Credential verification is unavailable');
            expect(error.cause).toBeUndefined();
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                event: 'ai_insight_failed',
                stage: 'credential_verification',
                failureCode: 'credential_verification_unavailable',
                verificationOrigin,
                verificationSubreason,
            });
            expect(JSON.stringify(events)).not.toContain('private');
            expect(JSON.stringify(events)).not.toContain('did:');
            expect(JSON.stringify(error)).not.toContain('private');
        });
    }
}

// Every verifier error kind, so a new kind cannot land without a case here.
const unrecognizedVerifierErrors = {
    boost_authenticity_exception: ['Boost authenticity could not be verified.'],
    did_resolution: ['Error parsing resolution result: private'],
    jsonld_context: ['Remote context loading failed: private'],
    undefined_jsonld_term: [
        'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term or relative IRI: private',
    ],
    status_list: ['Unable to fetch status list credential: private'],
    other: ['private credential error'],
};
test('every verifier error kind is covered', () => {
    expect(Object.keys(unrecognizedVerifierErrors).toSorted()).toEqual(
        [...VERIFIER_ERROR_KINDS].toSorted()
    );
});
for (const [verifierErrorKind, errors] of Object.entries(unrecognizedVerifierErrors))
    test(`verifier reports the ${verifierErrorKind} kind without retaining private data`, async () => {
        const events = capture();
        const error = await runAiInsightDiagnostics(() =>
            withAiInsightStage('generation', () =>
                verifyCredentialForIngestion({
                    ...verificationInput,
                    verify: async () => ({ errors, checks: [], warnings: [] }),
                })
            )
        ).catch(failure => failure);
        expect(error).toBeInstanceOf(CredentialVerificationUnavailableError);
        expect(error.verificationSubreason).toBe('unrecognized_verifier_error');
        expect(error.verifierErrorKind).toBe(verifierErrorKind);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            event: 'ai_insight_failed',
            verificationSubreason: 'unrecognized_verifier_error',
        });
        expect(JSON.stringify(events)).not.toContain('private');
        expect(JSON.stringify(error)).not.toContain('private');
    });

test('parallel verifications preserve explicit origins within and across request contexts', async () => {
    const events = capture();
    const run = () =>
        runAiInsightDiagnostics(() =>
            Promise.all(
                VERIFICATION_ORIGINS.map(verificationOrigin =>
                    verifyCredentialForIngestion({
                        ...verificationInput,
                        verificationOrigin,
                        verify: async () => {
                            await new Promise(resolve =>
                                setTimeout(resolve, verificationOrigin === 'source' ? 5 : 1)
                            );
                            return unavailableVerifiers[
                                verificationOrigin === 'source'
                                    ? 'result_schema'
                                    : 'proof_not_confirmed'
                            ]();
                        },
                    }).catch(error => error)
                )
            )
        );
    await Promise.all([run(), run()]);
    const failures = events.filter(event => event.event === 'ai_insight_failed');
    expect(failures).toHaveLength(4);
    const ids = new Set(failures.map(event => event.diagnosticId));
    expect(ids.size).toBe(2);
    for (const id of ids) {
        expect(
            failures
                .filter(event => event.diagnosticId === id)
                .map(event => [event.verificationOrigin, event.verificationSubreason])
                .sort()
        ).toEqual([
            ['generated', 'proof_not_confirmed'],
            ['source', 'result_schema'],
        ]);
    }
});

test('verifier success and confirmed invalid outcomes remain unchanged and emit no failure', async () => {
    const events = capture();
    for (const verificationOrigin of VERIFICATION_ORIGINS) {
        for (const invalid of [false, true]) {
            const result = await runAiInsightDiagnostics(() =>
                verifyCredentialForIngestion({
                    ...verificationInput,
                    verificationOrigin,
                    verify: async () => ({
                        checks: ['proof'],
                        warnings: [],
                        errors: invalid ? ['Invalid signature'] : [],
                    }),
                })
            );
            expect(result.status).toBe(invalid ? 'invalid' : 'valid');
        }
    }
    expect(events.every(event => event.event === 'ai_insight_completed')).toBe(true);
    expect(JSON.stringify(events)).not.toContain('verificationOrigin');
});

test('subreason accessors and nonallowlisted labels cannot leak through the sink', async () => {
    const events = capture();
    let accessed = false;
    const error = Object.defineProperty(
        new CredentialVerificationUnavailableError(),
        'verificationSubreason',
        {
            get() {
                accessed = true;
                throw new Error('private');
            },
        }
    );
    await expect(
        runAiInsightDiagnostics(() =>
            withAiInsightStage(
                'credential_verification',
                () => {
                    throw error;
                },
                'source'
            )
        )
    ).rejects.toBe(error);
    expect(accessed).toBe(false);
    expect(events[0]).not.toHaveProperty('verificationSubreason');
    logSafeEvent('error', 'ai_insight_failed', {
        stage: 'credential_verification',
        failureCode: 'credential_verification_unavailable',
        verificationOrigin: 'private DID',
        verificationSubreason: 'private payload',
    } as never);
    expect(events[1]).toEqual({
        event: 'ai_insight_failed',
        stage: 'credential_verification',
        failureCode: 'credential_verification_unavailable',
    });
});

test('no eligible inputs use a typed safe diagnostic code, preserving the 422 error', async () => {
    const { NoEligibleInsightInputsError } = await import('../credentials/insight-eligibility');
    const events = capture();
    const error = new NoEligibleInsightInputsError({
        verifiedCount: 0,
        excludedCount: 2,
        exclusions: [{ reason: 'unsupported_cryptosuite', count: 2 }],
    });
    await expect(
        runAiInsightDiagnostics(async () => {
            throw error;
        })
    ).rejects.toBe(error);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
        event: 'ai_insight_failed',
        stage: 'request',
        failureCode: 'no_eligible_insight_inputs',
    });
    expect(events[0]).not.toHaveProperty('coverage');
});

test('resolution operation carries only fixed Mongo metadata and rethrows the original', async () => {
    const { MongoServerError } = await import('mongodb');
    const { withAiInsightResolutionOperation } = await import('./ai-insight');
    const events = capture();
    const error = new MongoServerError({
        message: 'PRIVATE_CREDENTIAL_TOKEN',
        code: 112,
    });
    error.addErrorLabel('TransientTransactionError');
    error.addErrorLabel('PRIVATE_CREDENTIAL_TOKEN');
    await expect(
        runAiInsightDiagnostics(() =>
            withAiInsightResolutionOperation('store_raw', () => {
                throw error;
            })
        )
    ).rejects.toBe(error);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
        stage: 'credential_resolution',
        resolutionOperation: 'store_raw',
        errorClass: 'MongoServerError',
        mongoCode: 112,
        mongoLabels: ['TransientTransactionError'],
    });
    expect(JSON.stringify(events)).not.toContain('PRIVATE_CREDENTIAL_TOKEN');
});

for (const operation of [
    'sdk_init',
    'read',
    'projection',
    'store_verification',
    'store_raw',
] as const) {
    test(`resolution operation ${operation} attributes exact boundary without changing the error`, async () => {
        const { withAiInsightResolutionOperation } = await import('./ai-insight');
        const events = capture();
        const error = new TypeError('PRIVATE_CREDENTIAL_TOKEN');
        await expect(
            runAiInsightDiagnostics(() =>
                withAiInsightResolutionOperation(operation, () => {
                    throw error;
                })
            )
        ).rejects.toBe(error);
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            resolutionOperation: operation,
            errorClass: 'TypeError',
        });
        expect(JSON.stringify(events)).not.toContain('PRIVATE_CREDENTIAL_TOKEN');
    });
}

test('resolution metadata never invokes hostile error getters/methods or forwards unknown numeric codes', async () => {
    const { MongoServerError } = await import('mongodb');
    const { withAiInsightResolutionOperation } = await import('./ai-insight');
    const events = capture();
    let accessed = false;
    const error = new MongoServerError({
        message: 'PRIVATE_CREDENTIAL_TOKEN',
        code: 999999999,
    });
    for (const name of [
        'code',
        'errorLabelSet',
        'hasErrorLabel',
        'errorLabels',
        'name',
        'message',
        'stack',
        'cause',
        'toJSON',
    ])
        Object.defineProperty(error, name, {
            get() {
                accessed = true;
                throw new Error('PRIVATE_CREDENTIAL_TOKEN');
            },
            configurable: true,
        });
    await runAiInsightDiagnostics(() =>
        withAiInsightResolutionOperation('read', () => {
            throw error;
        })
    ).catch(() => {});
    expect(accessed).toBe(false);
    expect(events[0]).toMatchObject({
        errorClass: 'MongoServerError',
        resolutionOperation: 'read',
    });
    expect(events[0]).not.toHaveProperty('mongoCode');
    expect(events[0]).not.toHaveProperty('mongoLabels');
    const unknownCode = new MongoServerError({
        message: 'PRIVATE_CREDENTIAL_TOKEN',
        code: 999999999,
    });
    await runAiInsightDiagnostics(() =>
        withAiInsightResolutionOperation('read', () => {
            throw unknownCode;
        })
    ).catch(() => {});
    expect(events.at(-1)).not.toHaveProperty('mongoCode');
    expect(JSON.stringify(events)).not.toContain('PRIVATE_CREDENTIAL_TOKEN');
});

test('nested consent rejection retains the active queued-storage operation', async () => {
    const { withAiInsightResolutionOperation } = await import('./ai-insight');
    const events = capture();
    const error = Object.assign(new Error('private'), { name: 'AiConsentError' });
    await runAiInsightDiagnostics(() =>
        withAiInsightResolutionOperation('store_verification', () =>
            withAiInsightStage('consent', () => {
                throw error;
            })
        )
    ).catch(() => {});
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
        stage: 'consent',
        failureCode: 'consent_denied',
        resolutionOperation: 'store_verification',
        errorClass: 'AiConsentError',
    });
});

test('emits request start before execution and preserves successful response identity', async () => {
    const events = capture(true);
    const release = Promise.withResolvers<void>();
    const entered = Promise.withResolvers<void>();
    const result = { privateCredential: 'PRIVATE_SENTINEL' };
    const operation = runAiInsightDiagnostics(async () => {
        entered.resolve();
        await release.promise;
        return result;
    });
    await entered.promise;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
        event: 'ai_insight_started',
        stage: 'request',
        elapsedMs: 0,
    });
    release.resolve();
    expect(await operation).toBe(result);
    expect(events.at(-1)).toMatchObject({
        event: 'ai_insight_completed',
        success: true,
    });
    expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
});

test('bounds stage completions and suppresses per-credential progress while retaining aggregate verification timing', async () => {
    const events = capture(true);
    await runAiInsightDiagnostics(async () => {
        await withAiInsightStage('credential_resolution', () =>
            Promise.all(
                Array.from({ length: 196 }, () =>
                    withAiInsightStage('credential_resolution', () =>
                        withAiInsightStage('credential_verification', () =>
                            withAiInsightTiming('verification', async () => 'PRIVATE_SENTINEL')
                        )
                    )
                )
            )
        );
        for (let count = 0; count < 100; count += 1)
            await withAiInsightStage('snapshot', async () => undefined);
    });
    const completed = events.filter(event => event.event === 'ai_insight_stage_completed');
    expect(completed.filter(event => event.stage === 'credential_resolution')).toHaveLength(1);
    expect(completed.filter(event => event.stage === 'credential_verification')).toHaveLength(0);
    expect(completed.filter(event => event.stage === 'snapshot')).toHaveLength(1);
    expect(
        completed.every(
            event => typeof event.durationMs === 'number' && typeof event.elapsedMs === 'number'
        )
    ).toBe(true);
    const totals = events.find(event => event.event === 'ai_insight_resolution_progress')!;
    expect(totals.timings).toMatchObject({
        verification: { count: 196, active: 0 },
    });
    expect(events).toHaveLength(5);
    expect(new Set(events.map(event => event.diagnosticId)).size).toBe(1);
    expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
});

test('periodic resolution snapshots are bounded, show active operations and clean up on settlement', async () => {
    const events = capture(true);
    const timer = { unref: mock(() => undefined) };
    let tick: () => void = () => {};
    const interval = spyOn(globalThis, 'setInterval').mockImplementation(((
        callback: () => void,
        delay: number
    ) => {
        expect(delay).toBe(30_000);
        tick = callback;
        return timer;
    }) as any);
    const clear = spyOn(globalThis, 'clearInterval').mockImplementation(() => undefined);
    const release = Promise.withResolvers<void>(),
        entered = Promise.withResolvers<void>();
    try {
        const operation = runAiInsightDiagnostics(() =>
            withAiInsightStage('credential_resolution', () =>
                withAiInsightTiming('read', async () => {
                    entered.resolve();
                    await release.promise;
                    return 42;
                })
            )
        );
        await entered.promise;
        for (let count = 0; count < 100; count += 1) tick();
        const snapshots = events.filter(event => event.event === 'ai_insight_resolution_progress');
        expect(snapshots).toHaveLength(5);
        expect(snapshots[0]!.timings).toMatchObject({
            read: { active: 1, count: 0 },
        });
        release.resolve();
        expect(await operation).toBe(42);
        expect(
            events.filter(event => event.event === 'ai_insight_resolution_progress')
        ).toHaveLength(6);
        expect(
            events.findLast(event => event.event === 'ai_insight_resolution_progress')!.timings
        ).toMatchObject({ read: { active: 0, count: 1 } });
        expect(clear).toHaveBeenCalledWith(timer);
    } finally {
        release.resolve();
        interval.mockRestore();
        clear.mockRestore();
    }
});

test('concurrent requests keep progress, aggregates and correlation independent', async () => {
    const events = capture(true);
    const release = Promise.withResolvers<void>(),
        entered = Promise.withResolvers<void>();
    const first = runAiInsightDiagnostics(() =>
        withAiInsightStage('generation', async () => {
            entered.resolve();
            await release.promise;
            return 'one';
        })
    );
    await entered.promise;
    const second = await runAiInsightDiagnostics(() =>
        withAiInsightStage('credential_resolution', () =>
            withAiInsightTiming('verification', async () => 'two')
        )
    );
    release.resolve();
    expect(await first).toBe('one');
    expect(second).toBe('two');
    const groups = Map.groupBy(events, event => event.diagnosticId);
    expect(groups.size).toBe(2);
    const groupsArray = [...groups.values()];
    expect(
        groupsArray.every(
            group => group.filter(event => event.event === 'ai_insight_started').length === 1
        )
    ).toBe(true);
    const withTotals = groupsArray.find(group =>
        group.some(event => event.event === 'ai_insight_resolution_progress')
    )!;
    expect(withTotals.some(event => event.stage === 'generation')).toBe(false);
    expect(
        withTotals.find(event => event.event === 'ai_insight_resolution_progress')!.timings
    ).toMatchObject({ verification: { count: 1 } });
});

test('observed request abort does not cancel execution, inspect reason or survive listener cleanup', async () => {
    const events = capture(true);
    const controller = new AbortController();
    const remove = spyOn(controller.signal, 'removeEventListener');
    const release = Promise.withResolvers<void>(),
        entered = Promise.withResolvers<void>();
    let inspected = false;
    const reason = Object.defineProperty({}, 'message', {
        get() {
            inspected = true;
            throw Error('PRIVATE_SENTINEL');
        },
    });
    try {
        const operation = runAiInsightDiagnostics(
            async () => {
                await withAiInsightStage('snapshot', async () => undefined);
                entered.resolve();
                await release.promise;
                return 'original response';
            },
            { signal: controller.signal }
        );
        await entered.promise;
        controller.abort(reason);
        expect(events.filter(event => event.event === 'ai_insight_interrupted')).toHaveLength(1);
        expect(events.find(event => event.event === 'ai_insight_interrupted')).toMatchObject({
            observation: 'request_signal_aborted',
            lastCompletedStage: 'snapshot',
        });
        expect(events.some(event => event.event === 'ai_insight_completed')).toBe(false);
        release.resolve();
        expect(await operation).toBe('original response');
        expect(remove).toHaveBeenCalled();
        expect(inspected).toBe(false);
        expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
    } finally {
        release.resolve();
        remove.mockRestore();
    }
});

test('only observed typed timeout yields timeout observation and preserves the original failure', async () => {
    const events = capture(true);
    const unknown = new Error('timeout claim PRIVATE_SENTINEL');
    await expect(
        runAiInsightDiagnostics(async () => {
            throw unknown;
        })
    ).rejects.toBe(unknown);
    expect(events.some(event => event.event === 'ai_insight_interrupted')).toBe(false);
    const timeout = new AiProviderError({
        code: 'ai_request_timeout',
        provider: 'openai',
        retryable: true,
        httpStatus: 504,
    });
    await expect(
        runAiInsightDiagnostics(() =>
            withAiInsightStage('generation', async () => {
                throw timeout;
            })
        )
    ).rejects.toBe(timeout);
    expect(events.filter(event => event.event === 'ai_insight_interrupted')).toHaveLength(1);
    expect(events.find(event => event.event === 'ai_insight_interrupted')).toMatchObject({
        observation: 'timeout_error',
    });
});

test('already-aborted signal is observed once and diagnostic failures never alter results', async () => {
    const events = capture(true);
    const controller = new AbortController();
    controller.abort('PRIVATE_SENTINEL');
    expect(await runAiInsightDiagnostics(async () => 9, { signal: controller.signal })).toBe(9);
    expect(events.filter(event => event.event === 'ai_insight_interrupted')).toHaveLength(1);
    restore();
    restore = () => {};
    console.info = mock(() => {
        throw Error('logging unavailable');
    });
    expect(
        await runAiInsightDiagnostics(() =>
            withAiInsightStage('snapshot', () => withAiInsightTiming('read', async () => 42))
        )
    ).toBe(42);
});

test('progress sink allows fixed timing fields only and rejects invalid counters/classes', () => {
    const events = capture(true);
    logSafeEvent('info', 'ai_insight_resolution_progress', {
        diagnosticId: '00000000-0000-4000-8000-000000000001',
        stage: 'credential_resolution',
        elapsedMs: 1,
        timings: {
            read: { count: 2, active: 0, durationMs: 5, claims: 'PRIVATE_SENTINEL' },
            verification: { count: -1, active: 0, durationMs: 1 },
            privateUrl: { count: 1, active: 1, durationMs: 1 },
        },
    } as any);
    expect(events[0]!.timings).toEqual({
        read: { count: 2, active: 0, durationMs: 5 },
    });
    expect(
        Object.keys(events[0]!.timings as object).every(name =>
            (AI_INSIGHT_TIMINGS as readonly string[]).includes(name)
        )
    ).toBe(true);
    logSafeEvent('info', 'ai_insight_interrupted', {
        observation: 'PRIVATE_SENTINEL',
        elapsedMs: Infinity,
        lastCompletedStage: 'private stage',
    } as any);
    expect(events[1]).not.toHaveProperty('observation');
    expect(events[1]).not.toHaveProperty('elapsedMs');
    expect(events[1]).not.toHaveProperty('lastCompletedStage');
    expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
});

for (const reason of [
    'resource_limit',
    'unit_too_large',
    'invalid_summary',
    'input_budget',
    'coverage_mismatch',
    'reduction_stalled',
    'cache_metadata_invalid',
] as const) {
    test(`compaction reports only fixed category ${reason} and preserves original failure`, async () => {
        const { InsightCompactionError } = await import('../services/insightCompaction');
        const events = capture();
        const error = Object.assign(new InsightCompactionError(reason), {
            cause: { token: 'PRIVATE_SENTINEL' },
        });
        await expect(
            runAiInsightDiagnostics(() =>
                withAiInsightStage('evidence_compaction', () => {
                    throw error;
                })
            )
        ).rejects.toBe(error);
        expect(events[0]).toMatchObject({
            stage: 'evidence_compaction',
            failureCode: 'insight_compaction_unavailable',
            compactionReason: reason,
        });
        expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
    });
}

for (const reason of [
    'request_failed',
    'missing_tool',
    'invalid_tool',
    'arguments_json',
    'response_bounds',
    'response_shape',
    'response_value',
] as const) {
    test(`generation sink emits only fixed provider category ${reason}`, async () => {
        const { markProviderFailure } = await import('../ai/provider-diagnostics');
        const { normalizeAiProviderError } = await import('../ai/errors');
        const events = capture();
        const original = markProviderFailure(new Error('PRIVATE_SENTINEL'), {
            providerOperation: reason === 'request_failed' ? 'request' : 'response_validation',
            providerFailureReason: reason,
            providerStatus: 400,
        });
        const error = normalizeAiProviderError(original, 'openai');
        await expect(
            runAiInsightDiagnostics(() =>
                withAiInsightStage('generation', () => {
                    throw error;
                })
            )
        ).rejects.toBe(error);
        expect(events[0]).toMatchObject({
            stage: 'generation',
            failureCode: 'ai_unknown_error',
            providerFailureReason: reason,
            providerStatus: 400,
        });
        expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
    });
}
test('provider sink drops arbitrary metadata, status and fields and does not inspect hostile error properties', async () => {
    const { markProviderFailure, withProviderRequest, providerFailureDetails } =
        await import('../ai/provider-diagnostics');
    const events = capture();
    let accessed = false;
    const error = {
        get status() {
            accessed = true;
            throw new Error('PRIVATE_SENTINEL');
        },
    };
    await expect(
        withProviderRequest(async () => {
            throw error;
        })
    ).rejects.toBe(error);
    expect(accessed).toBe(false);
    expect(providerFailureDetails(error)?.providerStatus).toBeUndefined();
    logSafeEvent('error', 'ai_insight_failed', {
        stage: 'generation',
        failureCode: 'ai_unknown_error',
        diagnosticId: '00000000-0000-4000-8000-000000000001',
        providerOperation: 'PRIVATE_SENTINEL',
        providerFailureReason: 'PRIVATE_SENTINEL',
        providerStatus: 999,
    } as never);
    expect(events[0]).not.toHaveProperty('providerOperation');
    expect(events[0]).not.toHaveProperty('providerStatus');
    expect(JSON.stringify(events)).not.toContain('PRIVATE_SENTINEL');
    // WeakMap storage does not mutate frozen provider errors or inspect their payloads.
    const frozen = Object.freeze(new Error('PRIVATE_SENTINEL'));
    expect(
        markProviderFailure(frozen, {
            providerOperation: 'request',
            providerFailureReason: 'request_failed',
        })
    ).toBe(frozen);
});
