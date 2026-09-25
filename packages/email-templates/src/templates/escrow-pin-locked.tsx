/**
 * EscrowPinLocked — notifies a user that their recovery PIN has been disabled
 * after too many incorrect attempts. The slower, waiting-period recovery path
 * is unaffected and still available.
 *
 * Used by: lca-api recovery hold routes (templateId: 'escrow-pin-locked')
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

export interface EscrowPinLockedProps {
    branding: TenantBranding;
    /** Human-readable timestamp the PIN was locked. */
    lockedAt: string;
    /** Human-readable timestamp the waiting-period recovery will complete, if one is pending. */
    releaseAfter?: string;
    /** Link that cancels a pending waiting-period recovery request, if one is pending. */
    cancelUrl?: string;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

type Strings = {
    preview: string;
    heading: string;
    body: (lockedAt: string) => React.ReactNode;
    fallbackAvailable: (releaseAfter?: string) => React.ReactNode;
    warning: string;
    button: string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'Recovery PIN locked',
    heading: 'Recovery PIN Locked',
    body: lockedAt => (
        <>
            Too many incorrect PIN attempts were made on <strong>{lockedAt}</strong>. The PIN is now
            disabled.
        </>
    ),
    fallbackAvailable: releaseAfter =>
        releaseAfter ? (
            <>
                The waiting-period recovery is still available and will complete on{' '}
                <strong>{releaseAfter}</strong> unless you cancel it.
            </>
        ) : (
            <>The waiting-period recovery is still available.</>
        ),
    warning: "If this wasn't you, cancel now.",
    button: "This wasn't me \u2014 Cancel recovery",
    sincerely: 'Sincerely,',
    subject: 'Recovery PIN locked',
};

const ES: Strings = {
    preview: 'PIN de recuperación bloqueado',
    heading: 'PIN de Recuperación Bloqueado',
    body: lockedAt => (
        <>
            Se realizaron demasiados intentos incorrectos de PIN el <strong>{lockedAt}</strong>. El
            PIN está ahora deshabilitado.
        </>
    ),
    fallbackAvailable: releaseAfter =>
        releaseAfter ? (
            <>
                La recuperación por periodo de espera sigue disponible y se completará el{' '}
                <strong>{releaseAfter}</strong> a menos que la canceles.
            </>
        ) : (
            <>La recuperación por periodo de espera sigue disponible.</>
        ),
    warning: 'Si no fuiste tú, cancélalo ahora.',
    button: 'No fui yo \u2014 Cancelar recuperación',
    sincerely: 'Atentamente,',
    subject: 'PIN de recuperación bloqueado',
};

const FR: Strings = {
    preview: 'Code PIN de récupération verrouillé',
    heading: 'Code PIN de Récupération Verrouillé',
    body: lockedAt => (
        <>
            Un trop grand nombre de tentatives de code PIN incorrectes ont eu lieu le{' '}
            <strong>{lockedAt}</strong>. Le code PIN est désormais désactivé.
        </>
    ),
    fallbackAvailable: releaseAfter =>
        releaseAfter ? (
            <>
                La récupération par délai d\u2019attente reste disponible et se terminera le{' '}
                <strong>{releaseAfter}</strong> sauf si vous l\u2019annulez.
            </>
        ) : (
            <>La récupération par délai d\u2019attente reste disponible.</>
        ),
    warning: 'Si ce n\u2019était pas vous, annulez dès maintenant.',
    button: 'Ce n\u2019était pas moi \u2014 Annuler la récupération',
    sincerely: 'Cordialement,',
    subject: 'Code PIN de récupération verrouillé',
};

const AR: Strings = {
    preview: 'تم قفل رمز PIN الخاص بالاستعادة',
    heading: 'تم قفل رمز PIN الخاص بالاستعادة',
    body: lockedAt => (
        <>
            تم إجراء عدة محاولات خاطئة لإدخال رمز PIN في <strong>{lockedAt}</strong>. تم الآن تعطيل
            رمز PIN.
        </>
    ),
    fallbackAvailable: releaseAfter =>
        releaseAfter ? (
            <>
                لا تزال الاستعادة بفترة الانتظار متاحة وستكتمل في <strong>{releaseAfter}</strong> ما
                لم تقم بإلغائها.
            </>
        ) : (
            <>لا تزال الاستعادة بفترة الانتظار متاحة.</>
        ),
    warning: 'إذا لم يكن هذا أنت، ألغِ الطلب الآن.',
    button: 'لم يكن أنا \u2014 إلغاء الاستعادة',
    sincerely: 'مع التحيات،',
    subject: 'تم قفل رمز PIN الخاص بالاستعادة',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const EscrowPinLocked: React.FC<EscrowPinLockedProps> = ({
    branding,
    lockedAt,
    releaseAfter,
    cancelUrl,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={s.preview}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.body(lockedAt)}</Text>

            <Text style={paragraph}>{s.fallbackAvailable(releaseAfter)}</Text>

            {cancelUrl && (
                <>
                    <Text style={warning}>{s.warning}</Text>

                    <Section style={buttonWrapper}>
                        <EmailButton href={cancelUrl} branding={branding}>
                            {s.button}
                        </EmailButton>
                    </Section>
                </>
            )}

            <Text style={signOff}>
                {s.sincerely}
                <br />
                {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                    brandName: branding.brandName,
                })}
            </Text>

            {cancelUrl && <LinkFallback href={cancelUrl} locale={locale} />}
        </Layout>
    );
};

export const getEscrowPinLockedSubject = (_branding: TenantBranding, locale?: string): string =>
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

const warning: React.CSSProperties = {
    ...paragraph,
    fontWeight: 600,
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
        <EscrowPinLocked
            branding={DEFAULT_BRANDING}
            lockedAt="September 25, 2026, 3:00 PM"
            releaseAfter="October 2, 2026, 3:00 PM"
            cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
        />
    );
}
