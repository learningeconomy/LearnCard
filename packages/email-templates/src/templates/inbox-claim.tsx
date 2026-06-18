/**
 * InboxClaim — email notifying a recipient they have a credential to claim.
 *
 * Used by: brain-service inbox.helpers.ts (templateId: 'universal-inbox-claim')
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
import { resolveCatalogLocale } from '../i18n';

export interface InboxClaimProps {
    branding: TenantBranding;
    claimUrl: string;
    recipient?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    issuer?: {
        name?: string;
        logoUrl?: string;
    };
    credential?: {
        name?: string;
        type?: string;
    };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

/**
 * Intro is a function returning ReactNode because it conditionally wraps the
 * issuer name and credential name in <strong> + curly quotes, and word order
 * shifts per locale. EN reproduces the original JSX exactly.
 */
type Strings = {
    greeting: string;
    greetingName: string;
    heading: (credentialType: string) => string;
    preview: (credentialType: string, issuerName?: string) => string;
    intro: (issuerName: string | undefined, credentialName: string | undefined) => React.ReactNode;
    passport: (brandName: string, credentialType: string) => React.ReactNode;
    button: string;
    sincerely: string;
    subject: (issuerName?: string) => string;
};

const ldquo = '\u201C';
const rdquo = '\u201D';
const mdash = '\u2014';

const EN: Strings = {
    greeting: 'Hello,',
    greetingName: 'Hello {name},',
    heading: t => `Your digital ${t} is ready`,
    preview: (t, issuer) => `Your digital ${t}${issuer ? ` from ${issuer}` : ''} is ready`,
    intro: (issuerName, credentialName) => (
        <>
            {issuerName ? (
                <>
                    <strong>{issuerName}</strong> has sent you
                </>
            ) : (
                <>You&apos;ve received</>
            )}{' '}
            a secure, digital version of your{' '}
            <strong>{credentialName ? `${ldquo}${credentialName}${rdquo}` : 'achievement'}</strong>.
        </>
    ),
    passport: (b, t) => (
        <>
            {b} is your private, digital passport for learning and work. It lets you securely
            collect and share your verified skills and achievements online. By claiming this item,
            you are saving a verifiable, official {t} to your personal passport{mdash}one that only
            you control.
        </>
    ),
    button: 'Claim Your Record \u2192',
    sincerely: 'Sincerely,',
    subject: issuer => `Your digital record ${issuer ? `from ${issuer} ` : ''}is ready`,
};

const ES: Strings = {
    greeting: 'Hola,',
    greetingName: 'Hola {name},',
    heading: t => `Tu ${t} digital está listo`,
    preview: (t, issuer) => `Tu ${t} digital${issuer ? ` de ${issuer}` : ''} está listo`,
    intro: (issuerName, credentialName) => (
        <>
            {issuerName ? (
                <>
                    <strong>{issuerName}</strong> te ha enviado
                </>
            ) : (
                <>Has recibido</>
            )}{' '}
            una versión digital y segura de tu{' '}
            <strong>{credentialName ? `${ldquo}${credentialName}${rdquo}` : 'logro'}</strong>.
        </>
    ),
    passport: (b, t) => (
        <>
            {b} es tu pasaporte digital y privado para el aprendizaje y el trabajo. Te permite
            recopilar y compartir de forma segura tus habilidades y logros verificados en línea. Al
            reclamar este elemento, estás guardando un {t}
            verificable y oficial en tu pasaporte personal{mdash}uno que solo tú controlas.
        </>
    ),
    button: 'Reclamar tu registro \u2192',
    sincerely: 'Atentamente,',
    subject: issuer => `Tu registro digital ${issuer ? `de ${issuer} ` : ''}está listo`,
};

