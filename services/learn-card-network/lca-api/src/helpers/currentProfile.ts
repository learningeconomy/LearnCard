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
    if (!ctx.authorizationHeader || !ctx.user?.did || !profileUrl) return null;

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
        // Missing/malformed profiles and outages are unknown, never adult authority.
        return null;
    }
};
