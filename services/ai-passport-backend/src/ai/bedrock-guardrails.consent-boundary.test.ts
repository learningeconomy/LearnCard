import { beforeEach, expect, mock, test } from 'bun:test';

import { AiConsentError } from '../learncard/consent';
import { reuseRequestConsentRead, runWithLearnCardRequestScope } from '../learncard/requestScope';
import { PRIVACY_PII_TYPES, type BedrockGuardrailConfig } from './bedrock-config';

// Consent is modelled on the real request-scoped read cache: a non-fresh check
// reuses the request's shared read, a fresh one reads the "remote" contract.
// The Bedrock SDK and audit storage are fakes. Nothing leaves the process.
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
const assertCurrentAiConsent = mock(async (_purpose: string, options: { fresh?: boolean } = {}) => {
    const granted = await reuseRequestConsentRead(DID, readRemote, {
        fresh: options.fresh,
    });
    if (!granted) throw new AiConsentError('consent revoked', 'revoked');
    return receipt;
});

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
    withAudit: createAiAuditBoundary({
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
    }),
});

// The request's first read, as the credential fetch makes it before masking.
const inRequestAfterFetch = <T>(callback: () => Promise<T>): Promise<T> =>
    runWithLearnCardRequestScope({}, async () => {
        await assertCurrentAiConsent('model-inference');
        return callback();
    });

beforeEach(() => {
    remoteGranted = true;
    remoteReads = 0;
    onLogging = () => {};
    onApply = () => {};
    applyGuardrail.mockClear();
    auditOutcomes.length = 0;
});

test("consent revoked after the request's cached read: ApplyGuardrail is never called", async () => {
    await expect(
        inRequestAfterFetch(async () => {
            remoteGranted = false;
            return mask('Learn fractions in Paris.');
        })
    ).rejects.toThrow('consent revoked');
    expect(applyGuardrail).not.toHaveBeenCalled();
    expect(auditOutcomes).toEqual(['denied']);
    expect(remoteReads).toBe(2);
});

test('consent revoked after the audit check: the pre-dispatch check stops ApplyGuardrail', async () => {
    onLogging = () => {
        remoteGranted = false;
    };
    await expect(inRequestAfterFetch(() => mask('Learn fractions in Paris.'))).rejects.toThrow(
        'consent revoked'
    );
    expect(applyGuardrail).not.toHaveBeenCalled();
    expect(auditOutcomes).toEqual(['denied']);
});

test('consent revoked during ApplyGuardrail: the masked text is never returned', async () => {
    onApply = () => {
        remoteGranted = false;
    };
    await expect(inRequestAfterFetch(() => mask('Learn fractions in Paris.'))).rejects.toThrow(
        'consent revoked'
    );
    expect(applyGuardrail).toHaveBeenCalledTimes(1);
    expect(auditOutcomes).toEqual(['denied']);
});

test('granted consent: masking reads fresh at the audit, before and after ApplyGuardrail', async () => {
    expect(await inRequestAfterFetch(() => mask('Learn fractions in Paris.'))).toBe(
        'Learn fractions in Paris.'
    );
    expect(applyGuardrail).toHaveBeenCalledTimes(1);
    expect(auditOutcomes).toEqual(['success']);
    expect(remoteReads).toBe(4);
});
