import type { ShareLink } from '@learncard/types';

import * as m from '../../../../paraglide/messages.js';
import type { SharedLinkFilter } from '../../DataSharingCenter.types';

export const PREVIEW_LIMIT = 5;
const DAY_MS = 86_400_000;
const SOON_DAYS = 3;
const RELATIVE_EXPIRY_MAX_DAYS = 30;

export const getSharedLinkViewStatus = (
    share: Pick<ShareLink, 'status' | 'expiresAt'>,
    now = Date.now()
): SharedLinkFilter => {
    if (share.status === 'stopped') return 'stopped';
    if (share.expiresAt && new Date(share.expiresAt).getTime() <= now) return 'expired';
    return 'active';
};

export const localDateValue = (value: Date): string => {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

export const dateInputValue = (value: string | null): string =>
    value ? localDateValue(new Date(value)) : '';

export const minimumExpiryDateValue = (now = new Date()): string => {
    const minimum = new Date(now);
    minimum.setDate(minimum.getDate() + 1);
    return localDateValue(minimum);
};

export const formatShortDate = (value: string): string => new Date(value).toLocaleDateString();

export const credentialCountLabel = (count: number): string =>
    count === 1
        ? m['dataShareCenter.shared.credentialCountOne']({ count: String(count) })
        : m['dataShareCenter.shared.credentialCount']({ count: String(count) });

export const statusLabel = (status: SharedLinkFilter): string =>
    ({
        active: m['dataShareCenter.shared.active'](),
        expired: m['dataShareCenter.shared.expired'](),
        stopped: m['dataShareCenter.shared.stopped'](),
    })[status];

const startOfLocalDay = (value: Date): number =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

export const calendarDaysUntil = (iso: string, now = new Date()): number =>
    Math.round((startOfLocalDay(new Date(iso)) - startOfLocalDay(now)) / DAY_MS);

export type ExpiryHint = { label: string; soon: boolean };

export const expiryHint = (expiresAt: string, now = new Date()): ExpiryHint => {
    const days = calendarDaysUntil(expiresAt, now);
    const soon = days <= SOON_DAYS;
    if (days <= 0) return { label: m['dataShareCenter.shared.expiresToday'](), soon };
    if (days === 1) return { label: m['dataShareCenter.shared.expiresTomorrow'](), soon };
    if (days <= RELATIVE_EXPIRY_MAX_DAYS)
        return {
            label: m['dataShareCenter.shared.expiresInDays']({ count: String(days) }),
            soon,
        };
    return {
        label: m['dataShareCenter.shared.expires']({ date: formatShortDate(expiresAt) }),
        soon,
    };
};

export type ViewHint = { label: string; fresh: boolean };

export const viewHint = (
    share: Pick<ShareLink, 'viewCount' | 'lastViewedAt'>,
    now = Date.now()
): ViewHint | null => {
    if (share.viewCount === undefined) return null;
    const fresh = Boolean(
        share.viewCount > 0 &&
        share.lastViewedAt &&
        now - new Date(share.lastViewedAt).getTime() < DAY_MS
    );
    if (share.viewCount === 0) return { label: m['dataShareCenter.shared.notOpened'](), fresh };
    if (share.viewCount === 1) return { label: m['dataShareCenter.shared.openedOnce'](), fresh };
    return {
        label: m['dataShareCenter.shared.openedCount']({ count: String(share.viewCount) }),
        fresh,
    };
};

export type ShareRowHint = { label: string; tone: 'default' | 'soon' | 'fresh' };

export type ShareRowMeta = {
    pending: boolean;
    locked: boolean;
    credentials: string;
    hint: ShareRowHint | null;
};

/** One-line row summary. Priority: pending > expiry > views (never both). */
export const shareRowMeta = (
    share: ShareLink,
    { pending, showViewStats }: { pending: boolean; showViewStats: boolean },
    now = new Date()
): ShareRowMeta => {
    const base = {
        pending,
        locked: share.passcodeProtected,
        credentials: credentialCountLabel(share.selectedCount),
    };
    if (pending) return { ...base, hint: null };
    const status = getSharedLinkViewStatus(share, now.getTime());
    if (status === 'stopped' && share.stoppedAt)
        return {
            ...base,
            hint: {
                label: `${statusLabel('stopped')} ${formatShortDate(share.stoppedAt)}`,
                tone: 'default',
            },
        };
    if (status === 'expired' && share.expiresAt)
        return {
            ...base,
            hint: {
                label: m['dataShareCenter.shared.expiredOn']({
                    date: formatShortDate(share.expiresAt),
                }),
                tone: 'soon',
            },
        };
    if (share.expiresAt) {
        const expiry = expiryHint(share.expiresAt, now);
        return { ...base, hint: { label: expiry.label, tone: expiry.soon ? 'soon' : 'default' } };
    }
    const views = showViewStats ? viewHint(share, now.getTime()) : null;
    return {
        ...base,
        hint: views ? { label: views.label, tone: views.fresh ? 'fresh' : 'default' } : null,
    };
};

const newestFirst = (a: ShareLink, b: ShareLink): number =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export const sortNewestFirst = (records: ShareLink[]): ShareLink[] =>
    [...records].sort(newestFirst);

export const selectPreviewShares = (
    records: ShareLink[],
    now = Date.now(),
    limit = PREVIEW_LIMIT
): ShareLink[] =>
    sortNewestFirst(
        records.filter(record => getSharedLinkViewStatus(record, now) === 'active')
    ).slice(0, limit);

export const viewAllLabel = (count: number, hasMore: boolean): string =>
    hasMore
        ? m['dataShareCenter.shared.viewAllMore']({ count: String(count) })
        : m['dataShareCenter.shared.viewAll']({ count: String(count) });

export const initialsFor = (name: string): string => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const first = words[0][0] ?? '';
    const last = words.length > 1 ? (words[words.length - 1][0] ?? '') : '';
    return `${first}${last}`.toUpperCase();
};

const AVATAR_TINTS = [
    'bg-emerald-100 text-emerald-800',
    'bg-sky-100 text-sky-800',
    'bg-violet-100 text-violet-800',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-800',
    'bg-teal-100 text-teal-800',
] as const;

export const avatarTint = (name: string): string => {
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return AVATAR_TINTS[hash % AVATAR_TINTS.length];
};
