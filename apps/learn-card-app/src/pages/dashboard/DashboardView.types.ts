import type React from 'react';

import type { AppStoreListing, InstalledApp } from '@learncard/types';
import type { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

import type { ResolvedAction } from './quickActions/types';
import type { PathwayNode } from '../pathways/types';

export type DashboardGoalSummary = {
    title: string;
    goal: string;
    total: number;
    completed: number;
    nextNode: PathwayNode | null;
    pathwayId: string;
    goals?: string[];
} | null;

export type DashboardChecklistItem = {
    key: string;
    label: string;
    done: boolean;
    onClick: () => void;
};

export type DashboardActivityRecord = {
    id: string;
    uri: string;
    title?: string;
    from?: string;
    date?: string;
    category?: string;
};

export type DashboardLcnVisibleProfile = {
    profileId?: string;
    displayName?: string;
    image?: string;
};

export type DashboardPendingContractRequest = {
    profile?: DashboardLcnVisibleProfile;
    contract?: { name?: string };
};

export type DashboardEmptyTip = {
    key: string;
    title: string;
    subtitle: string;
    Icon?: React.FC<{ className?: string; shadeColor?: string }>;
    onClick: () => void;
};

export type DashboardSlots = Record<'collect' | 'understand' | 'navigate', ResolvedAction | null>;

export type DashboardHeaderViewModel = {
    displayName: string;
    profileImage: string;
    heroImage?: string;
    profileRole?: string;
    shortBio?: string;
    professionalTitle?: string;
    onAvatarClick: () => void;
    onScanQrTopRight: () => void;
    roleSwitcher?: React.ReactNode;
};

export type DashboardActivityViewModel = {
    notifications: NotificationType[];
    pendingContractRequests: DashboardPendingContractRequest[];
    pendingConnections: DashboardLcnVisibleProfile[];
    records: DashboardActivityRecord[];
    isLoading: boolean;
    emptyTips: DashboardEmptyTip[];
};

export type DashboardAppsViewModel = {
    installedApps: InstalledApp[];
    suggestedApps: AppStoreListing[];
    unreadByListing: Map<string, number>;
    onInstallSuccess: () => void;
};

export type DashboardSkillCategory =
    | 'durable'
    | 'stem'
    | 'athletic'
    | 'creative'
    | 'business'
    | 'trade'
    | 'social'
    | 'digital'
    | 'medical';

export type DashboardLearningProfileState = 'empty' | 'early' | 'rich';

export type DashboardProfileSkill = {
    name: string;
    title: string;
    category: DashboardSkillCategory | null;
    strengthTier: 'strongest' | 'strong' | 'growing';
};

export type DashboardLearningProfileViewModel = {
    state: DashboardLearningProfileState;
    strength?: { title: string; summary?: string } | null;
    verifiedRecords: number;
    skills: DashboardProfileSkill[];
    updatedAt?: string;
    onViewInsights: () => void;
};

export type DashboardDataTrustProofItem = {
    uri: string;
    name: string;
    image?: string;
};

export type DashboardDataTrustViewModel = {
    places: number;
    canRead: number;
    canWrite: number;
    proof: DashboardDataTrustProofItem[];
    onManage: () => void;
};

export type DashboardHeroSlot = 'getStarted' | 'goal';

export type DashboardViewModel = {
    brandName: string;
    header: DashboardHeaderViewModel;
    heroSlot: DashboardHeroSlot;
    checklistItems: DashboardChecklistItem[];
    onDismissGetStarted: () => void;
    goalSummary: DashboardGoalSummary;
    pathwaysEnabled: boolean;
    reviewsDueToday: number;
    onContinueGoal: () => void;
    onReviewGoal: () => void;
    primaryButtonClass?: string;
    slots: DashboardSlots;
    dataTrust: DashboardDataTrustViewModel;
    activity: DashboardActivityViewModel;
    learningProfile: DashboardLearningProfileViewModel;
    apps: DashboardAppsViewModel;
};
