// Default: offline synthetic transport. --aws: real AWS with ONLY the fixed
// synthetic fixtures below, synthetic consent, and an in-memory audit sink.
// Does not exercise production consent/storage. Never accepts payload arguments.
import { strict as assert } from 'node:assert';

import {
    BedrockClient,
    GetGuardrailCommand,
    GetModelInvocationLoggingConfigurationCommand,
} from '@aws-sdk/client-bedrock';
import { ApplyGuardrailCommand, BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

import {
    BEDROCK_CONTROL_ENDPOINT,
    BEDROCK_MAX_ATTEMPTS,
    BEDROCK_RUNTIME_ENDPOINT,
    getBedrockGuardrailConfig,
    PRIVACY_PII_TYPES,
} from '../src/ai/bedrock-config';
import type { BedrockGuardrailConfig } from '../src/ai/bedrock-config';
import { BedrockPrivacyError, createGuardrailMasker } from '../src/ai/bedrock-guardrails';

const stableToken = '{{PERSON_0123456789abcdef}}';
// Exact expected strings deliberately make detection/over-masking regressions
// fail. These are synthetic acceptance probes, not promises of PII accuracy.
const fixtures = [
    {
        id: 'free-message-latin',
        locale: 'en',
        piiTypes: ['NAME', 'ADDRESS'],
        source: `My name is Jane Doe. ${stableToken} studies algebra at age 14 in Paris.`,
        expected: `My name is {NAME}. ${stableToken} studies algebra at age 14 in {ADDRESS}.`,
    },
    {
        id: 'structured-projection',
        locale: 'en',
        piiTypes: ['EMAIL'],
        source: JSON.stringify([
            `Learner ${stableToken} studies algebra at age 14.`,
            'Contact email is jane.doe@example.org. Course: https://example.org/course',
        ]),
        expected: JSON.stringify([
            `Learner ${stableToken} studies algebra at age 14.`,
            'Contact email is {EMAIL}. Course: https://example.org/course',
        ]),
    },
    {
        id: 'locally-extracted-document',
        locale: 'en',
        piiTypes: ['NAME', 'ADDRESS'],
        source: `Learning report\nLearner: ${stableToken}\nTeacher name: Jane Doe\nCourse: Algebra\nCompleted: 2025-04-12\nLocation: Paris`,
        expected: `Learning report\nLearner: ${stableToken}\nTeacher name: {NAME}\nCourse: Algebra\nCompleted: 2025-04-12\nLocation: {ADDRESS}`,
    },
    {
        id: 'free-message-spanish',
        locale: 'es',
        piiTypes: ['NAME', 'ADDRESS'],
        source: `Me llamo María García. ${stableToken} estudia álgebra en Madrid.`,
        expected: `Me llamo {NAME}. ${stableToken} estudia álgebra en {ADDRESS}.`,
    },
    {
        id: 'free-message-arabic',
        locale: 'ar',
        piiTypes: ['NAME'],
        source: `اسمي أحمد محمد. ${stableToken} يدرس الجبر.`,
        expected: `اسمي {NAME}. ${stableToken} يدرس الجبر.`,
    },
    {
        id: 'free-message-hindi',
        locale: 'hi',
        piiTypes: ['NAME'],
        source: `मेरा नाम राहुल शर्मा है। ${stableToken} बीजगणित पढ़ता है।`,
        expected: `मेरा नाम {NAME} है। ${stableToken} बीजगणित पढ़ता है।`,
    },
    {
        id: 'free-message-chinese',
        locale: 'zh',
        piiTypes: ['NAME'],
        source: `我的名字是张伟。${stableToken}正在学习代数。`,
        expected: `我的名字是{NAME}。${stableToken}正在学习代数。`,
    },
];

const aws = process.argv.slice(2).includes('--aws');
const mode = aws ? 'aws-fixed-synthetic-fixtures' : 'offline-simulated';
let fixtureId = 'configuration';
let startedAt = performance.now();
let billedUnits:
    | {
          sensitiveInformationPolicyUnits: number;
          sensitiveInformationPolicyFreeUnits: number;
      }
    | undefined;
let failureReason: string | undefined;
let stage = 'configuration';
let outputMismatch:
    | {
          unchanged: boolean;
          stableTokenPreserved: boolean;
          sameLengthAsExpected: boolean;
          expectedMasks: Record<string, number>;
          returnedMasks: Record<string, number>;
      }
    | undefined;
type SafeResponseSummary = {
    action: string;
    outputCount: number;
    piiAssessments: {
        type: string;
        action: string;
        detected: boolean | null;
    }[];
    usage?: {
        sensitiveInformationPolicyUnits: number | null;
        sensitiveInformationPolicyFreeUnits: number | null;
    };
};
let responseSummary: SafeResponseSummary | undefined;

const maskCounts = (text: string) => {
    const counts: Record<string, number> = {};
    for (const type of PRIVACY_PII_TYPES) {
        const count = text.split(`{${type}}`).length - 1;
        if (count) counts[type] = count;
    }
    return counts;
};

let failed = false;
let control: BedrockClient | undefined;
let runtime: BedrockRuntimeClient | undefined;

try {
    if (process.argv.slice(2).some(argument => argument !== '--aws'))
        throw new Error('Unsupported option');
    stage = 'mask-setup';
    const config: BedrockGuardrailConfig = aws
        ? getBedrockGuardrailConfig()
        : {
              region: 'us-east-1',
              guardrailIdentifier: 'synthetic123',
              guardrailVersion: '1',
          };
    control = aws
        ? new BedrockClient({
              region: config.region,
              endpoint: BEDROCK_CONTROL_ENDPOINT,
              maxAttempts: BEDROCK_MAX_ATTEMPTS,
          })
        : undefined;
    runtime = aws
        ? new BedrockRuntimeClient({
              region: config.region,
              endpoint: BEDROCK_RUNTIME_ENDPOINT,
              maxAttempts: BEDROCK_MAX_ATTEMPTS,
          })
        : undefined;
    let current = fixtures[0]!;
    let consentChecks = 0;
    let auditState: 'pending' | 'success' | 'failure' | undefined;
    const mask = createGuardrailMasker({
        config: () => config,
        locale: () => current.locale,
        getPolicy: async (_config, signal) => {
            stage = 'policy-request';
            const policy = control
                ? await control.send(
                      new GetGuardrailCommand({
                          guardrailIdentifier: config.guardrailIdentifier,
                          guardrailVersion: config.guardrailVersion,
                      }),
                      { abortSignal: signal }
                  )
                : {
                      guardrailId: config.guardrailIdentifier,
                      guardrailArn: `arn:aws:bedrock:us-east-1:123456789012:guardrail/${config.guardrailIdentifier}`,
                      version: '1',
                      status: 'READY',
                      blockedInputMessaging: 'Blocked',
                      blockedOutputsMessaging: 'Blocked',
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
                  };
            stage = 'policy-validation';
            return policy;
        },
        getLogging: async (_config, signal) => {
            stage = 'logging-request';
            const logging = control
                ? await control.send(new GetModelInvocationLoggingConfigurationCommand({}), {
                      abortSignal: signal,
                  })
                : {};
            stage = 'logging-validation';
            return logging;
        },
        assertConsent: async () => {
            consentChecks += 1;
            stage = consentChecks === 1 ? 'pre-request-consent' : 'post-response-consent';
        },
        apply: async (_config, text, source, signal) => {
            // Even in real mode only this selected static fixture can leave the process.
            stage = 'guardrail-request';
            assert.equal(text, current.source);
            if (runtime) {
                const response = await runtime.send(
                    new ApplyGuardrailCommand({
                        guardrailIdentifier: config.guardrailIdentifier,
                        guardrailVersion: config.guardrailVersion,
                        source,
                        content: [{ text: { text } }],
                        outputScope: 'INTERVENTIONS',
                    }),
                    { abortSignal: signal }
                );
                // Whitelist assessment metadata only; never log AWS PII matches or output text.
                responseSummary = {
                    action: response.action ?? 'missing',
                    outputCount: response.outputs?.length ?? 0,
                    piiAssessments: (response.assessments ?? []).flatMap(assessment =>
                        (assessment.sensitiveInformationPolicy?.piiEntities ?? []).map(
                            ({ type, action, detected }) => ({
                                type: type ?? 'missing',
                                action: action ?? 'missing',
                                detected: detected ?? null,
                            })
                        )
                    ),
                    ...(response.usage
                        ? {
                              usage: {
                                  sensitiveInformationPolicyUnits:
                                      response.usage.sensitiveInformationPolicyUnits ?? null,
                                  sensitiveInformationPolicyFreeUnits:
                                      response.usage.sensitiveInformationPolicyFreeUnits ?? null,
                              },
                          }
                        : {}),
                };
                stage = 'response-received';
                return response;
            }
            stage = 'response-received';
            return {
                action: 'GUARDRAIL_INTERVENED',
                outputs: [{ text: current.expected }],
                assessments: [
                    {
                        sensitiveInformationPolicy: {
                            piiEntities: current.piiTypes.map(type => ({
                                type,
                                action: 'ANONYMIZED',
                            })),
                        },
                    },
                ],
                usage: {
                    sensitiveInformationPolicyUnits: 1,
                    sensitiveInformationPolicyFreeUnits: 0,
                },
            };
        },
        withAudit: async (_operation, callback) => {
            auditState = 'pending';
            try {
                const result = await callback(usage => {
                    billedUnits = usage;
                    stage = 'response-validated';
                });
                auditState = 'success';
                stage = 'audit-complete';
                return result;
            } catch (error) {
                auditState = 'failure';
                if (error instanceof BedrockPrivacyError) {
                    failureReason = error.reason;
                    if (error.reason.startsWith('response-')) stage = 'response-validation';
                }
                throw new Error('Synthetic audited operation failed');
            }
        },
    });
    for (const fixture of fixtures) {
        current = fixture;
        fixtureId = fixture.id;
        consentChecks = 0;
        billedUnits = undefined;
        startedAt = performance.now();
        stage = 'mask';
        outputMismatch = undefined;
        responseSummary = undefined;
        failureReason = undefined;
        const actual = await mask(fixture.source);
        stage = 'consent-count';
        assert.equal(consentChecks, 2);
        stage = 'audit-state';
        assert.equal(auditState, 'success');
        stage = 'usage-check';
        assert.ok(billedUnits);
        stage = 'output-equality';
        if (actual !== fixture.expected) {
            outputMismatch = {
                unchanged: actual === fixture.source,
                stableTokenPreserved: actual.includes(stableToken),
                sameLengthAsExpected: actual.length === fixture.expected.length,
                expectedMasks: maskCounts(fixture.expected),
                returnedMasks: maskCounts(actual),
            };
            console.log(
                JSON.stringify({
                    mode,
                    fixture: fixtureId,
                    outcome: 'failure',
                    durationMs: Math.round(performance.now() - startedAt),
                    stage,
                    outputMismatch,
                    [aws ? 'returnedTextUnits' : 'simulatedTextUnits']: billedUnits,
                })
            );
            failed = true;
            continue;
        }
        console.log(
            JSON.stringify({
                mode,
                fixture: fixtureId,
                outcome: 'success',
                durationMs: Math.round(performance.now() - startedAt),
                [aws ? 'returnedTextUnits' : 'simulatedTextUnits']: billedUnits,
            })
        );
    }
} catch {
    // Never print assertion differences, AWS exceptions, trace assessments, or
    // credentials/config. Failures are intentionally only safe operational data.
    console.log(
        JSON.stringify({
            mode,
            fixture: fixtureId,
            outcome: 'failure',
            durationMs: Math.round(performance.now() - startedAt),
            stage,
            ...(failureReason ? { failureReason } : {}),
            ...(outputMismatch ? { outputMismatch } : {}),
            ...(responseSummary ? { responseSummary } : {}),
            [aws ? 'returnedTextUnits' : 'simulatedTextUnits']: billedUnits,
        })
    );
    failed = true;
} finally {
    // Tear down SDK clients before explicitly exiting this standalone CLI.
    control?.destroy();
    runtime?.destroy();
}
// Bun can retain SDK/HTTP handles after a failed request; exit after cleanup
// rather than letting the GitHub job's 30-minute timeout hide the failure.
process.exit(failed ? 1 : 0);
