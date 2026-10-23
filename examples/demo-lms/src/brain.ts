import type { DemoLmsConfig } from './config';

export type CompletionFields = {
    completionId: string;
    courseId: string;
    courseTitle: string;
    completedAt: string;
};

export type SubmitResult =
    | { ok: true; recordId: string; status: 'ACCEPTED' | 'DUPLICATE' }
    | { ok: false; code: string; message: string };

type TrpcResponse<T> = {
    result?: { data: T };
    error?: { message?: string; data?: { code?: string } };
};

const callTrpc = async <T>(
    config: DemoLmsConfig,
    path: string,
    input: unknown,
    token?: string
): Promise<TrpcResponse<T>> => {
    const response = await fetch(`${config.brainUrl}/trpc/${path}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(input),
    });
    return (await response.json()) as TrpcResponse<T>;
};

let cached: { token: string; refreshAt: number } | undefined;

/** Bearer tokens last five minutes; refresh a minute early. */
const getToken = async (config: DemoLmsConfig): Promise<string> => {
    if (cached && cached.refreshAt > Date.now()) return cached.token;
    const response = await callTrpc<{ token: string }>(
        config,
        'installIntent.exchangeServiceAccountToken',
        { serviceAccountId: config.serviceAccountId, secret: config.serviceAccountSecret }
    );
    const token = response.result?.data.token;
    if (!token) throw new Error(`Token exchange failed: ${response.error?.message ?? 'unknown'}`);
    cached = { token, refreshAt: Date.now() + 4 * 60_000 };
    return token;
};

export const submitCompletion = async (
    config: DemoLmsConfig,
    subjectProfileId: string,
    fields: CompletionFields
): Promise<SubmitResult> => {
    const response = await callTrpc<{ recordId: string; status: 'ACCEPTED' | 'DUPLICATE' }>(
        config,
        'integrationService.submitRecord',
        { subjectProfileId, fields },
        await getToken(config)
    );
    if (response.result) return { ok: true, ...response.result.data };
    return {
        ok: false,
        code: response.error?.data?.code ?? 'UNKNOWN',
        message: response.error?.message ?? 'Request failed',
    };
};
