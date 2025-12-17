import { ThemeEnum } from '../helpers/theme-helpers';
import { CredentialCategoryEnum } from 'learn-card-base';

import {
    FormalWalletIcons,
    WalletIcons as ColorfulWalletIcons,
    SideNavFormalIcons,
    SideNavIcons as ColorfulSideNavIcons,
} from 'learn-card-base';

const {
    AiSessionsIconWithShape,
    AiPathwaysIconWithShape,
    AiInsightsIconWithShape,
    AiInsightsIconWithLightShape,
    SkillsIcon,
    SkillsIconWithShape,
    SkillsIconWithLightShape,
    BoostsIcon,
    BoostsIconWithShape,
    BoostsIconWithLightShape,
    AchievementsIcon,
    AchievementsIconWithShape,
    AchievementsIconWithLightShape,
    StudiesIcon,
    StudiesIconWithShape,
    StudiesIconWithLightShape,
    PortfolioIcon,
    PortfolioIconWithShape,
    PortfolioIconWithLightShape,
    AssistanceIcon,
    AssistanceIconWithShape,
    AssistanceIconWithLightShape,
    ExperiencesIcon,
    ExperiencesIconWithShape,
    ExperiencesIconWithLightShape,
    FamiliesIcon,
    FamiliesIconWithShape,
    FamiliesIconWithLightShape,
    IDsIcon,
    IDsIconWithShape,
    IDsIconWithLightShape,
} = ColorfulWalletIcons;

const {
    AiSessionsIconFormal,
    AiPathwaysIconFormal,
    AiInsightsIconFormal,
    SkillsIconFormal,
    BoostsIconFormal,
    AchievementsIconFormal,
    StudiesIconFormal,
    PortfolioIconFormal,
    AssistanceIconFormal,
    ExperiencesIconFormal,
    FamiliesIconFormal,
    IDsIconFormal,
} = FormalWalletIcons;

const {
    Rocket,
    GlobeStand,
    NotificationIcon2,
    UnicornIcon,
    ThinnerShieldChevron,

    PassportIcon,
    AiSessionsTwoTonedIcon,
    AiInsightsTwoTonedIcon,
    AiPathwaysTwoTonedIcon,
    SkillsTwoTonedIcon,
    BoostsTwoTonedIcon,
    AchievementsTwoTonedIcon,
    StudiesTwoTonedIcon,
    IDsTwoTonedIcon,
    ExperiencesTwoTonedIcon,
    PortfolioTwoTonedIcon,
    AssistanceTwoTonedIcon,
    FamiliesTwoTonedIcon,
} = ColorfulSideNavIcons;

const {
    launchPad: LaunchPadFormalIcon,
    contacts: ContactsFormalIcon,
    alerts: AlertsFormalIcon,
    personalize: PersonalizeFormalIcon,
    wallet: WalletFormalIcon,
    aiSession: AiSessionFormalIcon,
    skills: SkillsFormalIcon,
    boosts: BoostsFormalIcon,
    achievements: AchievementsFormalIcon,
    studies: StudiesFormalIcon,
    portfolio: PortfolioFormalIcon,
    assistance: AssistanceFormalIcon,
    experiences: ExperiencesFormalIcon,
    families: FamiliesFormalIcon,
    ids: IDsFormalIcon,
} = SideNavFormalIcons;

import {
    AlertWithShape,
    GreenGlobeWithShape,
    WandWithShape,
    GreenAlerts,
    DeepPurpleWand,
    SkyBlueGlobeStand,
} from 'learn-card-base';

import { NavBarIcons } from 'learn-card-base';
import { NavBarFormalIcons } from 'learn-card-base';

import ColorFulPlus from '../../assets/images/colorful-plus.png';
import FormalPlus from '../../assets/images/formal-plus.png';
const { wallet: NavBarPassportIcon, launchPad: NavBarLaunchPadIcon } = NavBarIcons;
const { passport: NavBarPassportIconFormal, launchPad: NavBarLaunchPadIconFormal } =
    NavBarFormalIcons;

import FloatingBottle from '../../components/svgs/placeholders/FloatingBottle';
import FloatingBottleFormal from '../../components/svgs/placeholders/formal/FloatingBottleFormal';
import TelescopeIcon from '../../components/svgs/placeholders/TelescopeIcon';
import TelescopeFormal from '../../components/svgs/placeholders/formal/TelescopeFormal';

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

export type ThemeIcons = Record<ThemeEnum, ThemeIconTable>;

