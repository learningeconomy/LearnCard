import { z } from 'zod';
import { environment } from '@environment';

/** Deployment-owned origins keep queued links on the same environment as the campaign. */
export const getCampaignAppOrigin = (tenantId: string): string => {
    try {
        const origins = z
            .record(z.string(), z.string())
            .parse(JSON.parse(environment.CAMPAIGN_APP_ORIGINS ?? '{}'));
        const origin = new URL(origins[tenantId]!);
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
        if (
            (origin.protocol !== 'https:' && !(local && origin.protocol === 'http:')) ||
            origin.username ||
            origin.password ||
            origin.pathname !== '/' ||
            origin.search ||
            origin.hash
        )
            throw new Error('Invalid origin');
        return origin.origin;
    } catch {
        throw new Error('Campaign app origin is not configured for this tenant');
    }
};
