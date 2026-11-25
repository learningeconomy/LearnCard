import { privacyFailureDetails } from './privacy-diagnostics';
import { describe, expect, test } from 'bun:test';

import { PRIVACY_PII_TYPES, type BedrockGuardrailConfig } from './bedrock-config';
import {
    BedrockPrivacyError,
    createGuardrailMasker,
    MAX_GUARDRAIL_TEXT_LENGTH,
    UnsupportedPrivacyLanguageError,
    validateDeployedGuardrail,
    validateGuardrailResponse,
} from './bedrock-guardrails';

const config: BedrockGuardrailConfig = {
    region: 'us-east-1',
    guardrailIdentifier: 'privacy123',
    guardrailVersion: '1',
};
const blocked = {
    blockedInputMessaging: 'Input blocked',
    blockedOutputsMessaging: 'Output blocked',
};
const usage = {
    sensitiveInformationPolicyUnits: 1,
    sensitiveInformationPolicyFreeUnits: 0,
};
const policy = () => ({
    ...blocked,
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
const none = () => ({ action: 'NONE', outputs: [], assessments: [{}], usage });
const masked = (text: string) => ({
    action: 'GUARDRAIL_INTERVENED',
    outputs: [{ text }],
    usage,
    assessments: [
        {
            sensitiveInformationPolicy: {
                piiEntities: [{ type: 'NAME', action: 'ANONYMIZED', match: 'private-detection' }],
                regexes: [],
            },
        },
    ],
});

const harness = (overrides: Partial<Parameters<typeof createGuardrailMasker>[0]> = {}) => {
    const events: string[] = [];
    const state: {
        response: unknown;
        logging: unknown;
        sdkError?: Error;
        revoked?: boolean;
        hang?: boolean;
        signal?: AbortSignal;
        locale?: string;
    } = { response: none(), logging: {} };
    const mask = createGuardrailMasker({
        config: () => config,
        locale: () => state.locale,
        timeoutMs: 5,
        getPolicy: async () => {
            events.push('policy');
            return policy();
        },
        getLogging: async () => {
            events.push('logging');
            return state.logging;
        },
        apply: async (_config, _text, _source, signal) => {
            events.push('apply');
            state.signal = signal;
            if (state.sdkError) throw state.sdkError;
            if (state.hang) return Promise.withResolvers<never>().promise;
            return state.response;
        },
        assertConsent: async () => {
            events.push('consent');
            if (state.revoked && events.includes('apply')) throw new Error('Consent revoked');
        },
        withAudit: async (_operation, callback) => {
            events.push('intent');
            const result = await callback(value => {
                expect(value).toEqual(usage);
                events.push('usage');
            });
            events.push('completed');
            return result;
        },
        ...overrides,
    });
    return { mask, state, events };
};

describe('managed privacy boundary', () => {
    test('NONE with empty outputs returns input only after live consent recheck and durable audit', async () => {
        const { mask, events } = harness();
        expect(await mask('Learn fractions in Paris at age 12.')).toBe(
            'Learn fractions in Paris at age 12.'
        );
        expect(events).toEqual([
            'intent',
            'policy',
            'logging',
            'consent',
            'apply',
            'consent',
            'usage',
            'completed',
        ]);
    });

    test('anonymization preserves stable identifiers and generic placeholders without reconstructing matches', async () => {
        const input = '{{PERSON_ab12}} meets Jane Doe and {EMAIL}';
        const output = '{{PERSON_ab12}} meets {NAME} and {EMAIL}';
        expect(validateGuardrailResponse(input, masked(output), blocked).text).toBe(output);
        expect(() =>
            validateGuardrailResponse(
                input,
                masked('{{PERSON_ffff}} meets {NAME} and {EMAIL}'),
                blocked
            )
        ).toThrow(BedrockPrivacyError);
        expect(() =>
            validateGuardrailResponse(input, masked('{{PERSON_ab12}} meets {NAME}'), blocked)
        ).toThrow(BedrockPrivacyError);
    });

    test('blocks, mixed block-and-mask, unchanged output, and canned output never become provider input', () => {
        const response = masked('Input blocked');
        expect(() => validateGuardrailResponse('Jane Doe', response, blocked)).toThrow(
            BedrockPrivacyError
        );
        response.outputs[0]!.text = '{NAME}';
        const mixed = {
            ...response,
            assessments: [
                {
                    ...response.assessments[0],
                    topicPolicy: { topics: [{ action: 'BLOCKED' }] },
                },
            ],
        };
        expect(() => validateGuardrailResponse('Jane Doe', mixed, blocked)).toThrow(
            BedrockPrivacyError
        );
        expect(() => validateGuardrailResponse('Jane Doe', masked('Jane Doe'), blocked)).toThrow(
            BedrockPrivacyError
        );
        response.assessments[0]!.sensitiveInformationPolicy.piiEntities[0]!.action = 'BLOCKED';
        expect(() => validateGuardrailResponse('Jane Doe', response, blocked)).toThrow(
            BedrockPrivacyError
        );
    });

    test('rejects missing assessment, fake NONE, truncated coverage, and missing billed PII units', () => {
        for (const invalid of [
            { ...none(), assessments: undefined },
            { ...none(), assessments: [] },
            {
                ...none(),
                assessments: [
                    {
                        sensitiveInformationPolicy: {
                            piiEntities: [
                                { type: 'NAME', action: 'NONE', detected: true },
                                { type: 'ADDRESS', action: 'NONE', detected: true },
                            ],
                        },
                    },
                ],
            },
            { ...masked('{NAME}'), action: 'NONE' },
            { ...none(), outputs: [{ text: 'rewritten content' }] },
            {
                ...none(),
                guardrailCoverage: { textCharacters: { guarded: 2, total: 20 } },
            },
            { ...none(), usage: { ...usage, sensitiveInformationPolicyUnits: -1 } },
        ])
            expect(() => validateGuardrailResponse('Jane Doe', invalid, blocked)).toThrow(
                BedrockPrivacyError
            );
    });

    test('classifies malformed responses with a fixed safe reason', () => {
        let reason: string | undefined;
        try {
            validateGuardrailResponse('Jane Doe', { ...none(), usage: undefined }, blocked);
        } catch (error) {
            if (error instanceof BedrockPrivacyError) reason = error.reason;
        }
        expect(reason).toBe('response-malformed');
    });

    test('strictly verifies the pinned deployed anonymization policy', () => {
        expect(validateDeployedGuardrail(policy(), config)).toEqual(blocked);
        const missing = policy();
        missing.sensitiveInformationPolicy.piiEntities.pop();
        const disabled = policy();
        disabled.sensitiveInformationPolicy.piiEntities[0]!.action = 'NONE';
        const direction = policy();
        Object.assign(direction.sensitiveInformationPolicy.piiEntities[0]!, {
            outputEnabled: false,
        });
        const missingInput = policy();
        Reflect.deleteProperty(
            missingInput.sensitiveInformationPolicy.piiEntities[0]!,
            'inputEnabled'
        );
        const missingOutput = policy();
        Reflect.deleteProperty(
            missingOutput.sensitiveInformationPolicy.piiEntities[0]!,
            'outputEnabled'
        );
        const missingInputAction = policy();
        Reflect.deleteProperty(
            missingInputAction.sensitiveInformationPolicy.piiEntities[0]!,
            'inputAction'
        );
        const missingOutputAction = policy();
        Reflect.deleteProperty(
            missingOutputAction.sensitiveInformationPolicy.piiEntities[0]!,
            'outputAction'
        );
        for (const invalid of [
            missing,
            disabled,
            direction,
            missingInput,
            missingOutput,
            { ...policy(), version: 'DRAFT' },
            { ...policy(), crossRegionDetails: {} },
            missingInputAction,
            missingOutputAction,
        ])
            expect(() => validateDeployedGuardrail(invalid, config)).toThrow(BedrockPrivacyError);
    });

    test('existing invocation logging is rejected before payload, including after a cached policy', async () => {
        const { mask, state, events } = harness();
        await mask('learning content');
        events.length = 0;
        state.logging = { loggingConfig: { textDataDeliveryEnabled: true } };
        await expect(mask('private content')).rejects.toThrow(BedrockPrivacyError);
        expect(events).toEqual(['intent', 'logging']);
    });

    test('revoked consent after the network response withholds the entire result', async () => {
        const { mask, state, events } = harness();
        state.revoked = true;
        await expect(mask('learning content')).rejects.toThrow('Consent revoked');
        expect(events).not.toContain('completed');
        expect(events).not.toContain('usage');
    });

    test('throttling and transport failures discard sensitive SDK messages and causes', async () => {
        const { mask, state } = harness();
        state.sdkError = Object.assign(new Error('secret transcript in SDK error'), {
            name: 'ThrottlingException',
            cause: 'private response',
        });
        try {
            await mask('learning content');
            throw new Error('expected failure');
        } catch (error) {
            expect(error).toBeInstanceOf(BedrockPrivacyError);
            expect((error as Error).message).toBe('Managed privacy processing unavailable');
            expect((error as Error).cause).toBeUndefined();
        }
    });

    test('timeout aborts hung transport without releasing text', async () => {
        const { mask, state } = harness();
        state.hang = true;
        await expect(mask('learning content')).rejects.toMatchObject({
            name: 'TimeoutError',
        });
        expect(state.signal?.aborted).toBe(true);
    });

    test('oversized inputs and unsupported locale never reach AWS', async () => {
        const { mask, state, events } = harness();
        await expect(mask('a'.repeat(MAX_GUARDRAIL_TEXT_LENGTH + 1))).rejects.toThrow(
            BedrockPrivacyError
        );
        state.locale = 'ru-RU';
        await expect(mask('Latin transliteration')).rejects.toThrow(
            UnsupportedPrivacyLanguageError
        );
        expect(events).toEqual([]);
    });
});

test('Unicode text reaches managed privacy processing without local script rejection or stripping', async () => {
    for (const text of [
        'English π radians Δ = α + β',
        'Иван Иванов',
        'דוד',
        'বাংলা',
        'ไทย',
        'José “Learning”—… 👩🏽‍💻',
    ]) {
        let received: string | undefined;
        const { mask, events } = harness({
            apply: async (_config, input) => {
                received = input;
                return none();
            },
        });
        expect(await mask(text)).toBe(text);
        expect(received).toBe(text);
        expect(events).toContain('intent');
        expect(events).toContain('completed');
    }
});

describe('safe managed privacy sub-operation diagnostics', () => {
    for (const [operation, field, name, expected] of [
        ['configuration', 'config', 'BedrockConfigurationError', 'configuration'],
        ['policy_request', 'getPolicy', 'ThrottlingException', 'throttled'],
        ['logging_request', 'getLogging', 'AccessDeniedException', 'access_denied'],
        ['guardrail_request', 'apply', 'ServiceUnavailableException', 'service_unavailable'],
        ['consent_before', 'assertConsent', 'AiConsentError', 'consent_denied'],
        ['audit', 'withAudit', 'AiAuditPersistenceError', 'audit_unavailable'],
    ] as const) {
        test(`identifies ${operation} with fixed category while preserving boundary semantics`, async () => {
            const primary = Object.assign(new Error('private message'), {
                name,
                $metadata: { httpStatusCode: 503 },
            });
            const { mask } = harness({
                [field]: () => {
                    throw primary;
                },
            });
            const error = await mask('synthetic learning content').catch(error => error);
            expect(privacyFailureDetails(error)).toEqual({
                privacyOperation: operation,
                privacyCategory: expected,
                privacyStatus: 503,
            });
            if (['policy_request', 'logging_request', 'guardrail_request'].includes(operation)) {
                expect(error).toBeInstanceOf(BedrockPrivacyError);
                expect(error.message).toBe('Managed privacy processing unavailable');
                expect(error.cause).toBeUndefined();
            } else expect(error).toBe(primary);
        });
    }
    test('distinguishes post-request consent without losing original rejection', async () => {
        let checks = 0;
        const primary = Object.assign(new Error('private'), {
            name: 'AiConsentError',
        });
        const { mask } = harness({
            assertConsent: async () => {
                checks += 1;
                if (checks === 2) throw primary;
            },
        });
        await expect(mask('synthetic learning content')).rejects.toBe(primary);
        expect(privacyFailureDetails(primary)).toEqual({
            privacyOperation: 'consent_after',
            privacyCategory: 'consent_denied',
        });
    });
    test('reports fixed response reason and configuration validation separately', async () => {
        const invalidPolicy = harness({ getPolicy: async () => ({}) });
        const policyError = await invalidPolicy
            .mask('synthetic learning content')
            .catch(error => error);
        expect(privacyFailureDetails(policyError)?.privacyOperation).toBe('policy_validation');
        const invalidLogging = harness({
            getLogging: async () => ({ loggingConfig: {} }),
        });
        const loggingError = await invalidLogging
            .mask('synthetic learning content')
            .catch(error => error);
        expect(privacyFailureDetails(loggingError)).toEqual({
            privacyOperation: 'logging_validation',
            privacyCategory: 'invalid_response',
        });
        const invalidResponse = harness({ apply: async () => ({}) });
        const responseError = await invalidResponse
            .mask('synthetic learning content')
            .catch(error => error);
        expect(privacyFailureDetails(responseError)).toEqual({
            privacyOperation: 'guardrail_response',
            privacyCategory: 'response-malformed',
        });
    });
    test('reports timeout without recording abort reason or raw transport failure', async () => {
        const { mask } = harness({
            apply: async () => Promise.withResolvers<never>().promise,
        });
        const error = await mask('synthetic learning content').catch(error => error);
        expect(error.name).toBe('TimeoutError');
        expect(privacyFailureDetails(error)).toEqual({
            privacyOperation: 'guardrail_request',
            privacyCategory: 'request-timeout',
        });
    });
});
