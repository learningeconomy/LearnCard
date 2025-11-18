import dotenv from 'dotenv';
dotenv.config();

import { getPostmarkClient } from '../email/postmark-client';

// constants
export const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL!;
export const POSTMARK_BRAND_NAME = process.env.POSTMARK_BRAND_NAME!;

// templates
export const LOGIN_VERIFICATION_CODE_TEMPLATE_ID = process.env.POSTMARK_LOGIN_CODE_TEMPLATE_ID!;
export const POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ID =
    process.env.POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ID!;

export const sendEmailWithTemplate = async (
    to: string,
    templateId: number,
    templateModel: Record<string, any>,
    from: string = POSTMARK_FROM_EMAIL
): Promise<void> => {
    try {
        await getPostmarkClient().sendEmailWithTemplate({
            TemplateId: templateId,
            TemplateModel: templateModel,
            To: to,
            From: from,
        });
    } catch (error) {
        console.error(error);
        console.error('Failed to send email with template', error);
    }
};

// helper to construct the from address
export const getFrom = ({
    brand = POSTMARK_BRAND_NAME!,
    domain = POSTMARK_FROM_EMAIL!,
    mailbox = 'login',
}: {
    brand?: string;
    domain?: string;
    mailbox?: string;
} = {}): string => {
    if (!domain) throw new Error('Missing POSTMARK_FROM (domain)');
    return `${brand} <${mailbox}@${domain}>`;
};
