import type { UnifiedAuthState } from 'learn-card-base';

type AuthStatus = UnifiedAuthState['status'];

// Statuses the coordinator passes through while (re)initializing. The most
// important case: on a hard refresh the private-key-first path reaches 'ready'
// and builds the wallet BEFORE Firebase restores the session; when the real
// authProvider then replaces the noOp stub, the base coordinator is recreated
// and re-runs initialize(), briefly leaving 'ready' through these statuses.
// The already-built wallet (derived from the same cached private key) remains
// valid the whole time — tearing it down here is what used to flash the
// full-screen loader over the already-rendered app.
const TRANSITIONAL_AUTH_STATUSES: ReadonlySet<AuthStatus> = new Set<AuthStatus>([
    'authenticating',
    'authenticated',
    'checking_key_status',
    'deriving_key',
]);

/**
 * Whether an existing wallet must be torn down when the coordinator is in the
 * given status. Settled non-ready statuses (logout, setup, recovery,
 * migration, error) reset the wallet; transitional statuses keep it so a
 * background re-initialization never unmounts the running app.
 */
export const shouldResetWalletOnStatus = (status: AuthStatus): boolean =>
    status !== 'ready' && !TRANSITIONAL_AUTH_STATUSES.has(status);

/**
 * Backfill auth-session identity into the stored current user.
 *
 * On a hard refresh the wallet is built via the private-key-first path before
 * the Firebase session resolves, so currentUser.uid/email/phoneNumber start
 * empty. Previously the post-restore coordinator re-init rebuilt the wallet
 * (repopulating them as a side effect); now that the wallet survives, patch
 * the missing fields in place instead.
 *
 * Returns the updated user, or null when there is nothing to change.
 */
export const mergeAuthUserIntoCurrentUser = <
    T extends { uid: string; email: string; phoneNumber: string }
>(
    currentUser: T | null,
    authUser: { id: string; email?: string; phone?: string } | null | undefined
): T | null => {
    if (!currentUser || !authUser?.id) return null;

    const uid = currentUser.uid || authUser.id;
    const email = currentUser.email || authUser.email || '';
    const phoneNumber = currentUser.phoneNumber || authUser.phone || '';

    if (
        uid === currentUser.uid &&
        email === currentUser.email &&
        phoneNumber === currentUser.phoneNumber
    ) {
        return null;
    }

    return { ...currentUser, uid, email, phoneNumber };
};
