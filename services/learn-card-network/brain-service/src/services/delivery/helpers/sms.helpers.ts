import { renderSms } from '@learncard/email-templates';
import type { SmsTemplateId } from '@learncard/email-templates';

import { Notification } from "../delivery.service";

/** Map brain-service templateIds to the SMS template IDs in @learncard/email-templates. */
const SMS_TEMPLATE_MAP: Record<string, SmsTemplateId> = {
    'universal-inbox-claim': 'inbox-claim',
    'contact-method-verification': 'contact-method-verification',
};

export const getSmsBody = (notification: Notification): string | undefined => {
    const { templateId, templateModel } = notification;
    const smsTemplateId = SMS_TEMPLATE_MAP[templateId];

    if (!smsTemplateId) return undefined;

    const { credential, issuer, claimUrl, verificationToken, recipient } = templateModel ?? {};

    const smsData = smsTemplateId === 'inbox-claim'
        ? { claimUrl, recipient, issuer, credential }
        : { verificationToken };

    return renderSms(smsTemplateId, notification.branding ?? {}, smsData as any);
}