const FR: Strings = {
    greeting: 'Bonjour,',
    greetingName: 'Bonjour {name},',
    heading: t => `Votre ${t} numérique est prêt`,
    preview: (t, issuer) => `Votre ${t} numérique${issuer ? ` de ${issuer}` : ''} est prêt`,
    intro: (issuerName, credentialName) => (
        <>
            {issuerName ? (
                <>
                    <strong>{issuerName}</strong> vous a envoyé
                </>
            ) : (
                <>Vous avez reçu</>
            )}{' '}
            une version numérique et sécurisée de votre{' '}
            <strong>{credentialName ? `${ldquo}${credentialName}${rdquo}` : 'réalisation'}</strong>.
        </>
    ),
    passport: (b, t) => (
        <>
            {b} est votre passeport numérique privé pour l\u2019apprentissage et le travail. Il vous
            permet de collecter et de partager en toute sécurité vos compétences et réalisations
            vérifiées en ligne. En réclamant cet élément, vous enregistrez un {t} vérifiable et
            officiel dans votre passeport personnel{mdash}que vous seul contrôlez.
        </>
    ),
    button: 'Réclamer votre titre \u2192',
    sincerely: 'Cordialement,',
    subject: issuer => `Votre titre numérique ${issuer ? `de ${issuer} ` : ''}est prêt`,
};

const AR: Strings = {
    greeting: 'مرحبًا،',
    greetingName: 'مرحبًا {name}،',
    heading: t => `${t}ك الرقمي جاهز`,
    preview: (t, issuer) => `${t}ك الرقمي${issuer ? ` من ${issuer}` : ''} جاهز`,
    intro: (issuerName, credentialName) => (
        <>
            {issuerName ? (
                <>
                    أرسل لك <strong>{issuerName}</strong>
                </>
            ) : (
                <>لقد استلمت</>
            )}{' '}
            نسخة رقمية وآمنة من{' '}
            <strong>{credentialName ? `${ldquo}${credentialName}${rdquo}` : 'إنجازك'}</strong>.
        </>
    ),
    passport: (b, t) => (
        <>
            {b} هو جواز سفرك الرقمي والخاص للتعلّم والعمل. يتيح لك جمع ومشاركة مهاراتك وإنجازاتك
            الموثّقة بأمان عبر الإنترنت. من خلال المطالبة بهذا العنصر، فأنت تحفظ {t}ًا قابلاً للتحقق
            ورسميًا في جواز سفرك الشخصي{mdash}الذي تتحكم فيه أنت وحدك.
        </>
    ),
    button: 'مطالبة سجلك ←',
    sincerely: 'مع التحيات،',
    subject: issuer => `سجلك الرقمي ${issuer ? `من ${issuer} ` : ''}جاهز`,
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

const interpolate = (template: string, params: Record<string, string | undefined>): string =>
    template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = params[key];
        return value === undefined ? match : value;
    });

export const InboxClaim: React.FC<InboxClaimProps> = ({
    branding,
    claimUrl,
    recipient,
    issuer,
    credential,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const credentialName = credential?.name;
    const credentialType = credential?.type ?? 'record';
    const issuerName = issuer?.name;
    const issuerLogo = issuer?.logoUrl;
    const showHeaderLogo = !issuerLogo;

    const greeting = interpolate(recipient?.name ? s.greetingName : s.greeting, {
        name: recipient?.name,
    });

    return (
        <Layout
            branding={branding}
            locale={locale}
            preview={s.preview(credentialType, issuerName)}
            showHeaderLogo={showHeaderLogo}
        >
            <IssuerLogo logoUrl={issuerLogo} alt={issuerName ? `${issuerName} logo` : undefined} />

            <Text style={heading}>{s.heading(credentialType)}</Text>

            <Text style={paragraph}>{greeting}</Text>

            <Text style={paragraph}>{s.intro(issuerName, credentialName)}</Text>

            <Text style={paragraph}>{s.passport(branding.brandName, credentialType)}</Text>

            <Section style={buttonWrapper}>
                <EmailButton href={claimUrl} branding={branding}>
                    {s.button}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.sincerely}
                <br />
                The {branding.brandName} Team
            </Text>

            <LinkFallback href={claimUrl} locale={locale} />
        </Layout>
    );
};

export const getInboxClaimSubject = (
    _branding: TenantBranding,
    props: InboxClaimProps,
    locale?: string
): string => STRINGS[resolveCatalogLocale(locale)].subject(props.issuer?.name);

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
        <InboxClaim
            branding={DEFAULT_BRANDING}
            claimUrl="https://learncard.app/claim/abc123"
            recipient={{ name: 'Jane Doe' }}
            issuer={{
                name: 'Acme University',
                logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj',
            }}
            credential={{ name: 'Bachelor of Science', type: 'Achievement' }}
        />
    );
}
