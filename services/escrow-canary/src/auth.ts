import { z } from 'zod';

export class RunnerAuthError extends Error {
    constructor() {
        super('Runner authentication failed');
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
        if (!response.ok) throw new RunnerAuthError();
        const body = z
            .object({ id_token: z.string().min(1), refresh_token: z.string().min(1).optional() })
            .parse(await response.json());
        return { token: body.id_token, refreshToken: body.refresh_token ?? refreshToken };
    } catch {
        throw new RunnerAuthError();
    }
};
