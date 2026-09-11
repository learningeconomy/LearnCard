import type { SupportedLanguage } from './index';

export type PreAuthEmailPayload = {
    email: string;
    locale: SupportedLanguage;
};

/** Build the locale-bearing payload expected by pre-auth email endpoints. */
export const createPreAuthEmailPayload = (
    email: string,
    locale: SupportedLanguage
): PreAuthEmailPayload => ({ email, locale });
