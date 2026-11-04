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
    signCampaignUnsubscribeToken('00000000-0000-4000-8000-000000000000', 'configuration-check');
};

export const campaignEmailLinks = (
    campaign: Campaign,
    unsubscribeId: string
): { ctaUrl?: string; unsubscribeUrl: string; oneClickUrl: string } => {
    const branding = resolveBranding(
        resolveTenantFromRequest({ 'x-tenant-id': campaign.tenantId }).emailBranding
    );
    const token = signCampaignUnsubscribeToken(unsubscribeId, campaign.id);
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
        ...(campaign.channels.includes('inApp') && campaign.message?.enabled
            ? { ctaUrl: cta.toString() }
            : {}),
        unsubscribeUrl: unsubscribe.toString(),
        oneClickUrl: oneClick.toString(),
    };
};

export class CampaignEmailDeliveryError extends Error {}

/** One adapter per wave keeps stream validation ahead of every durable claim. */
export const prepareCampaignEmailDelivery = async (): Promise<PostmarkAdapter> => {
    assertCampaignEmailConfigured();
    const adapter = new PostmarkAdapter(environment.POSTMARK_API_KEY!);
    await adapter.assertBroadcastStream(environment.POSTMARK_BROADCAST_STREAM);
    return adapter;
};

export const sendCampaignEmail = async (
    campaign: Campaign,
    profileId: string,
    test = false,
    preparedAdapter?: PostmarkAdapter
): Promise<boolean> => {
    const adapter = preparedAdapter ?? (await prepareCampaignEmailDelivery());
    let deliver: (() => Promise<void>) | undefined;
    const recipient = await claimCampaignEmail(
        campaign.id,
        campaign.createdAt,
        profileId,
        test,
        async current => {
            try {
                const links = campaignEmailLinks(current.campaign, current.unsubscribeId);
                deliver = await adapter.prepareCampaignEmail({
                    contactMethod: { type: 'email', value: current.email },
                    templateId: 'campaign-announcement',
                    templateModel: {
                        ...current.campaign.email!,
                        ctaUrl: links.ctaUrl,
                        unsubscribeUrl: links.unsubscribeUrl,
                    },
                    subject: current.campaign.email!.subject,
                    messageStream: environment.POSTMARK_BROADCAST_STREAM,
                    headers: [
                        { Name: 'List-Unsubscribe', Value: `<${links.oneClickUrl}>` },
                        { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
                    ],
                    branding: resolveTenantFromRequest({
                        'x-tenant-id': current.campaign.tenantId,
                    }).emailBranding,
                    locale: current.locale,
                });
            } catch {
                throw new Error('Campaign email preparation failed');
            }
        }
    );
    if (!recipient) return false;
    if (!deliver) throw new Error('Campaign email was not prepared');
    try {
        await deliver();
        if (!test) await acknowledgeCampaignEmail(campaign.id, campaign.createdAt, profileId);
    } catch {
        // Provider errors may contain recipient addresses and bearer unsubscribe URLs.
        throw new CampaignEmailDeliveryError(
            test
                ? 'Campaign test email delivery failed'
                : 'Campaign email delivery failed; reservation retained'
        );
    }
    return true;
};
