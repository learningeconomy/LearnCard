import { z } from 'zod';

export class RunnerAuthError extends Error {
    readonly reason = 'auth';
    constructor() {
        super('Runner authentication failed');
    }
}
export class RunnerExchangeError extends Error {
    constructor(readonly reason: 'transport' | 'invalid_response' | 'unavailable') {
        super('Runner token exchange failed');
    }
}
export const refreshIdentity = async (
    apiKey: string,
    refreshToken: string,
    transport: typeof fetch = fetch
): Promise<{ token: string; refreshToken: string }> => {
    try {
        const response = await transport(
            `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
                signal: AbortSignal.timeout(15_000),
                redirect: 'error',
            }
        );
        if (response.status === 400 || response.status === 401 || response.status === 403)
            throw new RunnerAuthError();
        if (!response.ok) throw new RunnerExchangeError('unavailable');
        const body = z
            .object({ id_token: z.string().min(1), refresh_token: z.string().min(1).optional() })
            .safeParse(
                await response.json().catch(() => {
                    throw new RunnerExchangeError('invalid_response');
                })
            );
        if (!body.success) throw new RunnerExchangeError('invalid_response');
        return { token: body.data.id_token, refreshToken: body.data.refresh_token ?? refreshToken };
    } catch (error) {
        if (error instanceof RunnerAuthError || error instanceof RunnerExchangeError) throw error;
        throw new RunnerExchangeError('transport');
    }
};
