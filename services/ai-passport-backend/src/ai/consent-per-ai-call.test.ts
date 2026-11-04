import { beforeEach, expect, mock, test } from 'bun:test';

import { AiConsentError } from '../learncard/consent';
import {
    resetConsentSnapshots,
    reuseRequestConsentRead,
    runInAiCallConsentScope,
    runWithLearnCardRequestScope,
} from '../learncard/requestScope';
import { PRIVACY_PII_TYPES, type BedrockGuardrailConfig } from './bedrock-config';

// One AI call masks several texts, and every mask opens its own audit and checks
// consent before and after ApplyGuardrail. Those boundary checks share one read
// per AI call; the next call reads again. Consent is modelled on the real
// request and AI call read caches. The Bedrock SDK and audit storage are fakes.
// Nothing leaves the process.
const DID = 'did:example:learner';
let remoteGranted = true;
let remoteReads = 0;
const readRemote = async () => {
    remoteReads += 1;
    return remoteGranted;
};
const receipt = {
    contractUri: 'lc:contract:synthetic',
    revision: '1',
    credentialUris: [],
    personalFields: [],
};
const assertCurrentAiConsent = mock(
    async (_purpose: string, options: { fresh?: boolean; oncePerAiCall?: boolean } = {}) => {
        const granted = await reuseRequestConsentRead(DID, readRemote, options);
        if (!granted) throw new AiConsentError('consent revoked', 'revoked');
        return receipt;
    }
);

const realPrivacy = await import('./privacy');
mock.module('./privacy', () => ({
    ...realPrivacy,
    assertCurrentAiConsent,
    getCurrentAiSubject: () => DID,
}));

const { assertAuditConsent, createAiAuditBoundary } = await import('./audit');
const { assertGuardrailConsent, createGuardrailMasker } = await import('./bedrock-guardrails');

const config: BedrockGuardrailConfig = {
    region: 'us-east-1',
    guardrailIdentifier: 'privacy123',
    guardrailVersion: '1',
};
const usage = {
    sensitiveInformationPolicyUnits: 1,
    sensitiveInformationPolicyFreeUnits: 0,
};
const policy = () => ({
    blockedInputMessaging: 'Input blocked',
    blockedOutputsMessaging: 'Output blocked',
    guardrailId: config.guardrailIdentifier,
    guardrailArn: `arn:aws:bedrock:us-east-1:123456789012:guardrail/${config.guardrailIdentifier}`,
    version: '1',
    status: 'READY',
    sensitiveInformationPolicy: {
        piiEntities: PRIVACY_PII_TYPES.map(type => ({
            type,
            action: 'ANONYMIZE',
            inputAction: 'ANONYMIZE',
            outputAction: 'ANONYMIZE',
            inputEnabled: true,
            outputEnabled: true,
        })),
    },
});

let onLogging: () => void = () => {};
let onApply: () => void = () => {};
const applyGuardrail = mock(async () => {
    onApply();
    return { action: 'NONE', outputs: [], assessments: [{}], usage };
});
const auditOutcomes: string[] = [];

// The production consent checks, wired the way maskSensitiveText wires them.
const withAudit = createAiAuditBoundary({
    getSubject: () => DID,
    subjectReference: () => 'a'.repeat(64),
    assertConsent: assertAuditConsent,
    persist: async () => {},
    complete: async (_eventId, terminal) => {
        auditOutcomes.push(terminal.outcome);
        return true;
    },
    now: () => new Date(),
    elapsed: () => 0,
    eventId: () => crypto.randomUUID(),
});

const mask = createGuardrailMasker({
    config: () => config,
    locale: () => undefined,
    timeoutMs: 1_000,
    getPolicy: async () => policy(),
    getLogging: async () => {
        onLogging();
        return {};
    },
    apply: applyGuardrail,
    assertConsent: assertGuardrailConsent,
    withAudit: (metadata, operation) => withAudit(metadata, operation),
});

const inRequest = <T>(callback: () => Promise<T>): Promise<T> =>
    runWithLearnCardRequestScope({}, callback);

// One AI call that masks its system prompt, message and one more text, the way
// client.ts masks inputs inside its own audit.
const oneAiCall = () =>
    runInAiCallConsentScope(() =>
        withAudit(
            {
                provider: 'bedrock',
                model: 'synthetic',
                operation: 'structured-output',
                purpose: 'model-inference',
            },
            () =>
                Promise.all([
                    mask('System prompt about fractions.'),
                    mask('Learn fractions in Paris.'),
                    mask('A third synthetic text.'),
                ])
        )
    );

