import { CredentialCategoryEnum } from 'learn-card-base';

export type CategoryIcons = {
    Icon?: React.FC<{ className?: string }>;
    IconWithShape?: React.FC<{ version?: string; className?: string }>;
    IconWithLightShape?: React.FC<{ className?: string }>;
};

export type LaunchPadIcons = {
    contacts: React.FC<{ className?: string }>;
    aiSessions: React.FC<{ className?: string }>;
    alerts: React.FC<{ className?: string }>;
};

export type SideMenuIcons = {
    launchPad: React.FC<{ className?: string }>;
    contacts: React.FC<{ className?: string }>;
    alerts: React.FC<{ className?: string }>;
    personalize: React.FC<{ className?: string }>;
    adminTools: React.FC<{ className?: string }>;
    wallet: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.aiTopic]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.aiPathway]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.aiInsight]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.skill]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.socialBadge]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.achievement]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.learningHistory]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.accomplishment]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.accommodation]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.workHistory]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.resume]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.family]: React.FC<{ className?: string }>;
    [CredentialCategoryEnum.id]: React.FC<{ className?: string }>;
};

export type NavbarIcons = {
    wallet: React.FC<{ className?: string; version?: string }>;
    plus: React.FC<{ className?: string; version?: string }>;
    launchPad: React.FC<{ className?: string; version?: string }>;
};

export type PlaceholdersIcons = {
    floatingBottle: React.FC<{ className?: string }>;
    telescope: React.FC<{ className?: string }>;
};

export type ThemeIconTable = Partial<Record<CredentialCategoryEnum, CategoryIcons>> & {
    launchPad: LaunchPadIcons;
    sideMenu: SideMenuIcons;
    navbar: NavbarIcons;
    placeholders: PlaceholdersIcons;
};

export enum IconSetEnum {
    launchPad = 'launchPad',
    sideMenu = 'sideMenu',
    navbar = 'navbar',
    placeholders = 'placeholders',
}

