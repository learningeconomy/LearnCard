import axios from 'axios';
import { z } from 'zod';

import { environment } from '@environment';
import type { Context } from '@routes';
import { getBrainOpenApiBase } from './brainUrl';

const brainServiceUrl = environment.NETWORK_BRAIN_SERVICE_URL;
// The shared service endpoint is normally the tRPC base. OpenAPI is served
// alongside it, not beneath /trpc.
const profileUrl = brainServiceUrl ? `${getBrainOpenApiBase(brainServiceUrl)}/profile` : null;

const currentProfileSchema = z.object({
    dob: z.string().nullish(),
    country: z.string().nullish(),
    type: z.string().nullish(),
});

/** Resolve the authenticated holder's persisted profile; null means unknown age authority. */
// Brain's self-profile uses didRoute and verifies this same signed VP without
// consuming a second challenge. A challenge-consuming route would need a new
// service-auth contract. Brain may rewrite profile DIDs; the VP establishes identity.
export const getCurrentProfile = async (
    ctx: Pick<Context, 'authorizationHeader' | 'tenant' | 'user'>
) => {
    if (!ctx.authorizationHeader || !ctx.user?.did) return null;
    if (!profileUrl) {
        console.warn('Current profile authority unavailable: endpoint not configured');
        return null;
    }

    try {
        const { data } = await axios.get(profileUrl, {
            timeout: 3000,
            maxRedirects: 0,
            headers: {
                Authorization: ctx.authorizationHeader,
                'X-Tenant-Id': ctx.tenant.id,
            },
        });
        // The self-profile endpoint returns an empty body when no profile exists.
        if (data == null || data === '') return null;
        const parsed = currentProfileSchema.safeParse(data);
        if (!parsed.success) {
            console.warn('Current profile authority unavailable: malformed response');
            return null;
        }
        return parsed.data;
    } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        console.warn(
            status
                ? `Current profile authority unavailable: HTTP ${status}`
                : 'Current profile authority unavailable: request failed'
        );
        return null;
    }
};
