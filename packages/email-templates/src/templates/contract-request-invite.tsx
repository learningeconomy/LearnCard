/**
 * ContractRequestInvite — email sent to an address that was invited to a contract request
 * and has no account yet.
 *
 * Used by: brain-service contract-request-invites.helpers.ts (templateId: 'contract-request-invite')
 */

import { Text, Section } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { LinkFallback } from '../components/LinkFallback';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

export interface ContractRequestInviteProps {
    branding: TenantBranding;
    /** Where the button goes: the tenant's app URL. */
    inviteUrl: string;
    referrer?: { name?: string };
    contractOwner?: { name?: string };
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    {
        heading: string;
        named: string;
        unnamed: string;
        namedSubject: string;
        unnamedSubject: string;
        instruction: string;
        button: string;
        thankYou: string;
    }
> = {
    en: {
        heading: 'Connection request',
        named: '{referrer} would like to connect you with {contractOwner} on {brandName}.',
        unnamed: 'Someone would like to connect with you on {brandName}.',
        namedSubject: '{referrer} would like to connect you with {contractOwner}',
        unnamedSubject: 'You have a new connection request',
        instruction:
            'Sign in or create a {brandName} account with this email address to review the request. Nothing is shared unless you accept.',
        button: 'Review request',
        thankYou: 'Thank you,',
    },
    es: {
        heading: 'Solicitud de conexión',
        named: '{referrer} quiere conectarte con {contractOwner} en {brandName}.',
        unnamed: 'Alguien quiere conectarse contigo en {brandName}.',
        namedSubject: '{referrer} quiere conectarte con {contractOwner}',
        unnamedSubject: 'Tienes una nueva solicitud de conexión',
        instruction:
            'Inicia sesión o crea una cuenta de {brandName} con esta dirección de correo para revisar la solicitud. No se comparte nada a menos que aceptes.',
        button: 'Revisar solicitud',
        thankYou: 'Gracias,',
    },
    fr: {
        heading: 'Demande de connexion',
        named: '{referrer} souhaite vous mettre en relation avec {contractOwner} sur {brandName}.',
        unnamed: 'Quelqu’un souhaite entrer en relation avec vous sur {brandName}.',
        namedSubject: '{referrer} souhaite vous mettre en relation avec {contractOwner}',
        unnamedSubject: 'Vous avez une nouvelle demande de connexion',
        instruction:
            'Connectez-vous ou créez un compte {brandName} avec cette adresse e-mail pour examiner la demande. Rien n’est partagé sans votre accord.',
        button: 'Examiner la demande',
        thankYou: 'Merci,',
    },
    ar: {
        heading: 'طلب اتصال',
        named: 'يريد {referrer} توصيلك بـ {contractOwner} على {brandName}.',
        unnamed: 'يريد شخص ما التواصل معك على {brandName}.',
        namedSubject: 'يريد {referrer} توصيلك بـ {contractOwner}',
        unnamedSubject: 'لديك طلب اتصال جديد',
        instruction:
            'سجّل الدخول أو أنشئ حسابًا في {brandName} بهذا البريد الإلكتروني لمراجعة الطلب. لن تتم مشاركة أي شيء ما لم توافق.',
        button: 'مراجعة الطلب',
        thankYou: 'شكرًا،',
    },
};

const names = (
    props: Pick<ContractRequestInviteProps, 'referrer' | 'contractOwner'>
): { referrer: string; contractOwner: string } | null => {
    const referrer = props.referrer?.name?.trim();
    const contractOwner = props.contractOwner?.name?.trim();
    return referrer && contractOwner ? { referrer, contractOwner } : null;
};

export const ContractRequestInvite: React.FC<ContractRequestInviteProps> = ({
    branding,
    inviteUrl,
    referrer,
    contractOwner,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const named = names({ referrer, contractOwner });
    const body = named
        ? interpolate(s.named, { ...named, brandName: branding.brandName })
        : interpolate(s.unnamed, { brandName: branding.brandName });

    return (
        <Layout branding={branding} locale={locale} preview={body}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{body}</Text>

            <Text style={paragraph}>
                {interpolate(s.instruction, { brandName: branding.brandName })}
            </Text>

            <Section style={buttonWrapper}>
                <EmailButton href={inviteUrl} branding={branding}>
                    {s.button}
                </EmailButton>
            </Section>

            <Text style={signOff}>
                {s.thankYou}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>

            <LinkFallback href={inviteUrl} locale={locale} />
        </Layout>
    );
};

export const getContractRequestInviteSubject = (
    _branding: TenantBranding,
    props: Pick<ContractRequestInviteProps, 'referrer' | 'contractOwner'>,
    locale?: string
): string => {
    const s = STRINGS[resolveCatalogLocale(locale)];
    const named = names(props);
    return named ? interpolate(s.namedSubject, named) : s.unnamedSubject;
};

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

export default function Preview(): React.ReactElement {
    return (
        <ContractRequestInvite
            branding={DEFAULT_BRANDING}
            inviteUrl="https://learncard.app"
            referrer={{ name: 'Hire Heroes USA' }}
            contractOwner={{ name: 'Hiring Our Heroes' }}
        />
    );
}
