/**
 * @learncard/email-templates
 *
 * Git-managed, tenant-branded email and SMS templates for LearnCard services.
 *
 * Usage:
 *   import { renderEmail, renderSms, resolveBranding } from '@learncard/email-templates';
 *
 *   const { html, text, subject } = await renderEmail('inbox-claim', branding, {
 *       claimUrl: 'https://...',
 *       credential: { name: 'Badge' },
 *       issuer: { name: 'Acme' },
 *   });
 */

// Branding
export { resolveBranding, DEFAULT_BRANDING } from './branding';
export type { TenantBranding } from './branding';

// Email rendering
export { renderEmail } from './render';
export type { RenderedEmail, TemplateId, TemplateDataMap } from './render';
export type {
    VerificationCodeData,
    InboxClaimData,
    GuardianApprovalData,
    AccountApprovedData,
    RecoveryKeyData,
    EndorsementRequestData,
} from './render';

// SMS rendering
export { renderSms } from './sms';
export type { SmsTemplateId, SmsTemplateDataMap, SmsInboxClaimData, SmsVerificationData } from './sms';

// Server-side tenant resolution
export { resolveTenantFromRequest, registerOriginMapping, registerTenantBranding } from './tenant-registry';
export type { ResolvedTenant, RequestHeaders } from './tenant-registry';

// Template components (for direct use / testing / preview)
export * from './templates';
