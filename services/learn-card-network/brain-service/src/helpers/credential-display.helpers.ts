import { CredentialDisplayValidator } from '@learncard/types';
import { isDisplayOnlyAnchorTemplate } from '@learncard/helpers';

/** Display-only anchors distinguish an omitted public name from the generic list label. */
export const getPublicBoostDisplayName = (
    boost: { boost: string; name?: string } | null | undefined
): string | undefined => {
    if (!boost) return undefined;
    const template: unknown = JSON.parse(boost.boost);
    if (isDisplayOnlyAnchorTemplate(template)) {
        return CredentialDisplayValidator.parse((template as { display?: unknown }).display).name;
    }
    // Explicit reusable Boost/CMS metadata retains its existing public contract.
    return boost.name;
};
