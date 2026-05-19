import type { ColorRef, FontRef, Theme } from './types';

/**
 * Resolve a `ColorRef` against a theme. Tokens are referenced as `$tokenName` matching a
 * key of `theme.colors`. Hex literals (`#RRGGBB`) and any other string are passed through
 * unchanged so authors can mix theme tokens with one-off colors.
 *
 * If a `$token` reference doesn't exist on the theme, the function returns the raw token
 * string (e.g. `$missing`) so the SVG renderer surfaces it visibly rather than silently
 * resolving to a default. This is a debug aid, not a runtime feature.
 */
export const resolveColor = (ref: ColorRef, theme: Theme): string => {
    if (!ref.startsWith('$')) return ref;
    const token = ref.slice(1) as keyof Theme['colors'];
    const resolved = theme.colors[token];
    return resolved ?? ref;
};

export const resolveFont = (ref: FontRef | string, theme: Theme): string => {
    if (ref === 'heading') return theme.fonts.heading;
    if (ref === 'body') return theme.fonts.body;
    return ref;
};

/**
 * The neutral default theme, used as the starting point for new templates and as the
 * fallback when a consumer doesn't supply one. Mirrors the grayscale + emerald palette
 * from `apps/learn-card-app/AGENTS.md` so designer output matches LearnCard's product
 * look out of the box.
 */
export const DEFAULT_THEME: Theme = {
    colors: {
        primary: '#18224E',
        secondary: '#353E64',
        accent: '#5FBE88',
        surface: '#FFFFFF',
        text: '#18224E',
        muted: '#8B91A7',
        border: '#E2E3E9',
        background: '#FBFBFC',
    },
    fonts: {
        heading: 'Poppins, Arial, sans-serif',
        body: 'Poppins, Arial, sans-serif',
    },
};
