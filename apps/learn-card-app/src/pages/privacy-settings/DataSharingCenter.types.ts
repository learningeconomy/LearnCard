import type { AllowConnectionRequestsEnum, ProfileVisibilityEnum } from '@learncard/types';

import type { ConsentedContract } from '../../components/data-sharing/consentSummary';

export type ProfileVisibilityValue =
    (typeof ProfileVisibilityEnum.enum)[keyof typeof ProfileVisibilityEnum.enum];

export type ConnectionRequestsValue =
    (typeof AllowConnectionRequestsEnum.enum)[keyof typeof AllowConnectionRequestsEnum.enum];

export type DataSharingAiViewModel = {
    checked: boolean;
    disabled: boolean;
    showConsentWarning: boolean;
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
    onToggleAnalytics: (enabled: boolean) => void;
    onToggleBugReports: (enabled: boolean) => void;
};

export type DataSharingCenterViewModel = {
    isLoading: boolean;
    isMinor: boolean;
    contracts: ConsentedContract[];
    onContractsUpdate: () => Promise<unknown> | void;
    ai: DataSharingAiViewModel | null;
    profile: DataSharingProfileViewModel;
    diagnostics: DataSharingDiagnosticsViewModel;
};
