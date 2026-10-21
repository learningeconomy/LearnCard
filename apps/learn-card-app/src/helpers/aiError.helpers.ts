import type { AiErrorCode } from 'learn-card-base/helpers/aiErrors';
import * as m from '../paraglide/messages.js';

export const getAiErrorCopy = (code: AiErrorCode): { title: string; body: string } => {
    switch (code) {
        case 'ai_provider_quota_exhausted':
            return {
                title: m['ai.errors.quotaTitle'](),
                body: m['ai.errors.quotaBody'](),
            };
        case 'ai_provider_rate_limited':
            return {
                title: m['ai.errors.rateTitle'](),
                body: m['ai.errors.rateBody'](),
            };
        case 'ai_provider_unavailable':
            return {
                title: m['ai.errors.unavailableTitle'](),
                body: m['ai.errors.unavailableBody'](),
            };
        case 'ai_request_timeout':
            return {
                title: m['ai.errors.timeoutTitle'](),
                body: m['ai.errors.timeoutBody'](),
            };
        default:
            return {
                title: m['ai.errors.unknownTitle'](),
                body: m['ai.errors.unknownBody'](),
            };
    }
};
