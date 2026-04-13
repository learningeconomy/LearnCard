/**
 * Named icon set registries.
 *
 * Theme JSON files reference these by name via the `"iconSet"` field.
 * Each set is a complete `ThemeIconTable` — category icons, launchPad,
 * sideMenu, navbar, and placeholder icons.
 */
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
    AiPathwaysSideMenuIconFormal,
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

const { wallet: NavBarPassportIcon, launchPad: NavBarLaunchPadIcon, notification: NavBarBellIcon } = NavBarIcons;
const { passport: NavBarPassportIconFormal, launchPad: NavBarLaunchPadIconFormal } =
    NavBarFormalIcons;

import {
    VetpassAchievementsWithShape,
    VetpassAiInsightsWithShape,
    VetpassAiSessionsWithShape,
    VetpassAssistanceWithShape,
    VetpassBoostsWithShape,
    VetpassExperiencesWithShape,
    VetpassIDsWithShape,
    VetpassPathwaysWithShape,
    VetpassSkillsWithShape,
    VetpassStudiesWithShape,
    VetpassAchievementsIcon,
    VetpassAiInsightsIcon,
    VetpassAiSessionsIcon,
    VetpassAssistanceIcon,
    VetpassBoostsIcon,
    VetpassPathwaysIcon,
    VetpassExperiencesIcon,
    VetpassIDsIcon,
    VetpassPortfolioIcon,
    VetpassSkillsIcon,
    VetpassStudiesIcon,
    VetpassPassportNavbar,
    VetpassAppsNavbar,
    VetpassAlertsNavbar,
} from './vetpass/index';

import FloatingBottle from '../../components/svgs/placeholders/FloatingBottle';
import FloatingBottleFormal from '../../components/svgs/placeholders/formal/FloatingBottleFormal';
import TelescopeIcon from '../../components/svgs/placeholders/TelescopeIcon';
import TelescopeFormal from '../../components/svgs/placeholders/formal/TelescopeFormal';

import type {
    ThemeIconTable,
    CategoryIcons,
    LaunchPadIcons,
    SideMenuIcons,
    NavbarIcons,
    PlaceholdersIcons,
} from './index';

// ─── Icon Sets ───────────────────────────────────────────────────────────

/**
 * Complete icon set definitions. Each entry is a fully-specified icon table
 * that can be used directly by themes.
 */
export const ICON_SETS: Record<string, ThemeIconTable> = {
    colorful: {
        [CredentialCategoryEnum.aiTopic]: {
            IconWithShape: AiSessionsIconWithShape,
        },
        [CredentialCategoryEnum.aiPathway]: {
            Icon: AiPathwaysIconWithShape,
            IconWithShape: AiPathwaysIconWithShape,
        },
        [CredentialCategoryEnum.aiInsight]: {
            Icon: AiInsightsIconWithShape,
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
            notification: NavBarBellIcon,
        },

        placeholders: {
            floatingBottle: FloatingBottle,
            telescope: TelescopeIcon,
        },
    },

    formal: {
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
            [CredentialCategoryEnum.aiPathway]: AiPathwaysSideMenuIconFormal,
            [CredentialCategoryEnum.aiInsight]: AiInsightsTwoTonedIcon,
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
            notification: NavBarBellIcon,
        },

        placeholders: {
            floatingBottle: FloatingBottleFormal,
            telescope: TelescopeFormal,
        },
    },
};

// ─── Icon set composition (partial overrides + inheritance) ─────────────

/**
 * Partial icon set definitions that inherit from a parent.
 *
 * Register a partial icon set here to create a new icon set that reuses
 * most icons from an existing set but overrides specific ones.
 *
 * Example:
 * ```ts
 * PARTIAL_ICON_SETS['vetpass'] = {
 *     extends: 'colorful',
 *     overrides: {
 *         [CredentialCategoryEnum.skill]: { Icon: VetpassSkillIcon },
 *         launchPad: { contacts: VetpassContactsIcon, aiSessions: WandWithShape, alerts: AlertWithShape },
 *     },
 * };
 * ```
 */
/**
 * Overrides allow partial section objects (navbar, sideMenu, etc.)
 * since `mergeIconTables` spread-merges them on top of the parent.
 */
type PartialIconSetOverrides = Partial<
    Record<CredentialCategoryEnum, CategoryIcons>
