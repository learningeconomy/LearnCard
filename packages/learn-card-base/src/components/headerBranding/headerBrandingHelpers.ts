// Note: tab routes must include leading slash
export const lcRoutes = {
    // tab1: "/home",
    // tab2: "/lc-preview",
    tab1: '/passport',
    tab2: '/boost',
    tab3: '/launchpad',
};

// Note: tab routes must include leading slash
export const mvRoutes = {
    tab1: '/jobs',
    tab2: '/wallet',
    tab3: '/notifications',
};

export enum BrandingEnum {
    learncard = 'learncard',
    metaversity = 'metaversity',
    scoutPass = 'scoutPass',

    // plaidLibs apps - branding names must align with whitelabel name settings at https://cms.madlib.ai/admin/content/Apps
    'PlaidLibs' = 'PlaidLibs',
    'PlaidLibs Dev' = 'PlaidLibs Dev',
    'Daily Wizard' = 'Daily Wizard',
    'Daily Wizard Dev' = 'Daily Wizard Dev',
    'Bedtime Tales' = 'Bedtime Tales',
    'Bedtime Tales Dev' = 'Bedtime Tales Dev',
    'Dev Test App' = 'Dev Test App',
    'Asana Buddy' = 'Asana Buddy',
    'Dev Apps' = 'Dev Apps',
    'ClimbUp' = 'ClimbUp',
    'OmWriter' = 'OmWriter',
}

export const BRANDING_TO_TAB = {
    [BrandingEnum.metaversity]: mvRoutes,
    [BrandingEnum.learncard]: lcRoutes,
};

export const getLearnCardHeaderBrandingColors = (path: string = '/') => {
    if (
        path === '/home' ||
        path === '/passport' ||
        path === '/' ||
        path === '/passport' ||
        path === '/wallet' ||
        path === '/notifications' ||
        path === '/lc-preview' ||
        path.includes('/connect') ||
        path === '/invite' ||
        path === '/claim/boost' ||
        path.includes('/share-boost') ||
        path === '/launchpad' ||
        path.includes('/contacts') ||
        path.includes('/skills') ||
        path === '/ai/insights'
    ) {
        return 'text-grayscale-900';
    }

    return 'text-white';
};

export const getMetaversityHeaderBrandingColors = (path: string = '/') => {
    if (
        path === '/workhistory' ||
        path === '/' ||
        path === '/wallet' ||
        path === '/jobs' ||
        path === '/notifications' ||
        path === '/launchpad'
    ) {
        return '';
    }

    // text-white for some reason doesn't overwrite the existing color class...
    return 'text-gray-50';
};

export const getScoutPassBrandingColors = (path: string = '/') => {
    if (
        path === '/workhistory' ||
        path === '/' ||
        path === '/wallet' ||
        path === '/jobs' ||
        path === '/notifications' ||
        path === '/launchpad' ||
        path === '/campfire' ||
        path.includes('/connect') ||
        path === '/invite' ||
        path === '/claim/boost' ||
        path.includes('/share-boost') ||
        path.includes('/contacts')
    ) {
        return 'text-sp-purple-base';
    }

    // text-white for some reason doesn't overwrite the existing color class...
    return 'text-white';
};

export const getHeaderBrandingColor = (
    branding: BrandingEnum = BrandingEnum.learncard,
    path: string = '/'
) => {
    if (branding === BrandingEnum.metaversity) {
        return getMetaversityHeaderBrandingColors(path);
    }

    if (branding === BrandingEnum.scoutPass) {
        return getScoutPassBrandingColors(path);
    }

    return getLearnCardHeaderBrandingColors(path);
};
