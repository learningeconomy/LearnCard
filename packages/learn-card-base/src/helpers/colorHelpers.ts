import { CredentialCategoryEnum } from 'learn-card-base';

const baseColors: string[] = [
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-spice-500',
    'bg-yellow-400',
];

export const getRandomBaseColor = (): string => {
    return baseColors[Math.floor(Math.random() * baseColors.length)];
};

const LIGHT_OR_EMPTY_BG = /^(|bg-white|bg-(grayscale|gray|neutral|stone|zinc|slate)-(50|100|200))$/;

export const ensureVisibleBaseColor = (color?: string | null): string => {
    if (!color || LIGHT_OR_EMPTY_BG.test(color)) return 'bg-indigo-500';
    return color;
};

export const getNotificationButtonColor = (path?: string) => {
    if (
        path === '/passport' ||
        path === '/home' ||
        path === '/jobs' ||
        path === '/wallet' ||
        path === '/lc-preview' ||
        path === '/notifications' ||
        path === '/campfire' ||
        path === '/contacts' ||
        path === '/share-boost' ||
        path === '/verify/resume' ||
        path === '/invite' ||
        path === '/connect' ||
        path === '/skills' ||
        path?.includes('/admin-tools') ||
        path?.includes('/ai/insights') ||
        path?.includes('/ai/chat') ||
        path?.includes('/ai/pathways') ||
        path?.includes('/ai/topics')
    ) {
        return 'text-black';
    }

    if (path === '/launchpad' || path?.includes('/consent-flow')) {
        return 'hidden';
    }

    return 'text-white';
};

export const getCategorySpilledCupColors = (category: CredentialCategoryEnum) => {
    switch (category) {
        case CredentialCategoryEnum.socialBadge:
            return {
                backsplash: '#93C5FD',
                spill: '#0891B2',
                cupOutline: '#1D4ED8',
            };
        case CredentialCategoryEnum.learningHistory:
            return {
                backsplash: '#34D399',
                spill: '#A3E635',
                cupOutline: '#047857',
            };
        case CredentialCategoryEnum.achievement:
            return {
                backsplash: '#F9A8D4',
                spill: '#CA8A04',
                cupOutline: '#BE185D',
            };
        case CredentialCategoryEnum.accomplishment:
            return {
                backsplash: '#FDE047',
                spill: '#34D399',
                cupOutline: '#A16207',
            };
        case CredentialCategoryEnum.workHistory:
        case CredentialCategoryEnum.resume:
            return {
                backsplash: '#22D3EE',
                spill: '#EAB308',
                cupOutline: '#0E7490',
            };
        case CredentialCategoryEnum.accommodation:
            return {
                backsplash: '#C4B5FD',
                spill: '#EC4899',
                cupOutline: '#5B21B6',
            };
        case CredentialCategoryEnum.id:
            return {
                backsplash: '#93C5FD',
                spill: '#EC4899',
                cupOutline: '#1E40AF',
            };
        case CredentialCategoryEnum.family:
            return {
                backsplash: '#FBBF24',
                spill: '#22D3EE',
                cupOutline: '#92400E',
            };
        default:
            return {
                backsplash: '#FBCFE8',
                spill: '#E879F9',
                cupOutline: '#A21CAF',
            };
    }
};
