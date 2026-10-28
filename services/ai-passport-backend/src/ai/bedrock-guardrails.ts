import { markPrivacyRequestTimeout, privacyRequestCaller } from './embedding-privacy-recovery';
import { assertPrivacyLocale } from './privacy-language';
import {
    markPrivacyFailure,
    privacyFailureDetails,
    withPrivacyOperation,
} from './privacy-diagnostics';
import {
    BedrockClient,
    GetGuardrailCommand,
    GetModelInvocationLoggingConfigurationCommand,
} from '@aws-sdk/client-bedrock';
import { ApplyGuardrailCommand, BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { z } from 'zod';

import { withAiAudit } from './audit';
import {
    BEDROCK_CONTROL_ENDPOINT,
    BEDROCK_MAX_ATTEMPTS,
    BEDROCK_RUNTIME_ENDPOINT,
    BEDROCK_TIMEOUT_MS,
    getBedrockGuardrailConfig,
    PRIVACY_PII_TYPES,
    type BedrockGuardrailConfig,
} from './bedrock-config';
import { getBedrockAuth, getBedrockSdkAuthConfig } from './bedrock-auth';
import {
    isPrivacyGuardrailBypassEnabled,
    writePrivacyGuardrailBypassRequestWarning,
} from './privacy-guardrail-bypass';
import { getCurrentLocale } from './locale';
import { assertCurrentAiConsent } from './privacy';
import { getCurrentOwnerOperation } from '../services/dataErasure';
import { recordUsageRequest, reserveProviderRequest, usageField } from './usage-meter';

// Conservative application bound below the us-east-1 PII quota. Never split
// across entity/context boundaries or silently pass an unprocessed suffix.
export const MAX_GUARDRAIL_TEXT_LENGTH = 100_000;
const stableTokens = /\{\{[A-Z][A-Z_]*_[a-f0-9]+\}\}/g;
const genericTokens = /(?<!\{)\{[A-Z][A-Z_]*\}(?!\})/g;

export type BedrockPrivacyFailureReason =
    | 'request-timeout'
    | 'unavailable'
    | 'response-malformed'
    | 'response-incomplete-coverage'
    | 'response-inconsistent-assessment'
    | 'response-invalid-none'
    | 'response-invalid-intervention'
    | 'response-stable-token-mismatch'
    | 'response-placeholder-loss'
    | 'response-missing-anonymization-mask';

export class BedrockPrivacyError extends Error {
    readonly reason: BedrockPrivacyFailureReason;

    constructor(
        timeout = false,
        reason: BedrockPrivacyFailureReason = timeout ? 'request-timeout' : 'unavailable'
    ) {
        super(
            timeout ? 'Managed privacy request timed out' : 'Managed privacy processing unavailable'
        );
        this.name = timeout ? 'TimeoutError' : 'BedrockPrivacyError';
        this.reason = reason;
    }
}

export { UnsupportedPrivacyLanguageError } from './privacy-language';
export const assertGuardrailLocale = (locale = getCurrentLocale()) => assertPrivacyLocale(locale);

const piiConfiguration = z.object({
    type: z.enum(PRIVACY_PII_TYPES),
    action: z.literal('ANONYMIZE'),
    inputAction: z.literal('ANONYMIZE'),
    outputAction: z.literal('ANONYMIZE'),
    inputEnabled: z.literal(true),
    outputEnabled: z.literal(true),
});
const deployedPolicy = z.object({
    guardrailId: z.string(),
    guardrailArn: z.string(),
    version: z.string(),
    status: z.literal('READY'),
    blockedInputMessaging: z.string().min(1),
    blockedOutputsMessaging: z.string().min(1),
    sensitiveInformationPolicy: z.object({
        piiEntities: z.array(piiConfiguration).length(PRIVACY_PII_TYPES.length),
        regexes: z.array(z.never()).optional(),
    }),
    crossRegionDetails: z.never().optional(),
    contentPolicy: z.never().optional(),
    topicPolicy: z.never().optional(),
    wordPolicy: z.never().optional(),
    contextualGroundingPolicy: z.never().optional(),
    automatedReasoningPolicy: z.never().optional(),
});

export const validateDeployedGuardrail = (raw: unknown, config: BedrockGuardrailConfig) => {
    const parsed = deployedPolicy.safeParse(raw);
    if (!parsed.success) throw new BedrockPrivacyError();
    const policy = parsed.data;
    if (
        policy.version !== config.guardrailVersion ||
        !/^arn:aws:bedrock:us-east-1:[0-9]{12}:guardrail\/[a-z0-9]+$/.test(policy.guardrailArn) ||
        !policy.guardrailArn.endsWith(`/${policy.guardrailId}`) ||
        ![policy.guardrailId, policy.guardrailArn].includes(config.guardrailIdentifier) ||
        new Set(policy.sensitiveInformationPolicy.piiEntities.map(({ type }) => type)).size !==
            PRIVACY_PII_TYPES.length
    )
        throw new BedrockPrivacyError();
    return {
        blockedInputMessaging: policy.blockedInputMessaging,
        blockedOutputsMessaging: policy.blockedOutputsMessaging,
    };
};

type BlockMessages = {
    blockedInputMessaging: string;
    blockedOutputsMessaging: string;
};
const entityAssessment = z.object({
    type: z.enum(PRIVACY_PII_TYPES),
    action: z.enum(['NONE', 'ANONYMIZED']),
    detected: z.boolean().optional(),
    // Deliberately never read, copy, log, or reconstruct from the match field.
});
const responseSchema = z.object({
    action: z.enum(['NONE', 'GUARDRAIL_INTERVENED']),
    outputs: z.array(z.object({ text: z.string() }).strict()).max(1),
    assessments: z
        .array(
            z
                .object({
                    sensitiveInformationPolicy: z
                        .object({
                            piiEntities: z.array(entityAssessment).optional(),
                            regexes: z.array(z.never()).optional(),
                        })
                        .strict()
                        .optional(),
                    // Metrics and deployment details are not content and aren't persisted.
                    invocationMetrics: z.unknown().optional(),
                    appliedGuardrailDetails: z.unknown().optional(),
                })
                .strict()
        )
        .min(1),
    usage: z.object({
        sensitiveInformationPolicyUnits: z.number().int().nonnegative(),
        sensitiveInformationPolicyFreeUnits: z.number().int().nonnegative(),
    }),
    guardrailCoverage: z
        .object({
            textCharacters: z.object({
                guarded: z.number().int().positive(),
                total: z.number().int().positive(),
            }),
        })
        .optional(),
});

const countTokens = (text: string, pattern: RegExp) => {
    const counts = new Map<string, number>();
    for (const match of text.matchAll(pattern))
        counts.set(match[0], (counts.get(match[0]) ?? 0) + 1);
    return counts;
};

export const validateGuardrailResponse = (text: string, raw: unknown, blocked: BlockMessages) => {
    const parsed = responseSchema.safeParse(raw);
    if (!parsed.success) throw new BedrockPrivacyError(false, 'response-malformed');
    const response = parsed.data;
    const coverage = response.guardrailCoverage?.textCharacters;
    if (coverage && coverage.guarded !== coverage.total)
        throw new BedrockPrivacyError(false, 'response-incomplete-coverage');
    const entities = response.assessments.flatMap(
        assessment => assessment.sensitiveInformationPolicy?.piiEntities ?? []
    );
    if (
        entities.some(
            entity =>
                (entity.action === 'NONE' && entity.detected !== false) ||
                (entity.action === 'ANONYMIZED' && entity.detected === false)
        )
    )
        throw new BedrockPrivacyError(false, 'response-inconsistent-assessment');
    const anonymized = entities.filter(entity => entity.action === 'ANONYMIZED');
    if (response.action === 'NONE') {
        if (anonymized.length || (response.outputs.length && response.outputs[0]?.text !== text))
            throw new BedrockPrivacyError(false, 'response-invalid-none');
        // AWS correctly returns outputs=[] when there was no intervention.
        return { text, usage: response.usage };
    }
    const output = response.outputs[0]?.text;
    if (
        !anonymized.length ||
        !output ||
        output === text ||
        output === blocked.blockedInputMessaging ||
        output === blocked.blockedOutputsMessaging
    )
        throw new BedrockPrivacyError(false, 'response-invalid-intervention');
    const originalStable = [...text.matchAll(stableTokens)].map(([token]) => token);
    const maskedStable = [...output.matchAll(stableTokens)].map(([token]) => token);
    if (
        originalStable.length !== maskedStable.length ||
        originalStable.some((token, i) => token !== maskedStable[i])
    )
        throw new BedrockPrivacyError(false, 'response-stable-token-mismatch');
    const before = countTokens(text, genericTokens);
    const after = countTokens(output, genericTokens);
    for (const [token, count] of before)
        if ((after.get(token) ?? 0) < count)
            throw new BedrockPrivacyError(false, 'response-placeholder-loss');
    // Each reported kind must introduce a mask; a canned message plus a PII
    // assessment is not an anonymized response. No matching PII is inspected.
    for (const { type } of anonymized) {
        const token = `{${type}}`;
        if ((after.get(token) ?? 0) <= (before.get(token) ?? 0))
            throw new BedrockPrivacyError(false, 'response-missing-anonymization-mask');
    }
    return { text: output, usage: response.usage };
};

type GuardrailDependencies = {
    config: () => BedrockGuardrailConfig;
    locale: () => string | undefined;
    getPolicy: (config: BedrockGuardrailConfig, signal: AbortSignal) => Promise<unknown>;
    getLogging: (config: BedrockGuardrailConfig, signal: AbortSignal) => Promise<unknown>;
    apply: (
        config: BedrockGuardrailConfig,
        text: string,
        source: 'INPUT' | 'OUTPUT',
        signal: AbortSignal
    ) => Promise<unknown>;
    assertConsent: () => Promise<unknown>;
    withAudit: typeof withAiAudit;
    timeoutMs?: number;
    /** Local-dev DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL; re-checks its guards and throws outside local dev. */
    bypass?: () => boolean;
    warnBypass?: (source: 'INPUT' | 'OUTPUT') => void;
};

// Race in addition to abort: a stalled transport must never retain the caller
// indefinitely. Neither SDK error messages nor causes cross this boundary.
const boundedRequest = async <Result>(
    call: (signal: AbortSignal) => Promise<Result>,
    timeoutMs: number,
    operation: Parameters<typeof markPrivacyFailure>[1]
) => {
    const controller = new AbortController();
    const ownerSignal = getCurrentOwnerOperation()?.signal;
    const callerSignal = privacyRequestCaller();
    const signal = AbortSignal.any([
        controller.signal,
        ...(ownerSignal ? [ownerSignal] : []),
        ...(callerSignal ? [callerSignal] : []),
    ]);
    const deadline = Promise.withResolvers<never>();
    const onAbort = () => deadline.reject(new BedrockPrivacyError(controller.signal.aborted));
    signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => {
        controller.abort();
        deadline.reject(new BedrockPrivacyError(true));
    }, timeoutMs);
    try {
        signal.throwIfAborted();
        return await Promise.race([call(signal), deadline.promise]);
    } catch (error) {
        const failure = markPrivacyFailure(
            new BedrockPrivacyError(controller.signal.aborted),
            operation,
            error,
            controller.signal.aborted ? 'timeout' : undefined
        );
        const diagnostic = privacyFailureDetails(failure);
        // Both the local request timer and a known SDK TimeoutError can expire.
        // Caller/owner aborts and explicit non-timeout HTTP failures never authorize replay.
        const requestTimedOut =
            controller.signal.aborted || diagnostic?.privacyCategory === 'timeout';
        const timeoutStatus =
            diagnostic?.privacyStatus === undefined ||
            [408, 504].includes(diagnostic.privacyStatus);
        if (
            operation === 'guardrail_request' &&
            requestTimedOut &&
            timeoutStatus &&
            !ownerSignal?.aborted &&
            !callerSignal?.aborted
        )
            markPrivacyRequestTimeout(failure);
        throw failure;
    } finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
    }
};

