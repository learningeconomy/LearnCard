import { copyPrivacyRequestTimeout } from './embedding-privacy-recovery';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { SafeLogMetrics } from '../logging';

export const PRIVACY_OPERATIONS = [
    'preparation',
    'mapping_persistence',
    'mapping_authentication',
    'local_filtering',
    'payload_serialization',
    'payload_limit',
    'service_invocation',
    'response_parsing',
    'response_validation',
    'response_application',
    'language',
    'configuration',
    'policy_request',
    'policy_validation',
    'logging_request',
    'logging_validation',
    'consent_before',
    'consent_after',
    'guardrail_request',
    'guardrail_response',
    'audit',
] as const;
export const PRIVACY_CATEGORIES = [
    'throttled',
    'access_denied',
    'resource_not_found',
    'request_rejected',
    'unknown',
    'syntax_error',
    'type_error',
    'payload_too_large',
    'invalid_response',
    'mapping_persistence',
    'mapping_authentication',
    'consent_denied',
    'audit_unavailable',
    'owner_unavailable',
    'configuration',
    'unsupported_language',
    'timeout',
    'aborted',
    'service_unavailable',
    'request-timeout',
    'unavailable',
    'response-malformed',
    'response-incomplete-coverage',
    'response-inconsistent-assessment',
    'response-invalid-none',
    'response-invalid-intervention',
    'response-stable-token-mismatch',
    'response-placeholder-loss',
    'response-missing-anonymization-mask',
] as const;
export const PRIVACY_STATUSES = [400, 401, 403, 404, 408, 413, 429, 500, 502, 503, 504] as const;

export const PRIVACY_INPUT_ORIGINS = [
    'request_instructions',
    'source_cohort',
    'reused_summary',
] as const;
export const PRIVACY_LANGUAGE_REASONS = ['locale'] as const;
const inputOrigin = new AsyncLocalStorage<(typeof PRIVACY_INPUT_ORIGINS)[number]>();
export const withPrivacyInputOrigin = <Result>(
    origin: (typeof PRIVACY_INPUT_ORIGINS)[number],
    callback: () => Result
): Result => inputOrigin.run(origin, callback);

type Details = Pick<
    SafeLogMetrics,
    | 'privacyOperation'
    | 'privacyCategory'
    | 'privacyStatus'
    | 'privacyInputOrigin'
    | 'privacyLanguageReason'
>;
const failures = new WeakMap<object, Details>();
const own = (value: unknown, key: string): unknown =>
    value && typeof value === 'object'
        ? Object.getOwnPropertyDescriptor(value, key)?.value
        : undefined;
const category = (error: unknown): NonNullable<Details['privacyCategory']> => {
    const name = own(error, 'name');
    const names: Record<string, NonNullable<Details['privacyCategory']>> = {
        AiConsentError: 'consent_denied',
        AiAuditPersistenceError: 'audit_unavailable',
        DataErasureRequestedError: 'owner_unavailable',
        BedrockConfigurationError: 'configuration',
        UnsupportedPrivacyLanguageError: 'unsupported_language',
        TimeoutError: 'timeout',
        AbortError: 'aborted',
        BedrockPrivacyError: 'service_unavailable',
        ThrottlingException: 'throttled',
        TooManyRequestsException: 'throttled',
        AccessDeniedException: 'access_denied',
        UnrecognizedClientException: 'access_denied',
        ResourceNotFoundException: 'resource_not_found',
        ValidationException: 'request_rejected',
        ServiceUnavailableException: 'service_unavailable',
        InternalServerException: 'service_unavailable',
    };
    const reason = own(error, 'reason');
    if (typeof reason === 'string' && PRIVACY_CATEGORIES.includes(reason as never))
        return reason as NonNullable<Details['privacyCategory']>;
    if (typeof name === 'string' && Object.hasOwn(names, name)) return names[name]!;
    if (error instanceof SyntaxError) return 'syntax_error';
    if (error instanceof TypeError) return 'type_error';
    return 'unknown';
};

/** Metadata only: never change exceptions or inspect messages, causes or accessors. */
export const markPrivacyFailure = <Failure>(
    error: Failure,
    operation: NonNullable<Details['privacyOperation']>,
    source: unknown = error,
    fixedCategory?: NonNullable<Details['privacyCategory']>
): Failure => {
    try {
        copyPrivacyRequestTimeout(source, error);
        if (!error || typeof error !== 'object' || failures.has(error)) return error;
        const inherited = source && typeof source === 'object' ? failures.get(source) : undefined;
        const status = own(own(source, '$metadata'), 'httpStatusCode');
        failures.set(
            error,
            inherited ?? {
                privacyOperation: operation,
                ...(inputOrigin.getStore() ? { privacyInputOrigin: inputOrigin.getStore() } : {}),
                ...(PRIVACY_LANGUAGE_REASONS.includes(own(source, 'languageReason') as never)
                    ? {
                          privacyLanguageReason: own(source, 'languageReason') as 'locale',
                      }
                    : {}),
                privacyCategory:
                    fixedCategory && source === error
                        ? fixedCategory
                        : category(source) === 'unknown'
                          ? (fixedCategory ?? 'unknown')
                          : category(source),
                ...(typeof status === 'number' && PRIVACY_STATUSES.includes(status as never)
                    ? { privacyStatus: status }
                    : {}),
            }
        );
    } catch {
        /* Hostile SDK errors cannot change execution. */
    }
    return error;
};
export const privacyFailureDetails = (error: unknown): Details | undefined =>
    error && typeof error === 'object' ? failures.get(error) : undefined;

export const withPrivacyOperation = async <Result>(
    operation: (typeof PRIVACY_OPERATIONS)[number],
    callback: () => Result | Promise<Result>
): Promise<Result> => {
    try {
        return await callback();
    } catch (error) {
        throw markPrivacyFailure(error, operation);
    }
};
