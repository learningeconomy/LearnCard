import type {
    AllowConnectionRequestsEnum,
    ProfileVisibilityEnum,
    ShareLink,
} from '@learncard/types';

import type { ConsentedContract } from '../../components/data-sharing/consentSummary';

export type ProfileVisibilityValue =
    (typeof ProfileVisibilityEnum.enum)[keyof typeof ProfileVisibilityEnum.enum];

export type ConnectionRequestsValue =
    (typeof AllowConnectionRequestsEnum.enum)[keyof typeof AllowConnectionRequestsEnum.enum];

export type DataSharingAiViewModel = {
    checked: boolean;
    disabled: boolean;
    showConsentWarning: boolean;
    lockedNote?: string;
    onToggle: (enabled: boolean) => Promise<boolean>;
    onRetryConsent: () => Promise<boolean>;
};

export type DataSharingProfileViewModel = {
    brandName: string;
    visibility: ProfileVisibilityValue;
    showEmail: boolean;
    allowConnectionRequests: ConnectionRequestsValue;
    savingField: string | null;
    onChangeVisibility: (value: string | null) => void;
    onToggleShowEmail: (enabled: boolean) => void;
    onChangeConnectionRequests: (value: string | null) => void;
};

export type DataSharingDiagnosticsViewModel = {
    brandName: string;
    analyticsEnabled: boolean;
    bugReportsEnabled: boolean;
    disabled?: boolean;
    lockedNote?: string;
    onToggleAnalytics: (enabled: boolean) => void;
    onToggleBugReports: (enabled: boolean) => void;
};

export type SharedLinkFilter = 'active' | 'expired' | 'stopped';

export type DataSharingSharedLinksViewModel = {
    records: ShareLink[];
    filter: SharedLinkFilter;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    error: boolean;
    busyId: string | null;
    showViewStats: boolean;
    onFilterChange: (filter: SharedLinkFilter) => void;
    onRefresh: () => Promise<void>;
    onLoadMore: () => Promise<void>;
    onCopy: (share: ShareLink) => Promise<void>;
    onGetPrivateUrl: (share: ShareLink) => Promise<string>;
    onChangeExpiry: (share: ShareLink, expiresAt: string | null) => Promise<void>;
    onStop: (share: ShareLink) => Promise<void>;
    onUpdate: (share: ShareLink) => void;
    onOpenPassport: () => void;
};

export type DataSharingCenterViewModel = {
    isLoading: boolean;
    isMinor: boolean;
    contracts: ConsentedContract[];
    onContractsUpdate: () => Promise<unknown> | void;
    ai: DataSharingAiViewModel | null;
    profile: DataSharingProfileViewModel;
    diagnostics: DataSharingDiagnosticsViewModel;
    shared?: DataSharingSharedLinksViewModel | null;
};
