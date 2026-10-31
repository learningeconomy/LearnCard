import { z } from 'zod';
import { ProvisionError, refuse } from './errors';

/**
 * The app's email-code login, over the same public REST endpoints:
 * - lca-api `POST /send-login-verification-code` and `POST /verify-login-code`
 *   (lca-api `routes/firebase.ts`; the app calls the first one the same way in
 *   `AuthCoordinatorProvider.tsx`), with `X-Tenant-Id` like `src/sdk.ts`;
 * - Firebase Auth REST `accounts:signInWithCustomToken` with the tenant's public
 *   web API key: the REST form of the Firebase SDK's `signInWithCustomToken`.
 * No Firebase Admin credential is involved. Response bodies are parsed for the
 * fields needed and otherwise discarded; errors carry fixed reasons only.
 */
export interface LoginClient {
    sendCode(email: string): Promise<void>;
    /** One attempt. Returns lca-api's Firebase custom token. */
    verifyCode(email: string, code: string): Promise<string>;
    exchange(customToken: string): Promise<{ idToken: string; refreshToken: string }>;
}

export interface LoginClientOptions {
    serverUrl: string;
    tenantId: string;
    firebaseApiKey: string;
    transport?: typeof fetch;
}

const lcaBody = z.object({
    success: z.boolean(),
    error: z.string().optional(),
    token: z.string().min(1).optional(),
});

/** lca-api returns HTTP 200 with `success:false` for rate limits and send failures. */
const sendFailure = (error: string | undefined): ProvisionError => {
    if (error && /^Too many/i.test(error)) return new ProvisionError('send', 'rate_limited');
    if (error && /^Error sending/i.test(error))
        return new ProvisionError('send', 'delivery_refused');
    return new ProvisionError('send', 'refused');
};

/** Firebase error codes we name; anything else is `refused`. Never the raw message. */
const FIREBASE_ERRORS = [
    'INVALID_CUSTOM_TOKEN',
    'CREDENTIAL_MISMATCH',
    'TOO_MANY_ATTEMPTS_TRY_LATER',
    'API_KEY_INVALID',
    'USER_DISABLED',
] as const;

export const createLoginClient = ({
    serverUrl,
    tenantId,
    firebaseApiKey,
    transport = fetch,
}: LoginClientOptions): LoginClient => {
    const call = async (
        step: 'send' | 'verify' | 'exchange',
        url: string,
        body: unknown,
        headers: Record<string, string>
    ): Promise<{ status: number; json: unknown }> => {
        let response: Response;
        try {
            response = await transport(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(30_000),
                redirect: 'error',
            });
        } catch {
            throw new ProvisionError(step, 'transport');
        }
        const json = await response.json().catch(() => undefined);
        return { status: response.status, json };
    };
    const lca = async (step: 'send' | 'verify', path: string, body: unknown) => {
        const { status, json } = await call(step, `${serverUrl}${path}`, body, {
            'X-Tenant-Id': tenantId,
        });
        if (status === 429) throw new ProvisionError(step, 'rate_limited');
        if (status >= 500) throw new ProvisionError(step, 'unavailable');
        if (status < 200 || status >= 300) throw new ProvisionError(step, 'http_refusal');
        const parsed = lcaBody.safeParse(json);
        if (!parsed.success) throw new ProvisionError(step, 'invalid_response');
        return parsed.data;
    };
    return {
        async sendCode(email) {
            const body = await lca('send', '/send-login-verification-code', {
                email,
                locale: 'en',
            });
            if (!body.success) throw sendFailure(body.error);
        },
        async verifyCode(email, code) {
            if (!/^[0-9]{6}$/.test(code)) throw refuse('verify', 'code_format');
            const body = await lca('verify', '/verify-login-code', { email, code });
            if (!body.success) {
                // Rate-limit text is the only lca-api error worth distinguishing.
                if (body.error && /^Too many/i.test(body.error))
                    throw new ProvisionError('verify', 'rate_limited');
                throw new ProvisionError('verify', 'rejected');
            }
            if (!body.token) throw new ProvisionError('verify', 'invalid_response');
            return body.token;
        },
        async exchange(customToken) {
            const { status, json } = await call(
                'exchange',
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(firebaseApiKey)}`,
                { token: customToken, returnSecureToken: true },
                {}
            );
            if (status < 200 || status >= 300) {
                const message = z
                    .object({ error: z.object({ message: z.string() }) })
                    .safeParse(json);
                const code = message.success
                    ? FIREBASE_ERRORS.find(name => message.data.error.message.startsWith(name))
                    : undefined;
                throw new ProvisionError(
                    'exchange',
                    code ?? (status >= 500 ? 'unavailable' : 'refused')
                );
            }
            const parsed = z
                .object({ idToken: z.string().min(1), refreshToken: z.string().min(1) })
                .safeParse(json);
            if (!parsed.success) throw new ProvisionError('exchange', 'invalid_response');
            return parsed.data;
        },
    };
};

const claims = z.object({
    iss: z.string(),
    aud: z.string().min(1),
    exp: z.number(),
    email: z.string().optional(),
});

/**
 * Local sanity check of the ID token (never printed). lca-api verifies the
 * signature on every keys call; this only refuses a token for the wrong user,
 * an expired one, or (when known) the wrong Firebase project.
 */
export const checkIdToken = (
    idToken: string,
    email: string,
    now: number,
    expectedProject?: string
): void => {
    let payload: z.infer<typeof claims>;
    try {
        const part = idToken.split('.')[1] ?? '';
        payload = claims.parse(JSON.parse(Buffer.from(part, 'base64url').toString('utf8')));
    } catch {
        throw new ProvisionError('token', 'malformed');
    }
    if (payload.iss !== `https://securetoken.google.com/${payload.aud}`)
        throw new ProvisionError('token', 'issuer');
    if (expectedProject && payload.aud !== expectedProject)
        throw new ProvisionError('token', 'project');
    if (payload.exp * 1000 <= now) throw new ProvisionError('token', 'expired');
    if (payload.email?.toLowerCase() !== email.toLowerCase())
        throw new ProvisionError('token', 'email');
};
