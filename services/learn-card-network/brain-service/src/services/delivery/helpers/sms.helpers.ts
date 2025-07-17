import { Notification } from "../delivery.service";

export const getSmsBody = (notification: Notification): string | undefined => {
    const { templateId, templateModel } = notification;
    const { credential, issuer, claimUrl, verificationToken, recipient } = templateModel ?? {};

    switch(templateId) {
        case 'universal-inbox-claim':
            return `${recipient?.name ? `Hello, ${recipient?.name}! ` : ''}You have a new ${credential?.type ?? 'credential'}, "${credential?.name ?? 'Unnamed Credential'}${issuer?.name ? `," from ${issuer?.name}.` : '".'} Claim it here: ${claimUrl}`;
        case 'contact-method-verification':
            return `Your LearnCard verification code is: ${verificationToken}`;
    }
    return undefined;
}