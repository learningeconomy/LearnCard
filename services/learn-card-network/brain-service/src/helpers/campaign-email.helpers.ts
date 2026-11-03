import type { Campaign } from '@learncard/types';
import { resolveBranding, resolveTenantFromRequest } from '@learncard/email-templates';
import { environment } from '@environment';
import { claimCampaignEmail, acknowledgeCampaignEmail } from '@accesslayer/campaign/email';
import { PostmarkAdapter } from '../services/delivery/adapters/postmark.adapter';
import { signCampaignUnsubscribeToken } from './campaign-unsubscribe.helpers';

/** Campaign delivery must never fall through to a logging or transactional adapter. */
export const assertCampaignEmailConfigured = (): void => {
    if (!environment.POSTMARK_API_KEY || !environment.DOMAIN_NAME)
        throw new Error('Campaign email requires Postmark and a public Brain domain');
    const stream = environment.POSTMARK_BROADCAST_STREAM;
    if (!stream || stream.toLowerCase() === 'outbound')
        throw new Error('Campaign email requires a broadcast stream');
    signCampaignUnsubscribeToken('configuration-check', 'configuration-check');
};

export const campaignEmailLinks = (
    campaign: Campaign,
    profileId: string
): { ctaUrl: string; unsubscribeUrl: string; oneClickUrl: string } => {
    const branding = resolveBranding(
        resolveTenantFromRequest({ 'x-tenant-id': campaign.tenantId }).emailBranding
    );
    const token = signCampaignUnsubscribeToken(profileId, campaign.id);
    const cta = new URL(`/m/${campaign.id}`, branding.appUrl);
    cta.searchParams.set('utm_source', 'email');
    cta.searchParams.set('utm_campaign', campaign.id);
    const unsubscribe = new URL('/unsubscribe', branding.appUrl);
    unsubscribe.searchParams.set('token', token);
    const domain = environment.DOMAIN_NAME?.replace(/%3A/gi, ':').replace(/\/trpc\/?$/, '');
    if (!domain) throw new Error('Campaign unsubscribe endpoint is not configured');
    const api = new URL(`https://${domain}`);
    if (api.username || api.password || api.pathname !== '/' || api.search || api.hash)
        throw new Error('Invalid Brain domain');
    const oneClick = new URL('/campaigns/unsubscribe', api);
    oneClick.searchParams.set('token', token);
    return {
        ctaUrl: cta.toString(),
        unsubscribeUrl: unsubscribe.toString(),
        oneClickUrl: oneClick.toString(),
    };
};

export const sendCampaignEmail = async (
    campaign: Campaign,
    profileId: string,
    test = false
): Promise<boolean> => {
    assertCampaignEmailConfigured();
    // Validate configured URLs before reserving a recipient.
    campaignEmailLinks(campaign, profileId);
    const recipient = await claimCampaignEmail(campaign.id, campaign.createdAt, profileId, test);
    if (!recipient) return false;
    const links = campaignEmailLinks(recipient.campaign, profileId);
    const branding = resolveTenantFromRequest({
        'x-tenant-id': recipient.campaign.tenantId,
    }).emailBranding;
    try {
        await new PostmarkAdapter(environment.POSTMARK_API_KEY!).send({
            contactMethod: { type: 'email', value: recipient.email },
            templateId: 'campaign-announcement',
            templateModel: {
                ...recipient.campaign.email!,
                ctaUrl: links.ctaUrl,
                unsubscribeUrl: links.unsubscribeUrl,
            },
            subject: recipient.campaign.email!.subject,
            messageStream: environment.POSTMARK_BROADCAST_STREAM,
            headers: [
                { Name: 'List-Unsubscribe', Value: `<${links.oneClickUrl}>` },
                { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
            ],
            branding,
            locale: recipient.locale,
        });
    } catch {
        // Provider errors may contain recipient addresses and bearer unsubscribe URLs.
        throw new Error(
            test
                ? 'Campaign test email delivery failed'
                : 'Campaign email delivery failed; reservation retained'
        );
    }
    if (!test) await acknowledgeCampaignEmail(campaign.id, campaign.createdAt, profileId);
    return true;
};
