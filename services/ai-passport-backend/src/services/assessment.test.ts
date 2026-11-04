import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import type { AiAssessmentQuestionType } from '../ai/generation-schemas';
import type { VC } from '@learncard/types';
import { AiProviderError } from '../ai/errors';
import { CredentialVerificationUnavailableError } from '../credentials/verification';

const subject = 'did:example:synthetic-assessment-owner';
const summary = {
    id: 'synthetic-summary',
    credentialSubject: { id: subject },
} as VC;
const sdk = mock(async () => ({ invoke: { verifyCredential: mock() } }));
const consent = mock(async () => ({}));
const verify = mock(async () => ({
    status: 'valid',
    checks: ['proof'],
    errors: [],
}));
const project = mock(() => ({}));
const search = mock(async () => []);
const questions: AiAssessmentQuestionType[] = [
    {
        id: 1,
        title: 'Synthetic title',
        question: 'Synthetic question',
        type: 'text',
        choices: null,
    },
];
const generate = mock(async () => questions);
mock.module('../learncard', () => ({ getLearnCard: sdk }));
mock.module('../learncard/boost-helpers', () => ({
    createAndPublishBoostCredential: mock(),
}));
const actualPrivacy = await import('../ai/privacy');
mock.module('../ai/privacy', () => ({
    ...actualPrivacy,
    assertCurrentAiConsent: consent,
    getCurrentAiSubject: () => subject,
}));
mock.module('../credentials/verification', () => ({
    verifyCredentialForIngestion: verify,
    fingerprintCredential: () => 'synthetic-fingerprint',
    CredentialVerificationUnavailableError,
}));
mock.module('../credentials/projection', () => ({
    projectCredential: project,
    serializeModelSafeCredentialProjection: () => 'synthetic-projection',
}));
mock.module('./credentialSearch', () => ({ searchCredentialsByTopic: search }));
mock.module('../ai', () => ({ aiCall: generate, streamingAiCall: mock() }));
mock.module('../db', () => ({ db: { getOwnedThreadSummary: mock() } }));
const { generateAiAssessment } = await import('./assessment');

let events: Record<string, unknown>[];
let restore: () => void;
beforeEach(() => {
    for (const fn of [sdk, consent, verify, project, search, generate]) fn.mockClear();
    events = [];
    const info = spyOn(console, 'info').mockImplementation(event => events.push(event));
    const error = spyOn(console, 'error').mockImplementation(event => events.push(event));
    restore = () => {
        info.mockRestore();
        error.mockRestore();
    };
});
afterEach(() => restore());

test('successful generation correlates each stage without credential contents', async () => {
    const attemptId = crypto.randomUUID();
    expect(await generateAiAssessment(subject, summary, attemptId)).toBe(questions);
    expect(
        events.filter(e => e.event === 'ai_assessment_stage_completed').map(e => e.assessmentStage)
    ).toEqual([
        'owner_context',
        'sdk_init',
        'consent',
        'credential_verification',
        'credential_projection',
        'topic_lookup',
        'generation',
    ]);
    expect(new Set(events.map(e => e.diagnosticId)).size).toBe(1);
    expect(events.every(e => e.attemptId === attemptId)).toBe(true);
    expect(events.at(-1)?.event).toBe('ai_assessment_completed');
    expect(JSON.stringify(events)).not.toContain(subject);
    expect(JSON.stringify(events)).not.toContain('synthetic-summary');
    expect(JSON.stringify(events)).not.toContain('Synthetic question');
});

for (const [stage, dependency] of [
    ['sdk_init', sdk],
    ['consent', consent],
    ['credential_verification', verify],
    ['credential_projection', project],
    ['topic_lookup', search],
    ['generation', generate],
] as const) {
    test(`records ${stage} failure and preserves the original error`, async () => {
        const original = new Error('private credential and provider content');
        dependency.mockImplementationOnce(() => {
            throw original;
        });
        await expect(generateAiAssessment(subject, summary)).rejects.toBe(original);
        const failures = events.filter(e => e.event === 'ai_assessment_failed');
        expect(failures).toHaveLength(1);
        expect(failures[0]).toMatchObject({
            assessmentStage: stage,
            failureCode: 'unknown',
            success: false,
        });
        expect(events.some(e => e.event === 'ai_assessment_completed')).toBe(false);
        expect(JSON.stringify(events)).not.toContain(original.message);
        if (stage !== 'generation') expect(generate).not.toHaveBeenCalled();
    });
}

test('verification failure retains safe subreason and never calls the model', async () => {
    verify.mockRejectedValueOnce(
        new CredentialVerificationUnavailableError('unrecognized_verifier_error', 'jsonld_context')
    );
    await expect(generateAiAssessment(subject, summary)).rejects.toThrow();
    expect(events.at(-1)).toMatchObject({
        assessmentStage: 'credential_verification',
        failureCode: 'credential_verification_unavailable',
        verificationSubreason: 'unrecognized_verifier_error',
        verifierErrorKind: 'jsonld_context',
    });
    expect(generate).not.toHaveBeenCalled();
});

test('provider quota is distinguishable from verification failure', async () => {
    const error = new AiProviderError({
        code: 'ai_provider_quota_exhausted',
        provider: 'bedrock',
        retryable: false,
        httpStatus: 429,
    });
    generate.mockRejectedValueOnce(error);
    await expect(generateAiAssessment(subject, summary)).rejects.toBe(error);
    expect(events.at(-1)).toMatchObject({
        assessmentStage: 'generation',
        failureCode: 'ai_provider_quota_exhausted',
    });
});

test('logging failures cannot change a successful assessment', async () => {
    const fail = spyOn(console, 'info').mockImplementation(() => {
        throw new Error('sink unavailable');
    });
    try {
        expect(await generateAiAssessment(subject, summary)).toBe(questions);
    } finally {
        fail.mockRestore();
    }
});