> & {
    launchPad?: Partial<LaunchPadIcons>;
    sideMenu?: Partial<SideMenuIcons>;
    navbar?: Partial<NavbarIcons>;
    placeholders?: Partial<PlaceholdersIcons>;
};

export type PartialIconSetDef = {
    extends: string;
    overrides: PartialIconSetOverrides;
};

export const PARTIAL_ICON_SETS: Record<string, PartialIconSetDef> = {
    vetpass: {
        extends: 'formal',
        overrides: {
            [CredentialCategoryEnum.achievement]: {
                Icon: VetpassAchievementsIcon,
                IconWithShape: VetpassAchievementsWithShape,
            },
            [CredentialCategoryEnum.aiInsight]: {
                Icon: VetpassAiInsightsIcon,
                IconWithShape: VetpassAiInsightsWithShape,
            },
            [CredentialCategoryEnum.aiTopic]: {
                Icon: VetpassAiSessionsIcon,
                IconWithShape: VetpassAiSessionsWithShape,
            },
            [CredentialCategoryEnum.aiPathway]: {
                Icon: VetpassPathwaysIcon,
                IconWithShape: VetpassPathwaysWithShape,
            },
            [CredentialCategoryEnum.accommodation]: {
                Icon: VetpassAssistanceIcon,
                IconWithShape: VetpassAssistanceWithShape,
            },
            [CredentialCategoryEnum.socialBadge]: {
                Icon: VetpassBoostsIcon,
                IconWithShape: VetpassBoostsWithShape,
            },
            [CredentialCategoryEnum.workHistory]: {
                Icon: VetpassExperiencesIcon,
                IconWithShape: VetpassExperiencesWithShape,
            },
            [CredentialCategoryEnum.id]: {
                Icon: VetpassIDsIcon,
                IconWithShape: VetpassIDsWithShape,
            },
            [CredentialCategoryEnum.skill]: {
                Icon: VetpassSkillsIcon,
                IconWithShape: VetpassSkillsWithShape,
            },
            [CredentialCategoryEnum.learningHistory]: {
                Icon: VetpassStudiesIcon,
                IconWithShape: VetpassStudiesWithShape,
            },
            [CredentialCategoryEnum.accomplishment]: {
                Icon: VetpassPortfolioIcon,
            },

            navbar: {
                wallet: VetpassPassportNavbar,
                launchPad: VetpassAppsNavbar,
                notification: VetpassAlertsNavbar,
            },
        },
    },
};

/**
 * Resolve an icon set by name.
 *
 * 1. If the name matches a full `ICON_SETS` entry, return it directly.
 * 2. If it matches a `PARTIAL_ICON_SETS` entry, recursively resolve the
 *    parent and deep-merge the overrides on top.
 * 3. Falls back to `'colorful'` if the name is unknown.
 */
export const resolveIconSet = (
    name: string,
    _seen: Set<string> = new Set(),
): ThemeIconTable => {
    // Direct full set
    if (ICON_SETS[name]) return ICON_SETS[name];

    // Partial set with inheritance
    const partial = PARTIAL_ICON_SETS[name];

    if (partial) {
        if (_seen.has(name)) {
            throw new Error(`Circular icon set extends: ${[..._seen, name].join(' → ')}`);
        }

        _seen.add(name);

        const parent = resolveIconSet(partial.extends, _seen);

        return mergeIconTables(parent, partial.overrides);
    }

    // Fallback
    return ICON_SETS['colorful'];
};

/**
 * Deep-merge a partial icon table on top of a base table.
 * Category icon objects are merged at the Icon/IconWithShape/IconWithLightShape level.
 * Section objects (launchPad, sideMenu, navbar, placeholders) are spread-merged.
 */
const mergeIconTables = (
    base: ThemeIconTable,
    overrides: PartialIconSetOverrides,
): ThemeIconTable => {
    const result: Record<string, unknown> = { ...base };

    for (const [key, value] of Object.entries(overrides)) {
        if (key === 'launchPad' || key === 'sideMenu' || key === 'navbar' || key === 'placeholders') {
            // Section-level merge
            result[key] = {
                ...(base[key as keyof ThemeIconTable] as Record<string, unknown>),
                ...(value as Record<string, unknown>),
            };
        } else {
            // Category icon merge — merge Icon/IconWithShape/IconWithLightShape
            const baseIcons = (base as Record<string, unknown>)[key] as CategoryIcons | undefined;

            result[key] = { ...baseIcons, ...(value as CategoryIcons) };
        }
    }

    return result as ThemeIconTable;
};
