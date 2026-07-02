import * as m from '../../../paraglide/messages.js';

// Resolved at call time (render), so the locale is never frozen at module load.
export const getProfileTypeDisplayText = (profileType: 'service' | 'parent' | 'child' | null) => {
    switch (profileType) {
        case 'service':
            return m['adminTools.roles.organization']();
        case 'parent':
            return m['adminTools.roles.user']();
        case 'child':
            return m['adminTools.roles.child']();
        default:
            return m['adminTools.roles.user']();
    }
};
