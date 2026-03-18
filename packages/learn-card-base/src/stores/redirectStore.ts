import { createStore } from '@udecode/zustood';

export const redirectStore = createStore('redirectStore')<{
    authRedirect: string | null;
    lcnRedirect: string | null;
    email: string | null;
    installIntent: { listingId: string; appName: string } | null;
    isOnboardingOpen: boolean;
}>(
    {
        authRedirect: null,
        lcnRedirect: null,
        email: null,
        installIntent: null,
        isOnboardingOpen: false,
    },
    {
        persist: {
            name: 'redirectStore',
            enabled: true,
            partialize: (state) => ({
                authRedirect: state.authRedirect,
                lcnRedirect: state.lcnRedirect,
                email: state.email,
                installIntent: state.installIntent,
                // All persistable fields must be listed explicitly here.
                // isOnboardingOpen intentionally excluded — resets to false on reload.
            }),
        },
    }
);

export const useAuthRedirect = redirectStore.use.authRedirect;
export const useInstallIntent = redirectStore.use.installIntent;
export const useIsOnboardingOpen = redirectStore.use.isOnboardingOpen;

export default redirectStore;
