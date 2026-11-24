/**
 * SignInEmailChanged — security notice that the email used to sign in to an account changed
 * (LC-2409: a ClassLink student's personal email became, changed or stopped being the
 * account's sign-in email).
 *
 * Sent to the previous real sign-in address(es) and to the school address while its alias is
 * live, never to the new address alone (whoever made the change controls it). It carries no
 * link: the reader is told to sign in with their school account and to contact their school,
 * or the tenant's support address when it has one (no address is made up).
 *
 * English only for now: the body is not translated yet (the shared chrome and sign-off are).
 *
 * Used by: lca-api `classlink.verifyPersonalEmail` and `classlink.removePersonalEmail`
 * (templateId: 'sign-in-email-changed')
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import {
    resolveCatalogLocale,
    interpolate,
    SHARED,
    formatNoticeTimestamp,
    localeProp,
} from '../i18n';

export interface SignInEmailChangedProps {
    branding: TenantBranding;
    /** ISO timestamp of the change (formatted per locale), or display text. */
    changedAt: string;
    /** The new sign-in email, already masked (e.g. `p•••@example.com`). Omitted when none. */
    maskedEmail?: string | undefined;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string | undefined;
}

const EN = {
    preview: 'The email you use to sign in was changed',
    heading: 'Your Sign-In Email Was Changed',
    changedTo:
        'On {changedAt}, the email you use to sign in to your {brandName} account was changed to {maskedEmail}.',
    changed:
        'On {changedAt}, the email you use to sign in to your {brandName} account was changed.',
    ifYou: 'If this was you, there is nothing else to do.',
    support:
        'If this wasn’t you, sign in with your school account and contact your school or {supportEmail} right away.',
    supportFallback:
        'If this wasn’t you, sign in with your school account and contact your school right away.',
    sincerely: 'Sincerely,',
    subject: 'Your sign-in email was changed',
};

export const SignInEmailChanged: React.FC<SignInEmailChangedProps> = ({
    branding,
    changedAt,
    maskedEmail,
    locale,
}) => {
    const catalogLocale = resolveCatalogLocale(locale);
    const { brandName, supportEmail } = branding;
    const when = formatNoticeTimestamp(changedAt, catalogLocale);

    return (
        <Layout branding={branding} preview={EN.preview} {...localeProp(locale)}>
            <Text style={heading}>{EN.heading}</Text>

            <Text style={paragraph}>
                {maskedEmail
                    ? interpolate(EN.changedTo, { changedAt: when, brandName, maskedEmail })
                    : interpolate(EN.changed, { changedAt: when, brandName })}
            </Text>

            <Text style={paragraph}>{EN.ifYou}</Text>

            <Text style={warning}>
                {supportEmail ? interpolate(EN.support, { supportEmail }) : EN.supportFallback}
            </Text>

            <Text style={signOff}>
                {EN.sincerely}
                <br />
                {interpolate(SHARED[catalogLocale].teamSignature, { brandName })}
            </Text>
        </Layout>
    );
};

export const getSignInEmailChangedSubject = (_branding: TenantBranding, _locale?: string): string =>
    EN.subject;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const heading: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
    fontSize: 16,
    color: '#374151',
    lineHeight: '24px',
    margin: '0 0 24px',
};

const warning: React.CSSProperties = {
    ...paragraph,
    fontWeight: 600,
};

const signOff: React.CSSProperties = {
    fontSize: 14,
    color: '#374151',
    lineHeight: '20px',
    margin: '24px 0 0',
};

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export default function Preview() {
    return (
        <SignInEmailChanged
            branding={DEFAULT_BRANDING}
            changedAt="November 20, 2026, 3:00 PM"
            maskedEmail="p•••@example.com"
        />
    );
}
