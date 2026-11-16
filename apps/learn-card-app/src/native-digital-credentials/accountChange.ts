interface AccountState {
    currentUser: { uid?: string; privateKey?: string | null } | null;
    currentUserPK: string | null;
}

/** First key hydration is normal cold boot; losing/replacing an established principal is not. */
export const nativeAccountChanged = (next: AccountState, previous: AccountState): boolean => {
    if (!previous.currentUser) return false;
    if (!next.currentUser) return true;
    // A cached profile without any signing key is not an established principal.
    // Seed/email restoration may replace its provider UID; presentation preparation
    // still verifies the restored wallet against the persisted credential owner.
    const established = Boolean(previous.currentUser.privateKey || previous.currentUserPK);
    if (established && next.currentUser.uid !== previous.currentUser.uid) return true;
    return Boolean(
        (previous.currentUser.privateKey &&
            next.currentUser.privateKey &&
            next.currentUser.privateKey !== previous.currentUser.privateKey) ||
        (previous.currentUserPK &&
            next.currentUserPK &&
            next.currentUserPK !== previous.currentUserPK) ||
        ((previous.currentUser.privateKey || previous.currentUserPK) &&
            !next.currentUser.privateKey &&
            !next.currentUserPK)
    );
};
