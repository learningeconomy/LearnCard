/**
 * Render-layer i18n helper for mobile nav bar link labels.
 *
 * Nav link labels come from theme config (`link.label`) and cannot be
 * wrapped with `m[...]()` inline. This helper maps the link's stable
 * `id` to the existing `sidemenu.links.*` catalog key, falling back to
 * the static `link.label` when no translation exists.
 */
import * as m from '../../paraglide/messages.js';

export const getNavBarLinkLabel = (link: {
    id?: string | number | null;
    label?: string | null;
}): string => {
    const id = link.id == null ? undefined : String(link.id);

    switch (id) {
        case 'dashboard':
            return m['sidemenu.links.dashboard']();
        case 'launchpad':
            return m['sidemenu.links.launchPadShort']();
        case 'wallet':
            return m['sidemenu.links.passport']();
        default:
            return link.label ?? '';
    }
};
