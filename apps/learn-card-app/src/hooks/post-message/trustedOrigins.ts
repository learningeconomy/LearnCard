/**
 * Utility for managing trusted origins for identity sharing
 * Stores origins that the user has consented to share their identity with
 */

const STORAGE_KEY = 'learncard_trusted_identity_origins';

interface TrustedOriginData {
    origin: string;
    consentedAt: number; // timestamp
    appName?: string;
}

/**
 * Get all trusted origins from localStorage
 */
export function getTrustedOrigins(): TrustedOriginData[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('[TrustedOrigins] Failed to parse trusted origins:', error);
        return [];
    }
}

/**
 * Check if an origin is trusted for identity sharing
 */
export function isOriginTrusted(origin: string): boolean {
    const trusted = getTrustedOrigins();
    return trusted.some(item => item.origin === origin);
}

/**
 * Add an origin to the trusted list
 */
export function addTrustedOrigin(origin: string, appName?: string): void {
    try {
        const trusted = getTrustedOrigins();
        
        // Check if already exists
        const existingIndex = trusted.findIndex(item => item.origin === origin);
        
        const newEntry: TrustedOriginData = {
            origin,
            consentedAt: Date.now(),
            appName,
        };
        
        if (existingIndex >= 0) {
            // Update existing entry
            trusted[existingIndex] = newEntry;
        } else {
            // Add new entry
            trusted.push(newEntry);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trusted));
        console.log('[TrustedOrigins] Added trusted origin:', origin);
    } catch (error) {
        console.error('[TrustedOrigins] Failed to add trusted origin:', error);
    }
}

/**
 * Remove an origin from the trusted list
 */
export function removeTrustedOrigin(origin: string): void {
    try {
        const trusted = getTrustedOrigins();
        const filtered = trusted.filter(item => item.origin !== origin);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        console.log('[TrustedOrigins] Removed trusted origin:', origin);
    } catch (error) {
        console.error('[TrustedOrigins] Failed to remove trusted origin:', error);
    }
}

/**
 * Clear all trusted origins
 */
export function clearTrustedOrigins(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[TrustedOrigins] Cleared all trusted origins');
    } catch (error) {
        console.error('[TrustedOrigins] Failed to clear trusted origins:', error);
    }
}
