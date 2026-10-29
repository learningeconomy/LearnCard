/**
 * Console (BFF) client for the live driver and the doctor, lifted from
 * scripts/prove-demo-lms.ts with the cookie held per instance. Login uses the dev BFF's
 * insecure DID-auth (CONSOLE_BFF_DEV_INSECURE_AUTH=true), which only decodes the VP holder.
 */
import { z } from 'zod';
import { parseTrpcError, ScenarioError } from '../../core/expect';
import { registerSecret } from '../../core/report';

export const DEV_CONSOLE_HOLDER = 'did:key:z6MkdevconsoleLocalOperator';

const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString('base64url');

export class ConsoleClient {
    private cookie = '';

    constructor(
        readonly origin: string,
        private readonly tenantId = 'learncard'
    ) {}

    get loggedIn(): boolean {
        return this.cookie !== '';
    }

    private async request(path: string, body?: unknown): Promise<Response> {
        let response: Response;
        try {
            response = await fetch(`${this.origin}${path}`, {
                method: body === undefined ? 'GET' : 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-tenant-id': this.tenantId,
                    ...(this.cookie ? { cookie: this.cookie } : {}),
                },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(30_000),
                redirect: 'error',
            });
        } catch (error) {
            const cause =
                error instanceof Error && error.cause instanceof Error ? error.cause : undefined;
            const refused = cause && 'code' in cause && cause.code === 'ECONNREFUSED';
            throw new ScenarioError({
                code: refused ? 'ECONNREFUSED' : 'FETCH_FAILED',
                message: `${this.origin}${path.split('?')[0]}: ${error instanceof Error ? error.message : String(error)}`,
                path: path.split('?')[0],
            });
        }
        if (!response.ok) {
            const text = await response.text();
            let parsed: unknown;
            try {
                parsed = JSON.parse(text);
            } catch {
                parsed = undefined;
            }
            throw (
                parseTrpcError(parsed, response.status) ??
                new ScenarioError({
                    code: `HTTP_${response.status}`,
                    message: text.slice(0, 500) || response.statusText,
                    path: path.split('?')[0],
                    httpStatus: response.status,
                })
            );
        }
        return response;
    }

    async login(holder = DEV_CONSOLE_HOLDER): Promise<void> {
        const providerId = 'lef-wallet';
        const begin = await this.request('/auth/login', {
            providerId,
            redirectUri: `${this.origin}/callback`,
        });
        const { redirectUrl } = z.object({ redirectUrl: z.string() }).parse(await begin.json());
        const state = new URL(redirectUrl).searchParams.get('state');
        if (!state)
            throw new ScenarioError({
                code: 'LOGIN',
                message: 'Missing login state',
                path: '/auth/login',
            });
        const vp = `${encode({ alg: 'ES256' })}.${encode({ iss: holder, vp: { holder } })}.dev-signature`;
        const callback = await this.request('/auth/callback', {
            providerId,
            params: { state, vp },
        });
        this.cookie = callback.headers.get('set-cookie')?.split(';')[0] ?? '';
        if (!this.cookie) {
            throw new ScenarioError({
                code: 'LOGIN',
                message: 'Missing session cookie',
                path: '/auth/callback',
            });
        }
        registerSecret(this.cookie);
    }

    private async rpc(path: string, input: unknown, mutation: boolean): Promise<unknown> {
        const query =
            mutation || input === undefined
                ? ''
                : `?input=${encodeURIComponent(JSON.stringify(input))}`;
        const response = await this.request(`/trpc/${path}${query}`, mutation ? input : undefined);
        return z.object({ result: z.object({ data: z.unknown() }) }).parse(await response.json())
            .result.data;
    }

    query(path: string, input?: unknown): Promise<unknown> {
        return this.rpc(path, input, false);
    }

    mutate(path: string, input: unknown): Promise<unknown> {
        return this.rpc(path, input, true);
    }

    /** GET a plain JSON endpoint (e.g. /health) relative to the origin. */
    async getJson(path: string): Promise<unknown> {
        return (await this.request(path)).json();
    }
}
