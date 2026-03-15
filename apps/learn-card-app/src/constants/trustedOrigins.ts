/**
 * Static trusted origins for Partner Connect SDK
 * These are partner domains that are trusted to communicate with LearnCard
 */

export const STATIC_TRUSTED_ORIGINS = [
    'https://computer8004.github.io', // Space Dodger game on GitHub Pages
];

/**
 * Get all trusted origins including static ones
 * @param dynamicOrigins - Origins dynamically extracted from embed URLs
 * @returns Combined array of static and dynamic trusted origins
 */
export function getAllTrustedOrigins(dynamicOrigins: string[]): string[] {
    return [...STATIC_TRUSTED_ORIGINS, ...dynamicOrigins];
}
