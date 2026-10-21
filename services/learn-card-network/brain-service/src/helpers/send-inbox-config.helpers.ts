import type { SendOptions } from '@learncard/types';

/**
 * Builds inbox configuration from SendOptions for the issueToInbox helper.
 */
export const buildInboxConfig = (
    options: SendOptions | undefined,
    boostUri: string
): {
    webhookUrl?: string;
    boostUri?: string;
    guardianEmail?: string;
    expiresInDays?: number;
    delivery?: {
        suppress: boolean;
        template?: {
            model: {
                issuer?: { name?: string; logoUrl?: string };
                credential?: { name?: string };
                recipient?: { name?: string };
            };
        };
    };
} => {
    const config: ReturnType<typeof buildInboxConfig> = {
        webhookUrl: options?.webhookUrl,
        boostUri,
        ...(options?.guardianEmail ? { guardianEmail: options.guardianEmail } : {}),
        ...(options?.expiresInDays ? { expiresInDays: options.expiresInDays } : {}),
    };

    if (options?.suppressDelivery || options?.branding) {
        config.delivery = {
            suppress: options?.suppressDelivery ?? false,
            template: options?.branding
                ? {
                      model: {
                          issuer: {
                              name: options.branding.issuerName,
                              logoUrl: options.branding.issuerLogoUrl,
                          },
                          credential: {
                              name: options.branding.credentialName,
                          },
                          recipient: {
                              name: options.branding.recipientName,
                          },
                      },
                  }
                : undefined,
        };
    }

    return config;
};
