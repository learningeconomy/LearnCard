import { networkStore } from 'learn-card-base';
import { z } from 'zod';
import { getTenantHeaders } from '../config/bootstrapTenantConfig';

const ticketResponse = z.object({
    result: z.object({
        data: z.object({ success: z.boolean(), ticket: z.string().optional() }),
    }),
});

const requestTicket = async (
    route: 'requestLoginTicket' | 'requestSocialLoginTicket',
    input: { email: string; code: string } | { provider: 'google' | 'apple'; idToken: string }
): Promise<string> => {
    const response = await fetch(`${networkStore.get.apiEndpoint()}/auth.${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getTenantHeaders() },
        body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Sign-in expired. Please try again.');
    const parsed = ticketResponse.safeParse(await response.json());
    if (!parsed.success || !parsed.data.result.data.success || !parsed.data.result.data.ticket) {
        throw new Error('Sign-in expired. Please try again.');
    }
    return parsed.data.result.data.ticket;
};

/** Exchange the app's email proof for a single-use broker ticket, never a Firebase token. */
export const requestEmailOtpTicket = (email: string, code: string): Promise<string> =>
    requestTicket('requestLoginTicket', { email, code });

/** Complete native social proof when a non-Firebase token source is available. */
export const requestSocialTicket = (
    provider: 'google' | 'apple',
    idToken: string
): Promise<string> => requestTicket('requestSocialLoginTicket', { provider, idToken });