export const icons = {
    [ThemeEnum.Colorful]: {
        [CredentialCategoryEnum.aiTopic]: {
            IconWithShape: AiSessionsIconWithShape,
        },
        [CredentialCategoryEnum.aiPathway]: {
            IconWithShape: AiPathwaysIconWithShape,
        },
        [CredentialCategoryEnum.aiInsight]: {
            IconWithShape: AiInsightsIconWithShape,
            IconWithLightShape: AiInsightsIconWithLightShape,
        },
        [CredentialCategoryEnum.skill]: {
            Icon: SkillsIconWithShape,
            IconWithShape: SkillsIconWithShape,
            IconWithLightShape: SkillsIconWithLightShape,
        },
        [CredentialCategoryEnum.socialBadge]: {
            Icon: BoostsIcon,
            IconWithShape: BoostsIconWithShape,
            IconWithLightShape: BoostsIconWithLightShape,
        },
        [CredentialCategoryEnum.achievement]: {
            Icon: AchievementsIcon,
            IconWithShape: AchievementsIconWithShape,
            IconWithLightShape: AchievementsIconWithLightShape,
        },
        [CredentialCategoryEnum.learningHistory]: {
            Icon: StudiesIcon,
            IconWithShape: StudiesIconWithShape,
            IconWithLightShape: StudiesIconWithLightShape,
        },
        [CredentialCategoryEnum.accomplishment]: {
            Icon: PortfolioIcon,
            IconWithShape: PortfolioIconWithShape,
            IconWithLightShape: PortfolioIconWithLightShape,
        },
        [CredentialCategoryEnum.accommodation]: {
            Icon: AssistanceIcon,
            IconWithShape: AssistanceIconWithShape,
            IconWithLightShape: AssistanceIconWithLightShape,
        },
        [CredentialCategoryEnum.workHistory]: {
            Icon: ExperiencesIcon,
            IconWithShape: ExperiencesIconWithShape,
            IconWithLightShape: ExperiencesIconWithLightShape,
        },
        [CredentialCategoryEnum.family]: {
            Icon: FamiliesIcon,
            IconWithShape: FamiliesIconWithShape,
            IconWithLightShape: FamiliesIconWithLightShape,
        },
        [CredentialCategoryEnum.id]: {
            Icon: IDsIcon,
            IconWithShape: IDsIconWithShape,
            IconWithLightShape: IDsIconWithLightShape,
        },

        launchPad: {
            contacts: GreenGlobeWithShape,
            aiSessions: WandWithShape,
            alerts: AlertWithShape,
        },

        sideMenu: {
            launchPad: Rocket,
            contacts: GlobeStand,
            alerts: NotificationIcon2,
            personalize: UnicornIcon,
            adminTools: ThinnerShieldChevron,
            wallet: PassportIcon,
            [CredentialCategoryEnum.aiTopic]: AiSessionsTwoTonedIcon,
            [CredentialCategoryEnum.aiPathway]: AiPathwaysTwoTonedIcon,
            [CredentialCategoryEnum.aiInsight]: AiInsightsTwoTonedIcon,
            [CredentialCategoryEnum.skill]: SkillsTwoTonedIcon,
            [CredentialCategoryEnum.socialBadge]: BoostsTwoTonedIcon,
            [CredentialCategoryEnum.achievement]: AchievementsTwoTonedIcon,
            [CredentialCategoryEnum.learningHistory]: StudiesTwoTonedIcon,
            [CredentialCategoryEnum.accomplishment]: PortfolioTwoTonedIcon,
            [CredentialCategoryEnum.accommodation]: AssistanceTwoTonedIcon,
            [CredentialCategoryEnum.workHistory]: ExperiencesTwoTonedIcon,
            [CredentialCategoryEnum.family]: FamiliesTwoTonedIcon,
            [CredentialCategoryEnum.id]: IDsTwoTonedIcon,
        },
        navbar: {
            wallet: NavBarPassportIcon,
            plus: ColorFulPlus,
            launchPad: NavBarLaunchPadIcon,
        },
        placeholders: {
            floatingBottle: FloatingBottle,
            telescope: TelescopeIcon,
        },
    },
    [ThemeEnum.Formal]: {
        [CredentialCategoryEnum.aiTopic]: { Icon: AiSessionsIconFormal },
        [CredentialCategoryEnum.aiPathway]: { Icon: AiPathwaysIconFormal },
        [CredentialCategoryEnum.aiInsight]: { Icon: AiInsightsIconFormal },
        [CredentialCategoryEnum.skill]: { Icon: SkillsIconFormal },
        [CredentialCategoryEnum.socialBadge]: { Icon: BoostsIconFormal },
        [CredentialCategoryEnum.achievement]: { Icon: AchievementsIconFormal },
        [CredentialCategoryEnum.learningHistory]: { Icon: StudiesIconFormal },
        [CredentialCategoryEnum.accomplishment]: { Icon: PortfolioIconFormal },
        [CredentialCategoryEnum.accommodation]: { Icon: AssistanceIconFormal },
        [CredentialCategoryEnum.workHistory]: { Icon: ExperiencesIconFormal },
        [CredentialCategoryEnum.family]: { Icon: FamiliesIconFormal },
        [CredentialCategoryEnum.id]: { Icon: IDsIconFormal },

        launchPad: {
            contacts: SkyBlueGlobeStand,
            aiSessions: DeepPurpleWand,
            alerts: GreenAlerts,
        },

        sideMenu: {
            launchPad: LaunchPadFormalIcon,
            contacts: ContactsFormalIcon,
            alerts: AlertsFormalIcon,
            personalize: PersonalizeFormalIcon,
            adminTools: ThinnerShieldChevron,
            wallet: WalletFormalIcon,
            [CredentialCategoryEnum.aiTopic]: AiSessionFormalIcon,
            [CredentialCategoryEnum.aiPathway]: AiPathwaysTwoTonedIcon, // need bold icon
            [CredentialCategoryEnum.aiInsight]: AiInsightsTwoTonedIcon, // need bold icon
            [CredentialCategoryEnum.skill]: SkillsFormalIcon,
            [CredentialCategoryEnum.socialBadge]: BoostsFormalIcon,
            [CredentialCategoryEnum.achievement]: AchievementsFormalIcon,
            [CredentialCategoryEnum.learningHistory]: StudiesFormalIcon,
            [CredentialCategoryEnum.accomplishment]: PortfolioFormalIcon,
            [CredentialCategoryEnum.accommodation]: AssistanceFormalIcon,
            [CredentialCategoryEnum.workHistory]: ExperiencesFormalIcon,
            [CredentialCategoryEnum.family]: FamiliesFormalIcon,
            [CredentialCategoryEnum.id]: IDsFormalIcon,
        },
        navbar: {
            wallet: NavBarPassportIconFormal,
            plus: FormalPlus,
            launchPad: NavBarLaunchPadIconFormal,
        },
        placeholders: {
            floatingBottle: FloatingBottleFormal,
            telescope: TelescopeFormal,
        },
    },
} as const satisfies ThemeIcons;