beforeEach(() => {
    resetConsentSnapshots();
    remoteGranted = true;
    remoteReads = 0;
    onLogging = () => {};
    onApply = () => {};
    applyGuardrail.mockClear();
    auditOutcomes.length = 0;
});

test('one AI call with several guardrail passes reads consent exactly once', async () => {
    expect(await inRequest(oneAiCall)).toEqual([
        'System prompt about fractions.',
        'Learn fractions in Paris.',
        'A third synthetic text.',
    ]);
    // One outer audit, three nested audits and six guardrail checks: one read.
    expect(applyGuardrail).toHaveBeenCalledTimes(3);
    expect(auditOutcomes).toEqual(['success', 'success', 'success', 'success']);
    expect(remoteReads).toBe(1);
});

test('a withdrawal between AI calls blocks the next call before ApplyGuardrail', async () => {
    await inRequest(async () => {
        await oneAiCall();
        expect(remoteReads).toBe(1);
        remoteGranted = false;
        await expect(oneAiCall()).rejects.toThrow('consent revoked');
    });
    expect(applyGuardrail).toHaveBeenCalledTimes(3);
    expect(remoteReads).toBe(2);
    expect(auditOutcomes.at(-1)).toBe('denied');
});

test('each AI call reads once, even inside one request', async () => {
    await inRequest(async () => {
        await oneAiCall();
        await oneAiCall();
    });
    expect(applyGuardrail).toHaveBeenCalledTimes(6);
    expect(remoteReads).toBe(2);
});

test("a dispatch check's fresh read becomes the call's read, so later boundaries see a withdrawal", async () => {
    await inRequest(() =>
        runInAiCallConsentScope(async () => {
            await mask('Learn fractions in Paris.');
            expect(remoteReads).toBe(1);
            remoteGranted = false;
            // client.ts's pre-dispatch and publication checks stay fully fresh.
            await expect(
                assertCurrentAiConsent('model-inference', { fresh: true })
            ).rejects.toThrow('consent revoked');
            await expect(mask('Another synthetic text.')).rejects.toThrow('consent revoked');
        })
    );
    expect(applyGuardrail).toHaveBeenCalledTimes(1);
    expect(remoteReads).toBe(2);
});

test('a failed read is not reused within the call', async () => {
    let failNext = true;
    const flaky = async () => {
        remoteReads += 1;
        if (failNext) {
            failNext = false;
            throw new Error('synthetic read failure');
        }
        return true;
    };
    await runInAiCallConsentScope(async () => {
        await expect(
            reuseRequestConsentRead(DID, flaky, { fresh: true, oncePerAiCall: true })
        ).rejects.toThrow('synthetic read failure');
        expect(
            await reuseRequestConsentRead(DID, flaky, {
                fresh: true,
                oncePerAiCall: true,
            })
        ).toBe(true);
    });
    expect(remoteReads).toBe(2);
});

test('outside an AI call the boundary checks still read fresh every time', async () => {
    await inRequest(() => mask('Learn fractions in Paris.'));
    // The audit, before and after ApplyGuardrail.
    expect(remoteReads).toBe(3);
});

test('a withdrawal within the consent snapshot TTL is still blocked by the fresh checks, with no provider call', async () => {
    // The opening/preload's plain read fills the learner's snapshot.
    const plainRead = () =>
        reuseRequestConsentRead(DID, readRemote, {
            snapshot: { contract: 'lc:contract:synthetic', read: readRemote },
        });
    expect(await inRequest(plainRead)).toBe(true);
    expect(remoteReads).toBe(1);
    remoteGranted = false;
    // Within the TTL a later request's plain read is served from the snapshot...
    expect(await inRequest(plainRead)).toBe(true);
    expect(remoteReads).toBe(1);
    // ...but the AI call's audit and guardrail checks read live and stop it.
    const provider = mock(async () => 'completion');
    await expect(
        inRequest(async () => {
            await plainRead();
            return runInAiCallConsentScope(() =>
                withAudit(
                    {
                        provider: 'bedrock',
                        model: 'synthetic',
                        operation: 'structured-output',
                        purpose: 'model-inference',
                    },
                    async () => {
                        await mask('Learn fractions in Paris.');
                        return provider();
                    }
                )
            );
        })
    ).rejects.toThrow('consent revoked');
    expect(remoteReads).toBe(2);
    expect(applyGuardrail).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
    expect(auditOutcomes).toEqual(['denied']);
    // client.ts's pre-dispatch check is fresh too.
    await expect(
        inRequest(() => assertCurrentAiConsent('model-inference', { fresh: true }))
    ).rejects.toThrow('consent revoked');
});
