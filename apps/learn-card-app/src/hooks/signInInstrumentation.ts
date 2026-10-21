/** App-owned bookkeeping at the adapter's pre-credential-sync success boundary. */
const googleSignedInListeners = new Set<() => void>();

export const onGoogleSignedIn = (callback: () => void): (() => void) => {
    googleSignedInListeners.add(callback);
    return (): void => {
        googleSignedInListeners.delete(callback);
    };
};

export const notifyGoogleSignedIn = (): void => {
    googleSignedInListeners.forEach(callback => callback());
};
