import type { DemoLmsConfig } from './config';

export type CompletionFields = {
    completionId: string;
    courseId: string;
    courseTitle: string;
    completedAt: string;
};

/** What EducationOS did with the released record (submitRecord's `issuance`). */
export type Issuance =
    | { status: 'ISSUED'; credentialUri: string }
    | { status: 'OFFERED'; offerUri: string }
    | { status: 'ISSUE_FAILED' }
    | { status: 'PENDING' };

type Released = { recordId: string; status: 'ACCEPTED' | 'DUPLICATE'; issuance?: Issuance };

export type SubmitResult = ({ ok: true } & Released) | { ok: false; code: string; message: string };

/**
 * The link the partner shows the learner for a claim offer. With a LearnCard app URL it is
 * the app's generic VC-API client (`/request?vc_request_url=`); otherwise the raw exchange
 * URL, which any VC-API wallet can redeem.
 */
export const claimLinkFor = (offerUri: string, learnCardAppUrl?: string): string =>
    learnCardAppUrl
        ? `${learnCardAppUrl.replace(/\/$/, '')}/request?vc_request_url=${encodeURIComponent(offerUri)}`
        : offerUri;

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

type Refusal = { ok: false; code: string; message: string };

const refusal = <T>(response: TrpcResponse<T>): Refusal => ({
    ok: false,
    code: response.error?.data?.code ?? 'UNKNOWN',
    message: response.error?.message ?? 'Request failed',
});

/** Bearer tokens last five minutes; refresh a minute early. A refused exchange is passed through. */
const getToken = async (config: DemoLmsConfig): Promise<{ ok: true; token: string } | Refusal> => {
    if (cached && cached.refreshAt > Date.now()) return { ok: true, token: cached.token };
    const response = await callTrpc<{ token: string }>(
        config,
        'installIntent.exchangeServiceAccountToken',
        { serviceAccountId: config.serviceAccountId, secret: config.serviceAccountSecret }
    );
    const token = response.result?.data.token;
    if (!token) return refusal(response);
    cached = { token, refreshAt: Date.now() + 4 * 60_000 };
    return { ok: true, token };
};

export const submitCompletion = async (
    config: DemoLmsConfig,
    subjectProfileId: string,
    fields: CompletionFields
): Promise<SubmitResult> => {
    const token = await getToken(config);
    if (!token.ok) return token;
    const response = await callTrpc<Released>(
        config,
        'integrationService.submitRecord',
        { subjectProfileId, fields },
        token.token
    );
    if (response.result) return { ok: true, ...response.result.data };
    // A token minted before a credential generation bump is refused; mint a fresh one next time.
    if (response.error?.data?.code === 'UNAUTHORIZED') cached = undefined;
    return refusal(response);
};