export const createGuardrailMasker = (dependencies: GuardrailDependencies) => {
    let verified: { key: string; messages: BlockMessages } | undefined;
    return async (text: string, source: 'INPUT' | 'OUTPUT' = 'INPUT'): Promise<string> => {
        if (
            typeof text !== 'string' ||
            text.length > MAX_GUARDRAIL_TEXT_LENGTH ||
            !['INPUT', 'OUTPUT'].includes(source)
        )
            throw new BedrockPrivacyError();
        await withPrivacyOperation('language', () => assertGuardrailLocale(dependencies.locale()));
        if (await withPrivacyOperation('configuration', () => dependencies.bypass?.() ?? false)) {
            // Skip only the Bedrock calls; consent and the audit record still happen,
            // marked bypassed with no egress instead of claiming Bedrock saw the text.
            dependencies.warnBypass?.(source);
            if (!text.length) return text;
            return withPrivacyOperation('audit', () =>
                dependencies.withAudit(
                    {
                        provider: 'bedrock',
                        model: 'guardrail:bypassed',
                        operation: 'guardrail',
                        purpose: 'model-inference',
                        guardrail: 'bypassed',
                    },
                    async () => {
                        await withPrivacyOperation('consent_before', dependencies.assertConsent);
                        return text;
                    }
                )
            );
        }
        const config = await withPrivacyOperation('configuration', dependencies.config);
        if (!text.length) return text;
        const timeout = dependencies.timeoutMs ?? BEDROCK_TIMEOUT_MS;
        return withPrivacyOperation('audit', () =>
            dependencies.withAudit(
                {
                    provider: 'bedrock',
                    model: `guardrail:${config.guardrailIdentifier.split('/').at(-1)}:${config.guardrailVersion}`,
                    operation: 'guardrail',
                    purpose: 'model-inference',
                },
                async recordUsage => {
                    const key = `${config.guardrailIdentifier}:${config.guardrailVersion}`;
                    if (verified?.key !== key) {
                        const raw = await boundedRequest(
                            signal => dependencies.getPolicy(config, signal),
                            timeout,
                            'policy_request'
                        );
                        verified = {
                            key,
                            messages: await withPrivacyOperation('policy_validation', () =>
                                validateDeployedGuardrail(raw, config)
                            ),
                        };
                    }
                    const messages = verified.messages;
                    // Account logging is mutable, unlike the pinned policy: check every call.
                    const logging = await boundedRequest(
                        signal => dependencies.getLogging(config, signal),
                        timeout,
                        'logging_request'
                    );
                    if (
                        !z.object({ loggingConfig: z.never().optional() }).safeParse(logging)
                            .success
                    )
                        throw markPrivacyFailure(
                            new BedrockPrivacyError(),
                            'logging_validation',
                            undefined,
                            'invalid_response'
                        );
                    await withPrivacyOperation('consent_before', dependencies.assertConsent);
                    const raw = await boundedRequest(
                        async signal => {
                            await reserveProviderRequest('privacy');
                            signal.throwIfAborted();
                            const recordMeterUsage = recordUsageRequest('privacy');
                            const response = await dependencies.apply(config, text, source, signal);
                            const usage = usageField(response, 'usage');
                            recordMeterUsage({
                                textUnits: usageField(usage, 'sensitiveInformationPolicyUnits'),
                                freeTextUnits: usageField(
                                    usage,
                                    'sensitiveInformationPolicyFreeUnits'
                                ),
                            });
                            return response;
                        },
                        timeout,
                        'guardrail_request'
                    );
                    await withPrivacyOperation('consent_after', dependencies.assertConsent);
                    const result = await withPrivacyOperation('guardrail_response', () =>
                        validateGuardrailResponse(text, raw, messages)
                    );
                    recordUsage(result.usage);
                    return result.text;
                }
            )
        );
    };
};

