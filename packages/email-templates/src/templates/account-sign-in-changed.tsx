import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import type { NotificationLocale } from '../i18n';
import { interpolate, resolveCatalogLocale } from '../i18n';

export interface AccountSignInChangedProps {
    branding: TenantBranding;
    locale?: string;
}

const STRINGS: Record<
    NotificationLocale,
    { preview: string; heading: string; body: string; warning: string; subject: string }
> = {
    en: {
        preview: 'Your account sign-in was changed',
        heading: 'Your Sign-In Was Changed',
        body: 'Your {brandName} account was restored and connected to a new sign-in.',
        warning: 'If this was not you, contact support immediately.',
        subject: 'Your account sign-in was changed',
    },
    es: {
        preview: 'Se cambió el inicio de sesión de tu cuenta',
        heading: 'Se cambió tu inicio de sesión',
        body: 'Tu cuenta de {brandName} se restauró y se conectó a un nuevo inicio de sesión.',
        warning: 'Si no fuiste tú, comunícate con soporte de inmediato.',
        subject: 'Se cambió el inicio de sesión de tu cuenta',
    },
    fr: {
        preview: 'La connexion à votre compte a été modifiée',
        heading: 'Votre connexion a été modifiée',
        body: 'Votre compte {brandName} a été restauré et associé à une nouvelle connexion.',
        warning:
            'Si vous n’êtes pas à l’origine de cette action, contactez immédiatement l’assistance.',
        subject: 'La connexion à votre compte a été modifiée',
    },
    ar: {
        preview: 'تم تغيير تسجيل الدخول إلى حسابك',
        heading: 'تم تغيير تسجيل الدخول',
        body: 'تمت استعادة حسابك في {brandName} وربطه بتسجيل دخول جديد.',
        warning: 'إذا لم تكن أنت من أجرى هذا التغيير، فتواصل مع الدعم فورًا.',
        subject: 'تم تغيير تسجيل الدخول إلى حسابك',
    },
};

export const AccountSignInChanged: React.FC<AccountSignInChangedProps> = ({ branding, locale }) => {
    const strings = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={strings.preview}>
            <Text style={heading}>{strings.heading}</Text>
            <Text style={paragraph}>
                {interpolate(strings.body, { brandName: branding.brandName })}
            </Text>
            <Text style={warning}>{strings.warning}</Text>
        </Layout>
    );
};

/** Return the localized subject for an account sign-in change notification. */
export const getAccountSignInChangedSubject = (
    _branding: TenantBranding,
    locale?: string
): string => STRINGS[resolveCatalogLocale(locale)].subject;

const heading: React.CSSProperties = {
    color: '#111827',
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: '32px',
};

const paragraph: React.CSSProperties = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '24px',
};

const warning: React.CSSProperties = {
    ...paragraph,
    fontWeight: 600,
};

export default function Preview(): React.ReactElement {
    return <AccountSignInChanged branding={DEFAULT_BRANDING} />;
}
