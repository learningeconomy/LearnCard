/**
 * Resolves the redirect that should follow a completed onboarding signup.
 *
 * Only in-app absolute paths are resumed — an external or protocol-relative
 * value is ignored so a stale/tampered store value can never turn signup into
 * an open redirect. Returns null when there is nothing safe to resume.
 */
export const resolvePostOnboardingRedirect = (pendingRedirect: unknown): string | null => {
    if (typeof pendingRedirect !== 'string') return null;

    const trimmed = pendingRedirect.trim();

    if (
        !trimmed.startsWith('/') ||
        trimmed.startsWith('//') ||
        trimmed.includes('\\') ||
        Array.from(trimmed).some(character => character.charCodeAt(0) < 32)
    )
        return null;

    return trimmed;
};
