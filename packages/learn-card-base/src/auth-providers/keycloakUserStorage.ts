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
    const isSession = (): boolean => session.getItem(modeKey) === 'session';
    const active = (): Storage => {
        const revision = local.getItem(revisionKey);
        if (session.getItem(revisionKey) !== revision) {
            session.removeItem(userKey);
            if (revision === null) session.removeItem(revisionKey);
            else session.setItem(revisionKey, revision);
        }
        // Share mode changes within a tab. Other tabs may tighten persistence,
        // but only an explicit choice in this tab may move its tokens to local.
        if (local.getItem(modeKey) === 'session') session.setItem(modeKey, 'session');
        else if (session.getItem(modeKey) === null) session.setItem(modeKey, 'local');
        return isSession() ? session : local;
    };
    const inactive = (): Storage => (isSession() ? local : session);
    const invalidateOtherTabs = (): void => {
        const revision = crypto.randomUUID();
        local.setItem(revisionKey, revision);
        session.setItem(revisionKey, revision);
    };

    // Never resurrect a user from the wrong store, especially after a tab has closed.
    active();
    if (!isSession() || local.getItem(modeKey) === 'session') inactive().removeItem(userKey);

    return {
        // Another tab's preference must never move this session's tokens.
        store: {
            get length(): number {
                return active().length;
            },
            key: (index: number): string | null => active().key(index),
            getItem: (key: string): string | null => active().getItem(key),
            setItem: (key: string, value: string): void => active().setItem(key, value),
            removeItem: (key: string): void => {
                active().removeItem(key);
                if (key === userKey) invalidateOtherTabs();
            },
            clear: (): void => {
                const target = active();
                target.clear();
                session.setItem(modeKey, target === session ? 'session' : 'local');
                invalidateOtherTabs();
            },
        },
        setSessionPersistence: async (nextSessionOnly: boolean): Promise<void> => {
            const source = active();
            const target = nextSessionOnly ? session : local;
            const nextMode = nextSessionOnly ? 'session' : 'local';
            const modeChanged = source !== target || local.getItem(modeKey) !== nextMode;
            if (source !== target) {
                const user = source.getItem(userKey);
                if (user === null) target.removeItem(userKey);
                else target.setItem(userKey, user);
            }
            // All browser storage operations are synchronous: SDK writes cannot interleave.
            session.setItem(modeKey, nextMode);
            local.setItem(modeKey, nextMode);
            if (modeChanged) invalidateOtherTabs();
            inactive().removeItem(userKey);
        },
    };
};
