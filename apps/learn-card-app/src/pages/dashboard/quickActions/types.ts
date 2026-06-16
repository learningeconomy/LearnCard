import type React from 'react';

export type SlotName = 'collect' | 'understand' | 'navigate';

export const SLOT_ORDER: readonly SlotName[] = ['collect', 'understand', 'navigate'] as const;

export type QuickActionIcon = React.FC<{ className?: string; shadeColor?: string }>;

export type DashboardState = {
    brandName: string;
    credentialsCount: number;
    skillsCount: number;
    hasGoal: boolean;
    hasSkillProfile: boolean;
    nextNodeTitle?: string;
    pathwaysEnabled: boolean;
    showAiInsights: boolean;
};

export type ActionHandlers = {
    goToAddCredential: () => void;
    goToWallet: () => void;
    goToSkills: () => void;
    goToInsights: () => void;
    openSkillProfile: () => void;
    goToSetGoal: () => void;
    goToPathway: () => void;
    goToBrowsePathways: () => void;
    goToBrowseAppStore: () => void;
};

export type SlotIcons = {
    collect: QuickActionIcon;
    understand: QuickActionIcon;
    navigate: QuickActionIcon;
};

export type ActionDeps = {
    handlers: ActionHandlers;
    icons: SlotIcons;
};

export type ResolvedAction = {
    id: string;
    slot: SlotName;
    Icon: QuickActionIcon;
    label: string;
    caption: string;
    onClick: () => void;
};

export type ActionDescriptor = {
    id: string;
    slot: SlotName;
    eligible: (state: DashboardState) => boolean;
    weight: (state: DashboardState) => number;
    build: (state: DashboardState, deps: ActionDeps) => Omit<ResolvedAction, 'id' | 'slot'>;
};
