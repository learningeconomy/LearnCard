/**
 * CredentialUpdated — privacy-minimal notice that an issuer published a new
 * version of a credential.
 *
 * Used by: brain-service credential-refresh publication (templateId:
 * 'credential-updated').
 *
 * Deliberately minimal context: the issuer display name and the credential
 * display title are the only dynamic values. No grades, subject/recipient
 * details, evidence, body, or issuer-authored update summary is rendered. The
 * CTA points at the recipient's own notifications page (never a claim URL and
 * never a bearer token), so a forwarded email cannot be used to access the
 * credential.
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { IssuerLogo } from '../components/IssuerLogo';
import { LinkFallback } from '../components/LinkFallback';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface CredentialUpdatedProps {
    branding: TenantBranding;
    issuer?: {
        name?: string;
        logoUrl?: string;
    };
    /** Bounded credential display title. Omitted when unavailable. */
    credential?: {
        name?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const ldquo = '\u201C';
const rdquo = '\u201D';

type Strings = {
    preview: string;
    heading: string;
    body: (issuerName: string | undefined, credentialName: string | undefined) => React.ReactNode;
    signIn: string;
    button: string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'Your credential has been updated',
    heading: 'Your credential was updated',
    body: (issuerName, credentialName) =>
        issuerName ? (
            credentialName ? (
                <>
                    <strong>{issuerName}</strong> updated your{' '}
                    <strong>
                        {ldquo}
                        {credentialName}
                        {rdquo}
                    </strong>{' '}
                    certificate.
                </>
            ) : (
                <>
                    <strong>{issuerName}</strong> updated one of your credentials.
                </>
            )
        ) : credentialName ? (
            <>
                Your{' '}
                <strong>
                    {ldquo}
                    {credentialName}
                    {rdquo}
                </strong>{' '}
                certificate was updated.
            </>
        ) : (
            <>One of your credentials was updated.</>
        ),
    signIn: 'Sign in to view the latest version.',
    button: 'View Updates',
    sincerely: 'Sincerely,',
    subject: 'Your credential was updated',
};

const ES: Strings = {
    preview: 'Tu credencial se ha actualizado',
    heading: 'Tu credencial se actualizó',
    body: (issuerName, credentialName) =>
        issuerName ? (
            credentialName ? (
                <>
                    <strong>{issuerName}</strong> actualizó tu certificado{' '}
                    <strong>
                        {ldquo}
                        {credentialName}
                        {rdquo}
                    </strong>
                    .
                </>
            ) : (
                <>
                    <strong>{issuerName}</strong> actualizó una de tus credenciales.
                </>
            )
        ) : credentialName ? (
            <>
                Tu certificado{' '}
                <strong>
                    {ldquo}
                    {credentialName}
                    {rdquo}
                </strong>{' '}
                se actualizó.
            </>
        ) : (
            <>Una de tus credenciales se actualizó.</>
        ),
    signIn: 'Inicia sesión para ver la última versión.',
    button: 'Ver actualizaciones',
    sincerely: 'Atentamente,',
    subject: 'Tu credencial se actualizó',
};

const FR: Strings = {
    preview: 'Votre titre a été mis à jour',
    heading: 'Votre titre a été mis à jour',
    body: (issuerName, credentialName) =>
        issuerName ? (
            credentialName ? (
                <>
                    <strong>{issuerName}</strong> a mis à jour votre certificat{' '}
                    <strong>
                        {ldquo}
                        {credentialName}
                        {rdquo}
                    </strong>
                    .
                </>
            ) : (
                <>
                    <strong>{issuerName}</strong> a mis à jour l&apos;un de vos titres.
                </>
            )
        ) : credentialName ? (
            <>
                Votre certificat{' '}
                <strong>
                    {ldquo}
                    {credentialName}
                    {rdquo}
                </strong>{' '}
                a été mis à jour.
            </>
        ) : (
            <>L&apos;un de vos titres a été mis à jour.</>
        ),
    signIn: 'Connectez-vous pour voir la dernière version.',
    button: 'Voir les mises à jour',
    sincerely: 'Cordialement,',
    subject: 'Votre titre a été mis à jour',
};

const AR: Strings = {
    preview: 'تم تحديث شهادتك',
    heading: 'تم تحديث شهادتك',
    body: (issuerName, credentialName) =>
        issuerName ? (
            credentialName ? (
                <>
                    قام <strong>{issuerName}</strong> بتحديث شهادتك{' '}
                    <strong>
                        {ldquo}
                        {credentialName}
                        {rdquo}
                    </strong>
                    .
                </>
            ) : (
                <>
                    قام <strong>{issuerName}</strong> بتحديث إحدى شهاداتك.
                </>
            )
        ) : credentialName ? (
            <>
                تم تحديث شهادتك{' '}
                <strong>
                    {ldquo}
                    {credentialName}
                    {rdquo}
                </strong>
                .
            </>
        ) : (
            <>تم تحديث إحدى شهاداتك.</>
        ),
    signIn: 'سجّل الدخول لعرض أحدث إصدار.',
    button: 'عرض التحديثات',
    sincerely: 'مع التحيات،',
    subject: 'تم تحديث شهادتك',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

/** Notifications page of the configured app (never a claim or token URL). */
const notificationsUrl = (branding: TenantBranding): string =>
    `${branding.appUrl.replace(/\/+$/, '')}/notifications`;

export const CredentialUpdated: React.FC<CredentialUpdatedProps> = ({
    branding,
    issuer,
    credential,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const issuerName = issuer?.name;
    const credentialName = credential?.name;
    const updatesUrl = notificationsUrl(branding);

    return (
        <Layout
            branding={branding}
            locale={locale}
            preview={s.preview}
            showHeaderLogo={!issuer?.logoUrl}
        >
            <IssuerLogo
                logoUrl={issuer?.logoUrl}
                alt={issuerName ? `${issuerName} logo` : undefined}
            />

            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.body(issuerName, credentialName)}</Text>

            <Text style={paragraph}>{s.signIn}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={updatesUrl} branding={branding}>
                    {s.button}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>

            <LinkFallback href={updatesUrl} locale={locale} />
        </Layout>
    );
};

export const getCredentialUpdatedSubject = (_branding: TenantBranding, locale?: string): string =>
    STRINGS[resolveCatalogLocale(locale)].subject;

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

const buttonWrapper: React.CSSProperties = {
    margin: '0 0 24px',
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
        <CredentialUpdated
            branding={DEFAULT_BRANDING}
            issuer={{ name: 'Inbox Demo School' }}
            credential={{ name: 'Introduction to Biology' }}
        />
    );
}
