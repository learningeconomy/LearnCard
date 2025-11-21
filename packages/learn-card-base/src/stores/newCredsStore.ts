import { createStore } from '@udecode/zustood';
import { CredentialCategory } from 'learn-card-base';

const EXCLUDE_CATEGORIES: CredentialCategory[] = [
    // These two are currently unclickable, so we'll exclude them for now
    'AI Pathway',
    'AI Insight',

    // AI Summary doesn't show up anywhere on the passport page (AI Sessions uses "AI Topics")
    'AI Summary',
];

export const newCredsStore = createStore('newCredsStore')<{
    newCreds: Partial<Record<CredentialCategory, string[]>>;
}>(
    {
        newCreds: {},
    },
    { persist: { name: 'newCredsStore', enabled: true } }
)
    .extendSelectors(state => ({
        // Get the count of new credentials for a specific category
        getNewCredsCount: (category: CredentialCategory) => state.newCreds[category]?.length ?? 0,

        // Check if there are any new credentials for a category
        hasNewCredentials: (category: CredentialCategory) =>
            (state.newCreds[category]?.length ?? 0) > 0 && !EXCLUDE_CATEGORIES.includes(category),

        // Get the total count of all new credentials across all non-excluded categories
        totalNewCredentialsCount: () =>
            Object.entries(state.newCreds).reduce(
                (sum, [category, uris]) =>
                    EXCLUDE_CATEGORIES.includes(category as CredentialCategory)
                        ? sum
                        : sum + (uris?.length ?? 0),
                0
            ),

        // Get all new credentials as a flat array
        getAllNewCreds: () => Object.values(state.newCreds).flat(),
    }))
    .extendActions(set => ({
        // Add new credential URIs to the store, grouped by category
        addNewCreds: (credsByCategory: Partial<Record<CredentialCategory, string[]>>) => {
            set.state(state => {
                const updatedCreds = { ...state.newCreds };

                // Add the new credentials to the existing ones, avoiding duplicates
                Object.entries(credsByCategory).forEach(([category, uris]) => {
                    const existingUris = updatedCreds[category as CredentialCategory] ?? [];
                    const uniqueNewUris = [...new Set(uris)]; // Remove duplicates from new URIs

                    // Only add URIs that aren't already in the store for this category
                    updatedCreds[category as CredentialCategory] = [
                        ...existingUris,
                        ...uniqueNewUris.filter(uri => !existingUris.includes(uri)),
                    ];
                });

                state.newCreds = updatedCreds;
            });
        },

        // Clear all new credentials for a specific category
        clearNewCreds: (category: CredentialCategory) => {
            set.state(state => {
                const updatedCreds = { ...state.newCreds };
                delete updatedCreds[category];
                state.newCreds = updatedCreds;
            });
        },

        // Clear all new credentials
        clearAllNewCreds: () => {
            set.state(state => {
                state.newCreds = {};
            });
        },

        // Remove specific credential URIs from newCreds
        removeCreds: (credentialUris: string[]) => {
            set.state(state => {
                const updatedCreds = { ...state.newCreds };

                // For each category in the store
                Object.entries(updatedCreds).forEach(([category, uris]) => {
                    if (uris) {
                        // Filter out any URIs that are in the credentialUris array
                        updatedCreds[category as CredentialCategory] = uris.filter(
                            uri => !credentialUris.includes(uri)
                        );

                        // Remove the category if it's now empty
                        if (updatedCreds[category as CredentialCategory]?.length === 0) {
                            delete updatedCreds[category as CredentialCategory];
                        }
                    }
                });

                state.newCreds = updatedCreds;
            });
        },
    }));

export default newCredsStore;
