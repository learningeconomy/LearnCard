import { createStore } from '@udecode/zustood';

// Enough time to complete sign-in and onboarding, without resuming old claims days later.
export const LCN_REDIRECT_TTL_MS = 30 * 60 * 1000;

export const redirectStore = createStore('redirectStore')<{
    /** Activity-local destination: never persist an Android request into a later app launch. */
    requestRedirect: { requestId: string; destination: string; createdAt: number } | null;
    authRedirect: string | null;
    lcnRedirect: string | null;
    lcnRedirectCreatedAt: number | null;
    email: string | null;
    installIntent: { listingId: string; appName: string; appIcon?: string } | null;
    isOnboardingOpen: boolean;
}>(
    {
        requestRedirect: null,
        authRedirect: null,
        lcnRedirect: null,
        lcnRedirectCreatedAt: null,
        email: null,
        installIntent: null,
        isOnboardingOpen: false,
    },
    {
        persist: {
            name: 'redirectStore',
            enabled: true,
            partialize: state => ({
                authRedirect: state.authRedirect,
                lcnRedirect: state.lcnRedirect,
                lcnRedirectCreatedAt: state.lcnRedirectCreatedAt,
                email: state.email,
                installIntent: state.installIntent,
                // All persistable fields must be listed explicitly here.
                // isOnboardingOpen intentionally excluded — resets to false on reload.
            }),
        },
    }
)
    .extendActions(set => ({
        lcnRedirect: (destination: string | null) => {
            set.state(state => {
                state.requestRedirect = null;
                state.lcnRedirectCreatedAt = destination ? Date.now() : null;
                state.lcnRedirect = destination;
            });
        },
        requestRedirect: (requestId: string, destination: string) => {
            set.state(state => {
                state.requestRedirect = { requestId, destination, createdAt: Date.now() };
            });
        },
        clearRequestRedirect: (requestId: string) => {
            set.state(state => {
                if (state.requestRedirect?.requestId === requestId) state.requestRedirect = null;
            });
        },
    }))
    .extendSelectors(state => ({
        // Legacy persisted destinations without a timestamp are deliberately expired.
        lcnRedirect: () => {
            const request = state.requestRedirect;
            if (request) {
                const age = Date.now() - request.createdAt;
                if (age >= 0 && age < LCN_REDIRECT_TTL_MS) return request.destination;
            }
            // Upgrade cleanup: older builds persisted an activity-local destination.
            if (state.lcnRedirect === '/native-digital-credentials') return null;
            const createdAt = state.lcnRedirectCreatedAt;
            const age = createdAt == null ? Infinity : Date.now() - createdAt;
            return age >= 0 && age < LCN_REDIRECT_TTL_MS ? state.lcnRedirect : null;
        },
    }));

export const useAuthRedirect = redirectStore.use.authRedirect;
export const useInstallIntent = redirectStore.use.installIntent;
export const useIsOnboardingOpen = redirectStore.use.isOnboardingOpen;

export default redirectStore;
