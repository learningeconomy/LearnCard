/**
 * render.ts — the main rendering entry point.
 *
 * Consumers call `renderEmail(templateId, branding, data)` and get back
 * `{ html, text, subject }` — ready to hand to any email provider.
 *
 * Template IDs map to the IDs used by brain-service and lca-api today,
 * so migration can happen one template at a time.
 */

import { render } from '@react-email/render';
import * as React from 'react';

import type { TenantBranding } from './branding';
import { resolveBranding } from './branding';

import {
    VerificationCode,
    getVerificationCodeSubject,
    InboxClaim,
    getInboxClaimSubject,
    GuardianApproval,
    getGuardianApprovalSubject,
    AccountApproved,
    getAccountApprovedSubject,
    RecoveryKey,
    getRecoveryKeySubject,
    EndorsementRequest,
    getEndorsementRequestSubject,
    CredentialAwaitingGuardian,
    getCredentialAwaitingGuardianSubject,
    GuardianApprovedClaim,
    getGuardianApprovedClaimSubject,
    GuardianCredentialApproval,
    getGuardianCredentialApprovalSubject,
    GuardianEmailOtp,
    getGuardianEmailOtpSubject,
    GuardianRejectedCredential,
    getGuardianRejectedCredentialSubject,
} from './templates';

import type {
    VerificationCodeVariant,
    InboxClaimProps,
    GuardianApprovalProps,
    RecoveryKeyProps,
    EndorsementRequestProps,
    CredentialAwaitingGuardianProps,
    GuardianApprovedClaimProps,
    GuardianCredentialApprovalProps,
    GuardianEmailOtpProps,
    GuardianRejectedCredentialProps,
} from './templates';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface RenderedEmail {
    html: string;
    text: string;
    subject: string;
}

/**
 * Template ID → data shape mapping.
 *
 * Keys are the template IDs / aliases used at call sites in brain-service and lca-api.
 * This provides full type safety: `renderEmail('inbox-claim', branding, data)` will
 * require `data` to match `InboxClaimData`.
 */
export interface TemplateDataMap {
    // -- Verification code variants ------------------------------------------

    /** brain-service: contact-methods.ts, embed flow */
    'embed-email-verification': VerificationCodeData;

    /** brain-service: contact-methods.ts */
    'contact-method-verification': VerificationCodeData;

    /** lca-api: firebase.ts login flow */
    'login-verification-code': VerificationCodeData;

    /** Postmark alias for login-verification-code */
    'contact-method-verification-1': VerificationCodeData;

    /** lca-api: keys.ts recovery email verification */
    'recovery-email-code': VerificationCodeData;

    /** Postmark alias for recovery-email-code */
    'recovery-email-verification': VerificationCodeData;

    // -- Inbox / claim -------------------------------------------------------

    /** brain-service: inbox.helpers.ts */
    'inbox-claim': InboxClaimData;

    /** Postmark alias for inbox-claim */
    'universal-inbox-claim': InboxClaimData;

    // -- Guardian account approval -------------------------------------------

    /** brain-service: inbox.ts */
    'guardian-approval': GuardianApprovalData;

    // -- Account approved ----------------------------------------------------

    /** brain-service: inbox.ts */
    'account-approved': AccountApprovedData;

    /** Postmark alias for account-approved */
    'account-approved-email': AccountApprovedData;

    // -- Recovery key --------------------------------------------------------

    /** lca-api: keys.ts */
    'recovery-key': RecoveryKeyData;

    /** Postmark alias for recovery-key */
    'recovery-key-backup': RecoveryKeyData;

    // -- Endorsement request -------------------------------------------------

    /** lca-api: credentials.ts */
    'endorsement-request': EndorsementRequestData;

    /** Postmark alias for endorsement-request */
    'universal-inbox-claim-1': EndorsementRequestData;

    // -- Guardian credential flow (NEW) --------------------------------------

    /** Sent to student: credential pending guardian approval */
    'credential-awaiting-guardian': CredentialAwaitingGuardianData;

    /** Sent to student: guardian approved credential */
    'guardian-approved-claim': GuardianApprovedClaimData;

    /** Sent to guardian: approve/decline a specific credential */
    'guardian-credential-approval': GuardianCredentialApprovalData;

    /** Sent to guardian: OTP for identity verification */
    'guardian-email-otp': GuardianEmailOtpData;

    /** Sent to student: guardian rejected credential */
    'guardian-rejected-credential': GuardianRejectedCredentialData;
}

export type TemplateId = keyof TemplateDataMap;

// ---------------------------------------------------------------------------
// Per-template data shapes (without branding — that's injected by renderEmail)
// ---------------------------------------------------------------------------

export interface VerificationCodeData {
    verificationCode: string;
    verificationEmail?: string;
}

export interface InboxClaimData {
    claimUrl: string;
    recipient?: { name?: string; email?: string; phone?: string };
    issuer?: { name?: string; logoUrl?: string };
    credential?: { name?: string; type?: string };
}

export interface GuardianApprovalData {
    approvalUrl: string;
    approvalToken: string;
    requester?: { displayName?: string; profileId?: string };
    guardian?: { email?: string };
}

export interface AccountApprovedData {
    user?: { displayName?: string };
}

export interface RecoveryKeyData {
    recoveryKey: string;
}

export interface EndorsementRequestData {
    shareLink: string;
    recipient?: { name?: string; email?: string };
    issuer?: { name?: string; logoUrl?: string };
    credential?: { name?: string; type?: string };
    message?: string;
}

export interface CredentialAwaitingGuardianData {
    issuer?: { name?: string; logoUrl?: string };
    credential?: { name?: string };
    recipient?: { email?: string };
}

