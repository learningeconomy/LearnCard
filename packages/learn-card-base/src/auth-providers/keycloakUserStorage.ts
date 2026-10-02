/** Browser token storage with an authority/client-scoped, non-secret persistence preference. */
export const createKeycloakUserStorage = (
    authority: string,
    clientId: string,
    local: Storage,
    session: Storage
): { store: Storage; setSessionPersistence: (sessionOnly: boolean) => Promise<void> } => {
    const userKey = `oidc.user:${authority}:${clientId}`;
    const modeKey = `learncard.keycloak.persistence:${authority}:${clientId}`;
    // Pin the choice to this tab, including across redirects and reloads.
    let sessionOnly = (session.getItem(modeKey) ?? local.getItem(modeKey)) === 'session';
    session.setItem(modeKey, sessionOnly ? 'session' : 'local');
    const isSession = (): boolean => sessionOnly;
    const active = (): Storage => (isSession() ? session : local);
    const inactive = (): Storage => (isSession() ? local : session);

    // Never resurrect a user from the wrong store, especially after a tab has closed.
    active();
    inactive().removeItem(userKey);

    return {
        // Another tab's preference must never move this session's tokens.
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
        setSessionPersistence: async (nextSessionOnly: boolean): Promise<void> => {
            const source = active();
            const target = nextSessionOnly ? session : local;
            if (source !== target) {
                const user = source.getItem(userKey);
                if (user === null) target.removeItem(userKey);
                else target.setItem(userKey, user);
            }
            // All browser storage operations are synchronous: SDK writes cannot interleave.
            session.setItem(modeKey, nextSessionOnly ? 'session' : 'local');
            local.setItem(modeKey, nextSessionOnly ? 'session' : 'local');
            sessionOnly = nextSessionOnly;
            inactive().removeItem(userKey);
        },
    };
};
