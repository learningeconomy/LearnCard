import { CredentialDisplayValidator } from '@learncard/types';

/** Display-only anchors distinguish an omitted public name from the generic list label. */
export const getPublicBoostDisplayName = (
    boost: { boost: string; name?: string } | null | undefined
): string | undefined => {
    if (!boost) return undefined;
    const template: unknown = JSON.parse(boost.boost);
    if (template && typeof template === 'object' && 'display' in template) {
        return CredentialDisplayValidator.parse(template.display).name;
    }
    // Explicit reusable Boost/CMS metadata retains its existing public contract.
    return boost.name;
};
