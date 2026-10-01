/** Browser token storage with an authority/client-scoped, non-secret persistence preference. */
export const createKeycloakUserStorage = (
    authority: string,
    clientId: string,
    local: Storage,
    session: Storage
): { store: Storage; setSessionPersistence: (sessionOnly: boolean) => Promise<void> } => {
    const userKey = `oidc.user:${authority}:${clientId}`;
    const modeKey = `learncard.keycloak.persistence:${authority}:${clientId}`;
    const revisionKey = `${modeKey}:revision`;
    const isSession = (): boolean => local.getItem(modeKey) === 'session';
    const active = (): Storage => {
        const revision = local.getItem(revisionKey);
        if (session.getItem(revisionKey) !== revision) {
            // A different tab changed modes: never reuse this tab's pre-switch tokens.
            session.removeItem(userKey);
            if (revision === null) session.removeItem(revisionKey);
            else session.setItem(revisionKey, revision);
        }
        return isSession() ? session : local;
    };
    const inactive = (): Storage => (isSession() ? local : session);

    // Never resurrect a user from the wrong store, especially after a tab has closed.
    active();
    inactive().removeItem(userKey);

    return {
        // Resolve the preference on every access so older instances cannot write local tokens
        // after another tab/instance enables Shared Computer mode.
        store: {
            get length(): number {
                return active().length;
            },
            key: (index: number): string | null => active().key(index),
            getItem: (key: string): string | null => active().getItem(key),
            setItem: (key: string, value: string): void => active().setItem(key, value),
            removeItem: (key: string): void => active().removeItem(key),
            clear: (): void => active().clear(),
        },
        setSessionPersistence: async (sessionOnly: boolean): Promise<void> => {
            const source = active();
            const target = sessionOnly ? session : local;
            if (source !== target) {
                const user = source.getItem(userKey);
                if (user === null) target.removeItem(userKey);
                else target.setItem(userKey, user);
                const revision = crypto.randomUUID();
                local.setItem(revisionKey, revision);
                session.setItem(revisionKey, revision);
            }
            // All browser storage operations are synchronous: SDK writes cannot interleave.
            local.setItem(modeKey, sessionOnly ? 'session' : 'local');
            inactive().removeItem(userKey);
        },
    };
};
