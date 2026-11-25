import { afterEach, expect, spyOn, test } from 'bun:test';
import { AiConsentError } from '../learncard/consent';
import { LearnCardTimeoutError } from '../learncard/errors';
import { runAssessmentDiagnostics } from './assessment';

let restore = () => {};
afterEach(() => restore());

for (const [error, expected] of [
    [new LearnCardTimeoutError('private diagnostic details'), 'learncard_timeout'],
    [
        Object.assign(new Error('private diagnostic details'), {
            name: 'TimeoutError',
        }),
        'request_timeout',
    ],
    [new AiConsentError('private diagnostic details', 'revoked'), 'consent_denied'],
] as const) {
    test(`classifies ${expected} without changing the original failure`, async () => {
        const events: Record<string, unknown>[] = [];
        const info = spyOn(console, 'info').mockImplementation(event => events.push(event));
        const errorLog = spyOn(console, 'error').mockImplementation(event => events.push(event));
        restore = () => {
            info.mockRestore();
            errorLog.mockRestore();
        };
        await expect(
            runAssessmentDiagnostics(step =>
                step('sdk_init', () => {
                    throw error;
                })
            )
        ).rejects.toBe(error);
        expect(events.at(-1)).toMatchObject({
            event: 'ai_assessment_failed',
            failureCode: expected,
        });
        expect(JSON.stringify(events)).not.toContain('private diagnostic details');
    });
}
