/**
 * App Store Admin Configuration
 *
 * Profile IDs listed here have administrative privileges for the App Store,
 * including the ability to approve/reject listings and set promotion levels.
 *
 * Set via APP_STORE_ADMIN_PROFILE_IDS environment variable as a comma-separated list.
 * Example: APP_STORE_ADMIN_PROFILE_IDS=profile-id-1,profile-id-2
 */
export const APP_STORE_ADMIN_PROFILE_IDS: string[] = (
    process.env.APP_STORE_ADMIN_PROFILE_IDS ?? ''
)
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

/**
 * Check if a profile has App Store admin privileges
 */
export const isAppStoreAdmin = (profileId: string): boolean => {
    return APP_STORE_ADMIN_PROFILE_IDS.includes(profileId);
};
