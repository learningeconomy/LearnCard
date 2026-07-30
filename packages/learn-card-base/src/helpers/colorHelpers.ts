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

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

const hexToRgb = (hex: string): { r: number; g: number; b: number } | undefined => {
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3)
        h = h
            .split('')
            .map(c => c + c)
            .join('');
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return undefined;
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const rgbToHex = (r: number, g: number, b: number): string =>
    '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h / 6, s, l];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    if (s === 0) return [l * 255, l * 255, l * 255];
    const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
};

/** Derive a harmonious badge-ring accent from a background color (same hue, deeper shade). Returns undefined for invalid input. */
export const deriveAccentColor = (backgroundColor?: string | null): string | undefined => {
    if (!backgroundColor) return undefined;
    const rgb = hexToRgb(backgroundColor);
    if (!rgb) return undefined;
    const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const targetL = clamp(l <= 0.28 ? l + 0.16 : l - 0.24, 0.16, 0.82);
    const targetS = clamp(s + 0.12, 0, 1);
    const [r, g, b] = hslToRgb(h, targetS, targetL);
    return rgbToHex(r, g, b);
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
        path?.startsWith('/launchpad') ||
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
        path?.includes('/ai/topics') ||
        path?.startsWith('/pathways')
    ) {
        return 'text-black';
    }

    if (path?.includes('/consent-flow')) {
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
