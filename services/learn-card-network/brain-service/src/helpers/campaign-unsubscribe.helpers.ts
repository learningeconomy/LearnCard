import { createHmac, timingSafeEqual } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { environment } from '@environment';
import { updateAnnouncementPreferences } from '@accesslayer/campaign/preferences';

const secret = (): string => {
    const value = environment.CAMPAIGN_UNSUBSCRIBE_SECRET;
    if (!value || Buffer.byteLength(value) < 32)
        throw new Error('Campaign unsubscribe secret requires at least 32 bytes');
    return value;
};

/** Opaque, purpose-separated bearer token; it authorizes email opt-out only. */
export const signCampaignUnsubscribeToken = (profileId: string, campaignId: string): string => {
    const payload = `${profileId}.${campaignId}`;
    const signature = createHmac('sha256', secret())
        .update(`campaign-unsubscribe:${payload}`)
        .digest('base64url');
    return Buffer.from(`${payload}.${signature}`).toString('base64url');
};

export const verifyCampaignUnsubscribeToken = (
    token: string
): { profileId: string; campaignId: string } => {
    const invalid = (): never => {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid unsubscribe link' });
    };
    if (!/^[A-Za-z0-9_-]{1,2048}$/.test(token)) return invalid();
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    if (Buffer.from(decoded).toString('base64url') !== token) return invalid();
    const parts = decoded.split('.');
    const signature = parts.pop() ?? '';
    const campaignId = parts.pop() ?? '';
    const profileId = parts.join('.');
    if (
        !profileId ||
        !/^[a-z0-9-]{3,64}$/.test(campaignId) ||
        !/^[A-Za-z0-9_-]{43}$/.test(signature)
    )
        return invalid();
    const expected = signCampaignUnsubscribeToken(profileId, campaignId);
    const a = Buffer.from(token),
        b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return invalid();
    return { profileId, campaignId };
};

/** No campaign lookup: old links remain valid after campaign archive/deletion. */
export const unsubscribeFromCampaignEmails = async (token: string): Promise<boolean> => {
    const { profileId } = verifyCampaignUnsubscribeToken(token);
    try {
        await updateAnnouncementPreferences(profileId, { announcementEmailOptOut: true });
    } catch (error) {
        if (!(error instanceof TRPCError) || error.code !== 'NOT_FOUND') throw error;
    }
    return true;
};
