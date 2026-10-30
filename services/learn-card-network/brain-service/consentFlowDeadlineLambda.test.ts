import type { Context } from 'aws-lambda';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { send, deadlineAppImport } = vi.hoisted(() => ({
    send: vi.fn(),
    deadlineAppImport: vi.fn(),
}));

vi.mock('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: class {
        send = send;
        destroy = vi.fn();
    },
    GetSecretValueCommand: class {
        constructor(public input: { SecretId: string }) {}
    },
}));
vi.mock('./consentFlowDeadlineLambdaApp', () => {
    deadlineAppImport();
    return { consentFlowDeadlineHandler: vi.fn() };
});

beforeEach(() => {
    vi.resetModules();
    send.mockReset();
    deadlineAppImport.mockReset();
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'lcn-brain-service-dev-consentFlowDeadline');
    vi.stubEnv('LAMBDA_STAGE', 'dev');
    vi.stubEnv('RUNTIME_SECRETS_ID', 'brain-service/dev/runtime-secrets');
});
afterEach(() => vi.unstubAllEnvs());

it('does not import or run deadline work when runtime secrets fail to load', async () => {
    send.mockRejectedValue(new Error('secrets unavailable'));
    const { consentFlowDeadlineHandler } = await import('./consentFlowDeadlineLambda');

    await expect(
        consentFlowDeadlineHandler({}, { getRemainingTimeInMillis: () => 30_000 } as Context)
    ).rejects.toThrow('Unable to load runtime secrets bundle');
    expect(deadlineAppImport).not.toHaveBeenCalled();
});
