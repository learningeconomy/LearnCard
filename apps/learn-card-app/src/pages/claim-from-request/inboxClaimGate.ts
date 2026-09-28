import type { AuthGateState } from 'learn-card-base/auth-status/authStatus';
import {
    hasNetworkProfile,
    shouldPromptProfileOnboarding,
} from 'learn-card-base/auth-status/authStatus';

/**
 * The only three things a Universal Inbox claim needs to know about the
 * current user's LCN profile. Deliberately collapses every "still resolving"
 * outcome (loading / error / offline / recovery / unauthenticated) into
 * `pending`, mirroring the canonical auth-status model: absence is asserted
 * positively, never inferred from missing data.
 */
export type InboxClaimProfileState = 'present' | 'absent' | 'pending';

export const deriveInboxClaimProfileState = (status: AuthGateState): InboxClaimProfileState => {
    if (hasNetworkProfile(status)) return 'present';
    if (shouldPromptProfileOnboarding(status)) return 'absent';
    return 'pending';
};

/**
 * Whether the VC-API exchange may begin.
 *
 * Universal Inbox deliveries are finalized against the recipient's LCN
 * profile (email/in-app refresh notifications), so the claim must not start
 * until that profile is confirmed. Generic VC-API/boost flows do not require
 * network membership and keep their previous behavior.
 */
export const canParticipateInExchange = ({
    isLoggedIn,
    isInboxClaim,
    profileState,
}: {
    isLoggedIn: boolean;
    isInboxClaim: boolean;
    profileState: InboxClaimProfileState;
}): boolean => {
    if (!isLoggedIn) return false;
    if (!isInboxClaim) return true;
    return profileState === 'present';
};

/**
 * Rebuilds the `/request?vc_request_url=…` link that must survive onboarding
 * so the preserved claim resumes once a profile exists. Returns null when the
 * exchange URL is missing rather than persisting a broken redirect.
 */
export const buildInboxClaimRedirect = (
    vcRequestUrl?: string | (string | null)[] | null
): string | null => {
    const url = Array.isArray(vcRequestUrl) ? vcRequestUrl[0] : vcRequestUrl;

    if (typeof url !== 'string' || !url.trim()) return null;

    return `/request?vc_request_url=${encodeURIComponent(url)}`;
};
