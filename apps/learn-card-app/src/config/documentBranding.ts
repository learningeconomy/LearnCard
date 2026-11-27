/** Tenant names the document head needs before any script runs (title, iOS home-screen title). */
export type DocumentBranding = { title: string; appleTitle: string };

export const DEFAULT_DOCUMENT_BRANDING: DocumentBranding = { title: 'LearnCard', appleTitle: 'LC' };

export const documentBrandingFor = (
    branding: { name?: string; shortName?: string } | undefined
): DocumentBranding =>
    branding?.name
        ? { title: branding.name, appleTitle: branding.shortName ?? branding.name }
        : DEFAULT_DOCUMENT_BRANDING;
