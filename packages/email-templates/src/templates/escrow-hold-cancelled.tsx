/**
 * EscrowHoldCancelled — confirms that a pending account recovery request was
 * cancelled and no further action will be taken.
 *
 * Used by: lca-api recovery hold routes (templateId: 'escrow-hold-cancelled')
 */

import { Text } from '@react-email/components';
import * as React from 'react';

import type { TenantBranding } from '../branding';
import { DEFAULT_BRANDING } from '../branding';
import { Layout } from '../components/Layout';
import type { NotificationLocale } from '../i18n';
import { resolveCatalogLocale, interpolate, SHARED } from '../i18n';

/** Why the pending recovery request was cancelled. */
export type EscrowHoldCancelledReason = 'user' | 'superseded' | 'pin-locked' | 'release-failed';

export interface EscrowHoldCancelledProps {
    branding: TenantBranding;
    /** Human-readable timestamp the request was cancelled. */
    cancelledAt: string;
    /** Why the request was cancelled. Omit for a generic message. */
    reason?: EscrowHoldCancelledReason;
    /** Recipient locale (BCP-47). Defaults to English. */
    locale?: string;
}

type Strings = {
    preview: string;
    heading: string;
    body: (cancelledAt: string) => React.ReactNode;
    reasonText: (reason?: EscrowHoldCancelledReason) => string;
    sincerely: string;
    subject: string;
};

const EN: Strings = {
    preview: 'Your recovery request was cancelled',
    heading: 'Recovery Request Cancelled',
    body: cancelledAt => (
        <>
            Your account recovery request was cancelled on <strong>{cancelledAt}</strong>.
        </>
    ),
    reasonText: reason => {
        switch (reason) {
            case 'user':
                return 'You cancelled this request. No further action is needed.';
            case 'superseded':
                return 'A newer recovery request replaced this one.';
            case 'pin-locked':
                return 'This request was cancelled after too many incorrect PIN attempts.';
            case 'release-failed':
                return 'This request could not be completed and was cancelled automatically.';
            default:
                return 'No further action is needed.';
        }
    },
    sincerely: 'Sincerely,',
    subject: 'Recovery request cancelled',
};

const ES: Strings = {
    preview: 'Se canceló tu solicitud de recuperación',
    heading: 'Solicitud de Recuperación Cancelada',
    body: cancelledAt => (
        <>
            Tu solicitud de recuperación de cuenta se canceló el <strong>{cancelledAt}</strong>.
        </>
    ),
    reasonText: reason => {
        switch (reason) {
            case 'user':
                return 'Cancelaste esta solicitud. No se requiere ninguna otra acción.';
            case 'superseded':
                return 'Una solicitud de recuperación más reciente reemplazó a esta.';
            case 'pin-locked':
                return 'Esta solicitud se canceló tras demasiados intentos incorrectos de PIN.';
            case 'release-failed':
                return 'Esta solicitud no pudo completarse y se canceló automáticamente.';
            default:
                return 'No se requiere ninguna otra acción.';
        }
    },
    sincerely: 'Atentamente,',
    subject: 'Solicitud de recuperación cancelada',
};

const FR: Strings = {
    preview: 'Votre demande de récupération a été annulée',
    heading: 'Demande de Récupération Annulée',
    body: cancelledAt => (
        <>
            Votre demande de récupération de compte a été annulée le <strong>{cancelledAt}</strong>.
        </>
    ),
    reasonText: reason => {
        switch (reason) {
            case 'user':
                return 'Vous avez annulé cette demande. Aucune autre action n\u2019est nécessaire.';
            case 'superseded':
                return 'Une demande de récupération plus récente a remplacé celle-ci.';
            case 'pin-locked':
                return 'Cette demande a été annulée après trop de tentatives de code PIN incorrectes.';
            case 'release-failed':
                return 'Cette demande n\u2019a pas pu aboutir et a été annulée automatiquement.';
            default:
                return 'Aucune autre action n\u2019est nécessaire.';
        }
    },
    sincerely: 'Cordialement,',
    subject: 'Demande de récupération annulée',
};

const AR: Strings = {
    preview: 'تم إلغاء طلب الاستعادة الخاص بك',
    heading: 'تم إلغاء طلب الاستعادة',
    body: cancelledAt => (
        <>
            تم إلغاء طلب استعادة حسابك في <strong>{cancelledAt}</strong>.
        </>
    ),
    reasonText: reason => {
        switch (reason) {
            case 'user':
                return 'لقد ألغيت هذا الطلب. لا حاجة لأي إجراء آخر.';
            case 'superseded':
                return 'حلّ طلب استعادة أحدث محل هذا الطلب.';
            case 'pin-locked':
                return 'تم إلغاء هذا الطلب بعد عدة محاولات خاطئة لإدخال رمز PIN.';
            case 'release-failed':
                return 'تعذّر إكمال هذا الطلب وتم إلغاؤه تلقائيًا.';
            default:
                return 'لا حاجة لأي إجراء آخر.';
        }
    },
    sincerely: 'مع التحيات،',
    subject: 'تم إلغاء طلب الاستعادة',
};

const STRINGS: Record<NotificationLocale, Strings> = { en: EN, es: ES, fr: FR, ar: AR };

export const EscrowHoldCancelled: React.FC<EscrowHoldCancelledProps> = ({
    branding,
    cancelledAt,
    reason,
    locale,
}) => {
    const s = STRINGS[resolveCatalogLocale(locale)];

    return (
        <Layout branding={branding} locale={locale} preview={s.preview}>
            <Text style={heading}>{s.heading}</Text>

            <Text style={paragraph}>{s.body(cancelledAt)}</Text>

            <Text style={paragraph}>{s.reasonText(reason)}</Text>

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

export const getEscrowHoldCancelledSubject = (_branding: TenantBranding, locale?: string): string =>
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
        <EscrowHoldCancelled
            branding={DEFAULT_BRANDING}
            cancelledAt="September 26, 2026, 9:15 AM"
            reason="user"
        />
    );
}
