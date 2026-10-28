interface AccountState {
    currentUser: { uid?: string; privateKey?: string | null } | null;
    currentUserPK: string | null;
}

/** First key hydration is normal cold boot; losing/replacing an established principal is not. */
export const nativeAccountChanged = (next: AccountState, previous: AccountState): boolean => {
    if (!previous.currentUser) return false;
    if (!next.currentUser || next.currentUser.uid !== previous.currentUser.uid) return true;
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
