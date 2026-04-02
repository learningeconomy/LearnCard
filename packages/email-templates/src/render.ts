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
} from './templates';

import type {
    VerificationCodeVariant,
    InboxClaimProps,
    GuardianApprovalProps,
    RecoveryKeyProps,
    EndorsementRequestProps,
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
    /** brain-service: contact-methods.ts, embed flow */
    'embed-email-verification': VerificationCodeData;

    /** brain-service: contact-methods.ts */
    'contact-method-verification': VerificationCodeData;

    /** lca-api: firebase.ts login flow */
    'login-verification-code': VerificationCodeData;

    /** lca-api: keys.ts recovery email verification */
    'recovery-email-code': VerificationCodeData;

    /** brain-service: inbox.helpers.ts */
    'inbox-claim': InboxClaimData;

    /** brain-service: inbox.ts */
    'guardian-approval': GuardianApprovalData;

    /** brain-service: inbox.ts */
    'account-approved': AccountApprovedData;

    /** lca-api: keys.ts */
    'recovery-key': RecoveryKeyData;

    /** lca-api: credentials.ts */
    'endorsement-request': EndorsementRequestData;
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
    issuer?: { name?: string };
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
    recipient?: { name?: string };
    issuer?: { name?: string };
    credential?: { name?: string };
    message?: string;
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
            return buildVerificationElement(branding, data as VerificationCodeData, 'login');

        case 'recovery-email-code':
            return buildVerificationElement(branding, data as VerificationCodeData, 'recovery-email');

        case 'inbox-claim': {
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

        case 'account-approved': {
            const d = data as AccountApprovedData;

            return {
                element: React.createElement(AccountApproved, { branding, ...d }),
                subject: getAccountApprovedSubject(branding),
            };
        }

        case 'recovery-key': {
            const d = data as RecoveryKeyData;
            const props: RecoveryKeyProps = { branding, ...d };

            return {
                element: React.createElement(RecoveryKey, props),
                subject: getRecoveryKeySubject(branding),
            };
        }

        case 'endorsement-request': {
            const d = data as EndorsementRequestData;
            const props: EndorsementRequestProps = { branding, ...d };

            return {
                element: React.createElement(EndorsementRequest, props),
                subject: getEndorsementRequestSubject(branding, props),
            };
        }

        default: {
            const _exhaustive: never = templateId;
            throw new Error(`Unknown template: ${_exhaustive}`);
        }
    }
}
