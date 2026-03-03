import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

export const getStatusBarColor = (path?: string, branding?: BrandingEnum): string => {
    if (branding === BrandingEnum.scoutPass) {
        if (path === '/badges') {
            return 'sp-purple-base';
        } else if (path === '/boosts' || path === '/socialBadges') {
            return 'sp-blue-ocean';
        } else if (path === '/memberships' || path === '/troops') {
            return 'sp-green-forest';
        }
    }

    if (path === 'home' || path === '/') {
        return 'light';
    } else if (path === '/wallet') {
        return 'light';
    } else if (path === '/notifications') {
        return 'light';
    } else if (path === '/achievements') {
        return 'pink-400';
    } else if (path === '/currencies' || path === '/socialBadges') {
        return 'blue-400';
    } else if (path === '/ids') {
        return 'blue-400';
    } else if (path === '/workhistory') {
        return 'cyan-401';
    } else if (path === '/skills') {
        return 'light';
    } else if (path === '/learninghistory') {
        return 'emerald-401';
    } else if (path === '/jobs') {
        return 'light';
    } else if (path === '/memberships') {
        return 'teal-400';
    } else if (path === '/claim/boost') {
        return 'light';
    } else if (path === '/accomplishments') {
        return 'yellow-400';
    } else if (path === '/accommodations') {
        return 'violet-500';
    } else if (path === '/families') {
        return 'amber-400';
    } else if (path?.includes('/contacts')) {
        return 'grayscale-100';
    }

    return 'light';
};