// ApplyGuardrail is a provider boundary: read consent fresh before and after it
// instead of reusing the request's earlier read, so a withdrawal stops the text
// before it reaches Bedrock. Inside one AI call these checks share the call's
// newest read (oncePerAiCall); the next AI call reads again.
export const assertGuardrailConsent = () =>
    assertCurrentAiConsent('model-inference', {
        fresh: true,
        oncePerAiCall: true,
    });

let runtime: BedrockRuntimeClient | undefined;
let control: BedrockClient | undefined;
export const maskSensitiveText = createGuardrailMasker({
    config: getBedrockGuardrailConfig,
    locale: getCurrentLocale,
    assertConsent: assertGuardrailConsent,
    withAudit: (metadata, operation) => withAiAudit(metadata, operation),
    bypass: () => isPrivacyGuardrailBypassEnabled(process.env),
    warnBypass: source => writePrivacyGuardrailBypassRequestWarning(source),
    getPolicy: (config, signal) => {
        control ??= new BedrockClient({
            region: config.region,
            endpoint: BEDROCK_CONTROL_ENDPOINT,
            maxAttempts: BEDROCK_MAX_ATTEMPTS,
            ...getBedrockSdkAuthConfig(getBedrockAuth()),
        });
        return control.send(
            new GetGuardrailCommand({
                guardrailIdentifier: config.guardrailIdentifier,
                guardrailVersion: config.guardrailVersion,
            }),
            { abortSignal: signal }
        );
    },
    getLogging: (config, signal) => {
        control ??= new BedrockClient({
            region: config.region,
            endpoint: BEDROCK_CONTROL_ENDPOINT,
            maxAttempts: BEDROCK_MAX_ATTEMPTS,
            ...getBedrockSdkAuthConfig(getBedrockAuth()),
        });
        return control.send(new GetModelInvocationLoggingConfigurationCommand({}), {
            abortSignal: signal,
        });
    },
    apply: (config, text, source, signal) => {
        runtime ??= new BedrockRuntimeClient({
            region: config.region,
            endpoint: BEDROCK_RUNTIME_ENDPOINT,
            maxAttempts: BEDROCK_MAX_ATTEMPTS,
            ...getBedrockSdkAuthConfig(getBedrockAuth()),
        });
        return runtime.send(
            new ApplyGuardrailCommand({
                guardrailIdentifier: config.guardrailIdentifier,
                guardrailVersion: config.guardrailVersion,
                source,
                content: [{ text: { text } }],
                outputScope: 'INTERVENTIONS',
            }),
            { abortSignal: signal }
        );
    },
});
