import { randomUUID } from 'node:crypto';
import { AiProviderError } from '../ai/errors';
import { providerFailureDetails } from '../ai/provider-diagnostics';
import { privacyFailureDetails } from '../ai/privacy-diagnostics';
import { logSafeEvent, type AssessmentStage, type SafeLogMetrics } from '../logging';

export type AssessmentStep = <Result>(
    stage: AssessmentStage,
    callback: () => Result | Promise<Result>
) => Promise<Result>;

const failureCodes: Record<string, SafeLogMetrics['failureCode']> = {
    AiConsentError: 'consent_denied',
    DataErasureRequestedError: 'owner_operation_unavailable',
    CredentialVerificationUnavailableError: 'credential_verification_unavailable',
    AiAuditPersistenceError: 'audit_unavailable',
    BedrockPrivacyError: 'guardrail_unavailable',
    BedrockConfigurationError: 'guardrail_configuration',
    UnsupportedPrivacyLanguageError: 'unsupported_language',
    LearnCardUnavailableError: 'learncard_unavailable',
    TimeoutError: 'request_timeout',
};

// Never inspect messages, stacks, causes, credentials, or error accessors.
const failureDetails = (error: unknown): SafeLogMetrics => {
    try {
        const own = (key: string) =>
            error && typeof error === 'object'
                ? Object.getOwnPropertyDescriptor(error, key)?.value
                : undefined;
        const name = own('name');
        const failureCode =
            own('learnCardTimeout') === true
                ? 'learncard_timeout'
                : error instanceof AiProviderError
                  ? error.code
                  : typeof name === 'string' && Object.hasOwn(failureCodes, name)
                    ? failureCodes[name]
                    : 'unknown';
        return {
            failureCode,
            errorClass:
                error instanceof TypeError
                    ? 'TypeError'
                    : error instanceof SyntaxError
                      ? 'SyntaxError'
                      : error instanceof Error
                        ? 'Error'
                        : 'unknown',
            ...(failureCode === 'credential_verification_unavailable'
                ? {
                      verificationSubreason: own('verificationSubreason'),
                      verifierErrorKind: own('verifierErrorKind'),
                  }
                : {}),
            ...providerFailureDetails(error),
            ...privacyFailureDetails(error),
        };
    } catch {
        return { failureCode: 'unknown' };
    }
};

/** Bounded, request-local diagnostics. Logging never changes results or errors. */
export const runAssessmentDiagnostics = async <Result>(
    callback: (step: AssessmentStep) => Promise<Result>,
    attemptId?: unknown
): Promise<Result> => {
    const diagnosticId = randomUUID();
    const started = performance.now();
    let assessmentStage: AssessmentStage = 'request';
    let assessmentLastCompletedStage: AssessmentStage | undefined;
    const emit = (
        event:
            | 'ai_assessment_started'
            | 'ai_assessment_stage_started'
            | 'ai_assessment_stage_completed'
            | 'ai_assessment_failed'
            | 'ai_assessment_completed',
        metrics: SafeLogMetrics = {}
    ) => {
        try {
            logSafeEvent(event === 'ai_assessment_failed' ? 'error' : 'info', event, {
                diagnosticId,
                attemptId: typeof attemptId === 'string' ? attemptId : undefined,
                assessmentStage,
                assessmentLastCompletedStage,
                durationMs: Math.min(
                    86_400_000,
                    Math.max(0, Math.round(performance.now() - started))
                ),
                ...metrics,
            });
        } catch {
            /* Diagnostics must not replace the original outcome. */
        }
    };
    const step: AssessmentStep = async (stage, operation) => {
        assessmentStage = stage;
        emit('ai_assessment_stage_started');
        const result = await operation();
        assessmentLastCompletedStage = stage;
        emit('ai_assessment_stage_completed');
        return result;
    };
    emit('ai_assessment_started');
    try {
        const result = await callback(step);
        emit('ai_assessment_completed', { success: true });
        return result;
    } catch (error) {
        emit('ai_assessment_failed', { ...failureDetails(error), success: false });
        throw error;
    }
};
