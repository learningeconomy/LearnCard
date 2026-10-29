import axios from 'axios';
import { z } from 'zod';

import { environment } from '@environment';
import type { Context } from '@routes';

const brainServiceUrl = environment.NETWORK_BRAIN_SERVICE_URL;
// The shared service endpoint is normally the tRPC base. OpenAPI is served
// alongside it, not beneath /trpc.
const profileUrl = brainServiceUrl
    ? `${brainServiceUrl.replace(/\/(?:trpc|api)\/?$/, '')}/api/profile`
    : null;

const currentProfileSchema = z.object({
    did: z.string(),
    dob: z.string().nullish(),
    country: z.string().nullish(),
    type: z.string().nullish(),
});

/** Read the signed-in holder's persisted profile from brain-service; never cache age authority. */
export const getCurrentProfile = async (
    ctx: Pick<Context, 'authorizationHeader' | 'tenant' | 'user'>
) => {
    if (!ctx.authorizationHeader || !ctx.user?.did)
        throw new Error('Missing verified profile authorization');
    if (!profileUrl) throw new Error('Profile authority is not configured');

    try {
        const { data } = await axios.get(profileUrl, {
            timeout: 3000,
            maxRedirects: 0,
            headers: {
                Authorization: ctx.authorizationHeader,
                'X-Tenant-Id': ctx.tenant.id,
            },
        });
        return currentProfileSchema.parse(data);
    } catch {
        throw new Error('Unable to resolve current profile');
    }
};