export interface GuardianApprovedClaimData {
    issuer?: { name?: string; logoUrl?: string };
    credential?: { name?: string };
}

export interface GuardianCredentialApprovalData {
    approvalUrl: string;
    approvalToken?: string;
    issuer?: { name?: string; logoUrl?: string };
    credential?: { name?: string };
    recipient?: { email?: string };
}

export interface GuardianEmailOtpData {
    verificationCode: string;
}

export interface GuardianRejectedCredentialData {
    issuer?: { name?: string };
    credential?: { name?: string };
    recipient?: { email?: string };
}

// ---------------------------------------------------------------------------
// renderEmail()
// ---------------------------------------------------------------------------

/**
 * Render a fully branded email for the given template.
 *
 * @param templateId  — one of the known template IDs
 * @param branding    — partial tenant branding (missing fields use LearnCard defaults)
 * @param data        — template-specific data
 * @returns `{ html, text, subject }` ready for any email adapter
 */
export async function renderEmail<T extends TemplateId>(
    templateId: T,
    branding: Partial<TenantBranding> | TenantBranding,
    data: TemplateDataMap[T],
): Promise<RenderedEmail> {
    const resolved = resolveBranding(branding);

    const { element, subject } = buildElement(templateId, resolved, data);

    const html = await render(element);
    const text = await render(element, { plainText: true });

    return { html, text, subject };
}

// ---------------------------------------------------------------------------
// Internal: build the React element + subject for a given template
// ---------------------------------------------------------------------------

function buildVerificationElement(
    branding: TenantBranding,
    data: VerificationCodeData,
    variant: VerificationCodeVariant,
): { element: React.ReactElement; subject: string } {
    return {
        element: React.createElement(VerificationCode, {
            branding,
            verificationCode: data.verificationCode,
            verificationEmail: data.verificationEmail,
            variant,
        }),
        subject: getVerificationCodeSubject(branding, variant),
    };
}

function buildElement(
    templateId: TemplateId,
    branding: TenantBranding,
    data: TemplateDataMap[TemplateId],
): { element: React.ReactElement; subject: string } {

    switch (templateId) {
        case 'embed-email-verification':
            return buildVerificationElement(branding, data as VerificationCodeData, 'embed-verification');

        case 'contact-method-verification':
            return buildVerificationElement(branding, data as VerificationCodeData, 'contact-method');

        case 'login-verification-code':
        case 'contact-method-verification-1':
            return buildVerificationElement(branding, data as VerificationCodeData, 'login');

        case 'recovery-email-code':
        case 'recovery-email-verification':
            return buildVerificationElement(branding, data as VerificationCodeData, 'recovery-email');

        case 'inbox-claim':
        case 'universal-inbox-claim': {
            const d = data as InboxClaimData;
            const props: InboxClaimProps = { branding, ...d };

            return {
                element: React.createElement(InboxClaim, props),
                subject: getInboxClaimSubject(branding, props),
            };
        }

        case 'guardian-approval': {
            const d = data as GuardianApprovalData;
            const props: GuardianApprovalProps = { branding, ...d };

            return {
                element: React.createElement(GuardianApproval, props),
                subject: getGuardianApprovalSubject(branding, props),
            };
        }

        case 'account-approved':
        case 'account-approved-email': {
            const d = data as AccountApprovedData;

            return {
                element: React.createElement(AccountApproved, { branding, ...d }),
                subject: getAccountApprovedSubject(branding),
            };
        }

        case 'recovery-key':
        case 'recovery-key-backup': {
            const d = data as RecoveryKeyData;
            const props: RecoveryKeyProps = { branding, ...d };

            return {
                element: React.createElement(RecoveryKey, props),
                subject: getRecoveryKeySubject(branding),
            };
        }

        case 'endorsement-request':
        case 'universal-inbox-claim-1': {
            const d = data as EndorsementRequestData;
            const props: EndorsementRequestProps = { branding, ...d };

            return {
                element: React.createElement(EndorsementRequest, props),
                subject: getEndorsementRequestSubject(branding, props),
            };
        }

        case 'credential-awaiting-guardian': {
            const d = data as CredentialAwaitingGuardianData;
            const props: CredentialAwaitingGuardianProps = { branding, ...d };

            return {
                element: React.createElement(CredentialAwaitingGuardian, props),
                subject: getCredentialAwaitingGuardianSubject(branding),
            };
        }

        case 'guardian-approved-claim': {
            const d = data as GuardianApprovedClaimData;
            const props: GuardianApprovedClaimProps = { branding, ...d };

            return {
                element: React.createElement(GuardianApprovedClaim, props),
                subject: getGuardianApprovedClaimSubject(branding),
            };
        }

        case 'guardian-credential-approval': {
            const d = data as GuardianCredentialApprovalData;
            const props: GuardianCredentialApprovalProps = { branding, ...d };

            return {
                element: React.createElement(GuardianCredentialApproval, props),
                subject: getGuardianCredentialApprovalSubject(branding),
            };
        }

        case 'guardian-email-otp': {
            const d = data as GuardianEmailOtpData;
            const props: GuardianEmailOtpProps = { branding, ...d };

            return {
                element: React.createElement(GuardianEmailOtp, props),
                subject: getGuardianEmailOtpSubject(branding),
            };
        }

        case 'guardian-rejected-credential': {
            const d = data as GuardianRejectedCredentialData;
            const props: GuardianRejectedCredentialProps = { branding, ...d };

            return {
                element: React.createElement(GuardianRejectedCredential, props),
                subject: getGuardianRejectedCredentialSubject(branding),
            };
        }

        default: {
            const _exhaustive: never = templateId;
            throw new Error(`Unknown template: ${_exhaustive}`);
        }
    }
}
