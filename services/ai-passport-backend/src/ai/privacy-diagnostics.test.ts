import { afterEach, expect, mock, test } from 'bun:test';
import {
    markPrivacyFailure,
    privacyFailureDetails,
    withPrivacyOperation,
    withPrivacyInputOrigin,
} from './privacy-diagnostics';
import { runAiInsightDiagnostics, withAiInsightStage } from '../diagnostics/ai-insight';
import { configureProductionLogging, logSafeEvent } from '../logging';
const originalError = console.error;
const originalInfo = console.info;
let restore = () => {};
afterEach(() => {
    restore();
    console.error = originalError;
    console.info = originalInfo;
});
const capture = () => {
    const events: Record<string, unknown>[] = [];
    console.error = mock(event => events.push(event));
    console.info = mock(event => events.push(event));
    restore = configureProductionLogging('production');
    return events;
};
for (const [name, category] of [
    ['AiConsentError', 'consent_denied'],
    ['AiAuditPersistenceError', 'audit_unavailable'],
    ['ThrottlingException', 'throttled'],
    ['AccessDeniedException', 'access_denied'],
    ['BedrockConfigurationError', 'configuration'],
    ['TimeoutError', 'timeout'],
] as const) {
    test(`preserves ${name} identity and emits fixed metadata only`, async () => {
        const events = capture();
        const primary = Object.assign(new Error('secret-token learner-content'), {
            name,
            $metadata: { httpStatusCode: 429, credential: 'private' },
        });
        Object.defineProperty(primary, 'cause', {
            get: () => {
                throw new Error('must not inspect');
            },
        });
        await expect(
            runAiInsightDiagnostics(() =>
                withAiInsightStage('privacy_filter', () =>
                    withPrivacyOperation('guardrail_request', () => {
                        throw primary;
                    })
                )
            )
        ).rejects.toBe(primary);
        const failure = events.find(event => event.event === 'ai_insight_failed');
        expect(failure).toMatchObject({
            privacyOperation: 'guardrail_request',
            privacyCategory: category,
            privacyStatus: 429,
        });
        expect(JSON.stringify(events)).not.toContain('secret-token');
        expect(JSON.stringify(events)).not.toContain('learner-content');
        expect(JSON.stringify(events)).not.toContain('private');
    });
}
test('metadata is isolated across concurrent failures and preserves deepest operation', async () => {
    const first = new Error('first-private');
    const second = new Error('second-private');
    await Promise.allSettled([
        withPrivacyOperation('audit', () =>
            withPrivacyOperation('policy_request', () => {
                throw first;
            })
        ),
        withPrivacyOperation('response_parsing', () => {
            throw second;
        }),
    ]);
    expect(privacyFailureDetails(first)?.privacyOperation).toBe('policy_request');
    expect(privacyFailureDetails(second)?.privacyOperation).toBe('response_parsing');
    const wrapper = markPrivacyFailure(new Error('generic'), 'service_invocation', first);
    expect(privacyFailureDetails(wrapper)).toEqual(privacyFailureDetails(first));
});
test('hostile accessors and primitives cannot replace original rejection', async () => {
    const hostile = new Proxy(
        {},
        {
            getOwnPropertyDescriptor: () => {
                throw new Error('private');
            },
        }
    );
    await expect(
        withPrivacyOperation('configuration', () => {
            throw hostile;
        })
    ).rejects.toBe(hostile);
    await expect(
        withPrivacyOperation('preparation', () => Promise.reject(undefined))
    ).rejects.toBeUndefined();
});
test('sink rejects unallowlisted operations/categories/statuses and retains fixed failure budget', async () => {
    const events = capture();
    logSafeEvent('error', 'ai_insight_failed', {
        privacyOperation: 'private' as never,
        privacyCategory: 'private' as never,
        privacyStatus: 499,
    });
    logSafeEvent('error', 'ai_insight_failed', {
        privacyOperation: 'response_parsing',
        privacyCategory: 'private' as never,
        privacyStatus: 499,
    });
    expect(events[0]).toEqual({ event: 'ai_insight_failed' });
    expect(events[1]).toEqual({
        event: 'ai_insight_failed',
        privacyOperation: 'response_parsing',
    });
    events.length = 0;
    await runAiInsightDiagnostics(async () => {
        for (let i = 0; i < 20; i += 1) {
            try {
                await withAiInsightStage('privacy_filter', () =>
                    withPrivacyOperation('preparation', () => {
                        throw new Error('private');
                    })
                );
            } catch {
                /* synthetic failures */
            }
        }
    });
    expect(events.filter(event => event.event === 'ai_insight_failed')).toHaveLength(8);
    expect(JSON.stringify(events)).not.toContain('private');
});

test('language diagnostics emit only allowlisted context and preserve original error', async () => {
    const events = capture();
    const primary = Object.assign(new Error('private words and secret-token'), {
        name: 'UnsupportedPrivacyLanguageError',
        languageReason: 'locale',
    });
    await expect(
        runAiInsightDiagnostics(() =>
            withAiInsightStage('privacy_filter', () =>
                withPrivacyInputOrigin('reused_summary', () =>
                    withPrivacyOperation('language', () => {
                        throw primary;
                    })
                )
            )
        )
    ).rejects.toBe(primary);
    const event = events.find(value => value.event === 'ai_insight_failed');
    expect(event).toMatchObject({
        privacyInputOrigin: 'reused_summary',
        privacyLanguageReason: 'locale',
        privacyCategory: 'unsupported_language',
    });
    expect(JSON.stringify(events)).not.toContain('private words');
    logSafeEvent('error', 'ai_insight_failed', {
        privacyOperation: 'language',
        privacyInputOrigin: 'secret-token' as never,
        privacyLanguageReason: 'private words' as never,
    });
    expect(events.at(-1)).not.toHaveProperty('privacyInputOrigin');
    expect(events.at(-1)).not.toHaveProperty('privacyLanguageReason');
});
