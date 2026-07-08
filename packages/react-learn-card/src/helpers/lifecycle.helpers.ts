import type { CSSProperties } from 'react';

export type CredentialLifecycleStatus = 'active' | 'revoked' | 'suspended';

export type LifecycleTreatment = {
    /** True when the credential is revoked or suspended. */
    isInactive: boolean;
    /** Inline filter for media (images / thumbnails); `undefined` when active.
     *  Inline style (not a Tailwind class) so it applies regardless of whether the
     *  consumer app's Tailwind scans this package or generates the utility. */
    mediaStyle: CSSProperties | undefined;
    /** Inline style for de-emphasizing text; `undefined` when active. */
    textStyle: CSSProperties | undefined;
    /** Pill background color for the status chip (only meaningful when `isInactive`). */
    pillBg: string;
    /** Pill label for the status chip (only meaningful when `isInactive`). */
    pillLabel: string;
};

const REVOKED_COLOR = '#DC2626'; // red-600
const SUSPENDED_COLOR = '#EA580C'; // orange-600

/**
 * Shared visual treatment for a revoked/suspended credential, used by both the
 * grid card (`BoostGenericCard`) and the list row (`BoostListItem`) so the two
 * views stay in sync. Values are inert (`isInactive: false`, `undefined` styles)
 * for active credentials.
 */
export const getLifecycleTreatment = (
    status: CredentialLifecycleStatus = 'active'
): LifecycleTreatment => {
    const isInactive = status === 'revoked' || status === 'suspended';

    return {
        isInactive,
        mediaStyle: isInactive ? { filter: 'grayscale(1) brightness(0.9)' } : undefined,
        textStyle: isInactive ? { filter: 'grayscale(1)', opacity: 0.6 } : undefined,
        pillBg: status === 'suspended' ? SUSPENDED_COLOR : REVOKED_COLOR,
        pillLabel: status === 'suspended' ? 'Suspended' : 'Revoked',
    };
};
