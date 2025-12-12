import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

export const getNavBarColor = (path?: string, branding?: BrandingEnum): string => {
    if (branding === BrandingEnum.scoutPass) {
        if (path === '/currencies' || path === '/socialBadges' || path === '/badges') {
            return 'bg-sp-purple-lighter';
        } else if (path === '/boosts') {
            return 'bg-sp-blue-dark-ocean';
        } else if (path === '/memberships' || path === '/troops') {
            return 'bg-sp-green-light';
        } else if (path?.includes('/share-boost')) {
            return 'bg-sp-purple-base';
        } else if (path === '/notifications') {
            return 'bg-grayscale-100';
        }
    }
    if (path === '/campfire') {
        return 'bg-scouts-pattern';
    } else if (path === '/home' || path === '/') {
        return 'bg-cyan-100';
    } else if (path === '/wallet') {
        return 'bg-white';
    } else if (path === '/notifications') {
        return 'bg-white';
    } else if (path === '/achievements') {
        return 'bg-pink-300';
    } else if (path === '/currencies' || path === '/socialBadges') {
        return 'bg-blue-300';
    } else if (path === '/ids') {
        return 'bg-blue-300';
    } else if (path === '/workhistory') {
        return 'bg-blue-200';
    } else if (path === '/skills') {
        return 'bg-violet-200';
    } else if (path === '/learninghistory') {
        return 'bg-emerald-400';
    } else if (path === '/lc-preview') {
        return 'bg-cyan-100';
    } else if (path?.includes('/share-boost')) {
        return 'bg-grayscale-900';
    } else if (path?.includes('/memberships')) {
        return 'bg-teal-300';
    } else if (path === '/accommodations') {
        return 'bg-violet-300';
    } else if (path === '/accomplishments') {
        return 'bg-yellow-300';
    } else if (path === '/families') {
        return 'bg-amber-300';
    }

    return 'bg-white';
};

export const getActiveSideBarTab = (path?: string, activeTab?: string): boolean => {
    if (path === activeTab) return true;

    return false;
};

export const showNavBar = (path?: string): boolean => {
    if (
        path === '/wallet-worker' ||
        path === '/store' ||
        path === '/get' ||
        path === '/sync-my-school' ||
        path === '/sync-my-school-simple' ||
        path === '/sync-my-school/success' ||
        path === '/chats' ||
        path?.includes('/claim/from-dashboard') ||
        path?.includes('/request') ||
        path?.includes('/consent-flow') ||
        path?.includes('/did-auth') ||
        (path?.includes('/boost') && path !== '/boosts') ||
        path?.includes('/select-credentials') ||
        path?.includes('/share-boost') ||
        path?.includes('/app-store')
    ) {
        return false;
    }

    return true;
};
