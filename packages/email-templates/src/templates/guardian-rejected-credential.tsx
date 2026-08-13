/**
 * GuardianRejectedCredential — email sent to a student when their guardian
 * has declined to approve a credential.
 *
 * Used by: brain-service (templateAlias: 'guardian-rejected-credential')
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface GuardianRejectedCredentialProps {
    branding: TenantBranding;
    issuer?: {
        name?: string;
    };
    credential?: {
        name?: string;
    };
    recipient?: {
        email?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: string;
        heading: string;
        greeting: string;
        body: (issuerName: string, credentialName: string | undefined) => React.ReactNode;
        body2: (issuerName: string) => React.ReactNode;
        sincerely: string;
        subject: string;
    }
> = {
    en: {
        preview: 'Your guardian has declined a credential',
        heading: 'Credential not approved',
        greeting: 'Hi there,',
        body: (issuerName, credentialName) => (
            <>
                Your guardian has reviewed and <strong>declined</strong> the credential{' '}
                {credentialName ? (
                    <>
                        <strong>&ldquo;{credentialName}&rdquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                issued by <strong>{issuerName}</strong>.
            </>
        ),
        body2: issuerName => (
            <>
                The credential will not be added to your account. If you think this was a mistake,
                please reach out to your guardian or contact <strong>{issuerName}</strong> directly.
            </>
        ),
        sincerely: 'Sincerely,',
        subject: 'Credential Not Approved',
    },
    es: {
        preview: 'Tu tutor ha rechazado una credencial',
        heading: 'Credencial no aprobada',
        greeting: 'Hola,',
        body: (issuerName, credentialName) => (
            <>
                Tu tutor ha revisado y <strong>rechazado</strong> la credencial{' '}
                {credentialName ? (
                    <>
                        <strong>&ldquo;{credentialName}&rdquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                emitida por <strong>{issuerName}</strong>.
            </>
        ),
        body2: issuerName => (
            <>
                La credencial no se añadirá a tu cuenta. Si crees que esto ha sido un error,
                comunícate con tu tutor o contacta directamente con <strong>{issuerName}</strong>.
            </>
        ),
        sincerely: 'Atentamente,',
        subject: 'Credencial no aprobada',
    },
    fr: {
        preview: 'Votre tuteur a refusé un titre',
        heading: 'Titre non approuvé',
        greeting: 'Bonjour,',
        body: (issuerName, credentialName) => (
            <>
                Votre tuteur a examiné et <strong>refusé</strong> le titre{' '}
                {credentialName ? (
                    <>
                        <strong>&laquo;&nbsp;{credentialName}&nbsp;&raquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                émis par <strong>{issuerName}</strong>.
            </>
        ),
        body2: issuerName => (
            <>
                Le titre ne sera pas ajouté à votre compte. Si vous pensez qu\u2019il s\u2019agit
                d\u2019une erreur, veuillez contacter votre tuteur ou <strong>{issuerName}</strong>{' '}
                directement.
            </>
        ),
        sincerely: 'Cordialement,',
        subject: 'Titre non approuvé',
    },
    ar: {
        preview: 'رفض ولي أمرك شهادة',
        heading: 'لم تتم الموافقة على الشهادة',
        greeting: 'مرحبًا،',
        body: (issuerName, credentialName) => (
            <>
                راجع ولي أمرك و<strong>رفض</strong> الشهادة{' '}
                {credentialName ? (
                    <>
                        <strong>&laquo;{credentialName}&raquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                الصادرة من <strong>{issuerName}</strong>.
            </>
        ),
        body2: issuerName => (
            <>
                لن تُضاف الشهادة إلى حسابك. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع ولي أمرك أو
                الاتصال بـ <strong>{issuerName}</strong> مباشرة.
            </>
        ),
        sincerely: 'مع التحيات،',
        subject: 'لم تتم الموافقة على الشهادة',
    },
};

export const GuardianRejectedCredential: React.FC<GuardianRejectedCredentialProps> = ({
    branding,
    issuer,
    credential,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name;

    return (
        <Layout branding={branding} locale={locale} preview={s.preview}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.greeting}</Text>

            <Text style={paragraph}>{s.body(issuerName, credentialName)}</Text>

            <Text style={paragraph}>{s.body2(issuerName)}</Text>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>
        </Layout>
    );
};

export const getGuardianRejectedCredentialSubject = (
    _branding: TenantBranding,
    locale?: string
): string => STRINGS[resolveCatalogLocale(locale)].subject;

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
        <GuardianRejectedCredential
            branding={DEFAULT_BRANDING}
            issuer={{ name: 'Springfield School District' }}
            credential={{ name: 'Perfect Attendance Award' }}
            recipient={{ email: 'student@example.com' }}
        />
    );
}
