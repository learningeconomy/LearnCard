/**
 * GuardianApprovedClaim — email sent to a student when their guardian has
 * approved a credential.
 *
 * Used by: brain-service (templateAlias: 'guardian-approved-claim')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { IssuerLogo } from '../components/IssuerLogo';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface GuardianApprovedClaimProps {
    branding: TenantBranding;
    issuer?: {
        name?: string;
        logoUrl?: string;
    };
    credential?: {
        name?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        preview: string;
        heading: string;
        greatNews: string;
        body: (
            issuerName: string,
            credentialName: string | undefined,
            brandName: string
        ) => React.ReactNode;
        openApp: string;
        button: (brandName: string) => string;
        sincerely: string;
        subject: string;
    }
> = {
    en: {
        preview: 'Your credential has been approved by your guardian!',
        heading: 'Your credential has been approved!',
        greatNews: 'Great news!',
        body: (issuerName, credentialName, brandName) => (
            <>
                Your guardian has approved the credential{' '}
                {credentialName ? (
                    <>
                        <strong>&ldquo;{credentialName}&rdquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                issued by <strong>{issuerName}</strong>. It is now available in your {brandName}{' '}
                account.
            </>
        ),
        openApp:
            'Open the app to see it \u2014 your credential should appear automatically. If you don\u2019t see it right away, try refreshing.',
        button: b => `Open ${b} \u2192`,
        sincerely: 'Sincerely,',
        subject: 'Your Credential Has Been Approved!',
    },
    es: {
        preview: '¡Tu credencial ha sido aprobada por tu tutor!',
        heading: '¡Tu credencial ha sido aprobada!',
        greatNews: '¡Buenas noticias!',
        body: (issuerName, credentialName, brandName) => (
            <>
                Tu tutor ha aprobado la credencial{' '}
                {credentialName ? (
                    <>
                        <strong>&ldquo;{credentialName}&rdquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                emitida por <strong>{issuerName}</strong>. Ya está disponible en tu cuenta de{' '}
                {brandName}.
            </>
        ),
        openApp:
            'Abre la app para verla \u2014 tu credencial debería aparecer automáticamente. Si no la ves de inmediato, intenta actualizar.',
        button: b => `Abrir ${b} \u2192`,
        sincerely: 'Atentamente,',
        subject: '¡Tu credencial ha sido aprobada!',
    },
    fr: {
        preview: 'Votre titre a été approuvé par votre tuteur !',
        heading: 'Votre titre a été approuvé !',
        greatNews: 'Excellente nouvelle !',
        body: (issuerName, credentialName, brandName) => (
            <>
                Votre tuteur a approuvé le titre{' '}
                {credentialName ? (
                    <>
                        <strong>&laquo;&nbsp;{credentialName}&nbsp;&raquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                émis par <strong>{issuerName}</strong>. Il est désormais disponible dans votre
                compte {brandName}.
            </>
        ),
        openApp:
            'Ouvrez l\u2019application pour le voir \u2014 votre titre devrait apparaître automatiquement. Si vous ne le voyez pas tout de suite, essayez d\u2019actualiser.',
        button: b => `Ouvrir ${b} \u2192`,
        sincerely: 'Cordialement,',
        subject: 'Votre titre a été approuvé !',
    },
    ar: {
        preview: 'تمت الموافقة على شهادتك من قبل ولي أمرك!',
        heading: 'تمت الموافقة على شهادتك!',
        greatNews: 'أخبار رائعة!',
        body: (issuerName, credentialName, brandName) => (
            <>
                وافق ولي أمرك على الشهادة{' '}
                {credentialName ? (
                    <>
                        <strong>&laquo;{credentialName}&raquo;</strong>{' '}
                    </>
                ) : (
                    ''
                )}
                الصادرة من <strong>{issuerName}</strong>. وهي متاحة الآن في حسابك على {brandName}.
            </>
        ),
        openApp:
            'افتح التطبيق لرؤيتها \u2014 ينبغي أن تظهر شهادتك تلقائيًا. إذا لم تظهرها على الفور، حاول التحديث.',
        button: b => `فتح ${b} ←`,
        sincerely: 'مع التحيات،',
        subject: 'تمت الموافقة على شهادتك!',
    },
};

export const GuardianApprovedClaim: React.FC<GuardianApprovedClaimProps> = ({
    branding,
    issuer,
    credential,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const issuerName = issuer?.name ?? 'An issuer';
    const credentialName = credential?.name;

    return (
        <Layout branding={branding} locale={locale} preview={s.preview} showHeaderLogo={false}>
            <IssuerLogo
                logoUrl={issuer?.logoUrl}
                alt={issuerName ? `${issuerName} logo` : undefined}
            />

            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.greatNews}</Text>

            <Text style={paragraph}>{s.body(issuerName, credentialName, branding.brandName)}</Text>

            <Text style={paragraph}>{s.openApp}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={branding.appUrl} branding={branding}>
                    {s.button(branding.brandName)}
                </EmailButton>
            </Section>

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

export const getGuardianApprovedClaimSubject = (
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
        <GuardianApprovedClaim
            branding={DEFAULT_BRANDING}
            issuer={{ name: 'Springfield School District' }}
            credential={{ name: 'Perfect Attendance Award' }}
        />
    );
}
