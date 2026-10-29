/**
 * Unauthenticated brain HTTP calls the partner itself makes (token exchange, platform
 * signing key). Errors come back as `ScenarioError` with brain's tRPC code and message.
 */
import { z } from 'zod';
import { parseTrpcError, ScenarioError } from '../../core/expect';
import { registerSecret } from '../../core/report';

const PlatformJwkValidator = z.object({ kty: z.string(), crv: z.string(), x: z.string() });

export type PlatformJwk = z.infer<typeof PlatformJwkValidator>;

export class BrainClient {
    constructor(readonly origin: string) {}

    private async call(path: string, input: unknown, mutation: boolean): Promise<unknown> {
        const url = mutation
            ? `${this.origin}/trpc/${path}`
            : `${this.origin}/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`;
        let response: Response;
        try {
            response = await fetch(url, {
                method: mutation ? 'POST' : 'GET',
                headers: { 'content-type': 'application/json' },
                body: mutation ? JSON.stringify(input) : undefined,
                signal: AbortSignal.timeout(30_000),
            });
        } catch (error) {
            const cause =
                error instanceof Error && error.cause instanceof Error ? error.cause : undefined;
            const refused = cause && 'code' in cause && cause.code === 'ECONNREFUSED';
            throw new ScenarioError({
                code: refused ? 'ECONNREFUSED' : 'FETCH_FAILED',
                message: `${this.origin}/trpc/${path}: ${error instanceof Error ? error.message : String(error)}`,
                path,
            });
        }
        let body: unknown;
        try {
            body = await response.json();
        } catch {
            throw new ScenarioError({
                code: `HTTP_${response.status}`,
                message: `${path} returned a non-JSON body`,
                path,
                httpStatus: response.status,
            });
        }
        const error = parseTrpcError(body, response.status);
        if (error) throw error;
        return z.object({ result: z.object({ data: z.unknown() }) }).parse(body).result.data;
    }

    async exchangeToken(
        serviceAccountId: string,
        secret: string
    ): Promise<{ token: string; expiresIn?: number }> {
        const result = z
            .object({ token: z.string(), expiresIn: z.number().optional() })
            .parse(
                await this.call(
                    'installIntent.exchangeServiceAccountToken',
                    { serviceAccountId, secret },
                    true
                )
            );
        registerSecret(result.token);
        return result;
    }

    async platformJwk(): Promise<PlatformJwk> {
        const jwk = PlatformJwkValidator.parse(
            await this.call('installIntent.integrationSigningKey', {}, false)
        );
        return { kty: jwk.kty, crv: jwk.crv, x: jwk.x };
    }
}
