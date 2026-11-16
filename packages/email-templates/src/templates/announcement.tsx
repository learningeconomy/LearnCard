import { SHARED, interpolate, resolveCatalogLocale } from '../i18n';
import { Img, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { DEFAULT_BRANDING, type TenantBranding } from '../branding';
import { Layout } from '../components/Layout';
import { EmailButton } from '../components/EmailButton';
import { LinkFallback } from '../components/LinkFallback';
import type { AnnouncementData } from '../render';

const announcementChrome = {
    en: {
        disclaimer: 'Manage product announcements in your privacy settings.',
        unsubscribe: 'Unsubscribe from product announcements',
    },
    es: {
        disclaimer: 'Gestiona los anuncios del producto en tus ajustes de privacidad.',
        unsubscribe: 'Cancelar la suscripción a los anuncios del producto',
    },
    fr: {
        disclaimer: 'Gérez les annonces du produit dans vos paramètres de confidentialité.',
        unsubscribe: 'Se désinscrire des annonces du produit',
    },
    ar: {
        disclaimer: 'يمكنك إدارة إعلانات المنتج في إعدادات الخصوصية.',
        unsubscribe: 'إلغاء الاشتراك في إعلانات المنتج',
    },
};

/** Plain-text authored announcement content, escaped by React. */
export interface AnnouncementProps extends AnnouncementData {
    branding: TenantBranding;
    locale?: string;
}

export const Announcement: React.FC<AnnouncementProps> = ({
    branding,
    locale,
    title,
    body,
    heroImageUrl,
    ctaLabel,
    ctaUrl,
    unsubscribeUrl,
}) => (
    <Layout
        branding={branding}
        {...(locale === undefined ? {} : { locale })}
        preview={title}
        disclaimer={announcementChrome[resolveCatalogLocale(locale)].disclaimer}
    >
        {heroImageUrl && (
            <Img
                src={heroImageUrl}
                alt=""
                width="520"
                style={{ width: '100%', height: 'auto', marginBottom: 24 }}
            />
        )}
        <Text style={{ fontSize: 24, fontWeight: 600, color: '#111827' }}>{title}</Text>
        <Text
            style={{ fontSize: 16, lineHeight: '24px', whiteSpace: 'pre-line', color: '#374151' }}
        >
            {body}
        </Text>
        {ctaUrl && (
            <Section style={{ margin: '24px 0' }}>
                <EmailButton href={ctaUrl} branding={branding}>
                    {ctaLabel}
                </EmailButton>
            </Section>
        )}
        <Text>
            {interpolate(SHARED[resolveCatalogLocale(locale)].teamSignature, {
                brandName: branding.brandName,
            })}
        </Text>
        {ctaUrl && <LinkFallback href={ctaUrl} {...(locale === undefined ? {} : { locale })} />}
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
            <Link href={unsubscribeUrl}>
                {announcementChrome[resolveCatalogLocale(locale)].unsubscribe}
            </Link>
        </Text>
    </Layout>
);

/** Default subject; services may supply the separately authored campaign subject. */
export const getAnnouncementSubject = (data: AnnouncementData): string => data.title;

export default function Preview(): React.ReactElement {
    return (
        <Announcement
            branding={DEFAULT_BRANDING}
            title="Explore what’s new"
            body="Discover new ways to share your learning."
            ctaLabel="Explore"
            ctaUrl="https://learncard.app/m/new-features"
            unsubscribeUrl="https://learncard.app/unsubscribe?token=preview"
        />
    );
}
