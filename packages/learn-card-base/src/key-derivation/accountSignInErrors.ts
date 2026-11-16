/**
 * Dependency-free so UI (e.g. the auth error overlay) can recognise the error
 * without importing the Web3Auth SDK.
 */

/**
 * Coordinator error text when Web3Auth sign-in stops for an account that
 * already uses SSS. A stable id, not display copy: the overlay matches it and
 * shows its own localized "update the app" message.
 */
export const ACCOUNT_USES_NEWER_SIGN_IN_MESSAGE =
    'This account uses a newer way to sign in. Please update to the latest version of the app and sign in again.';
