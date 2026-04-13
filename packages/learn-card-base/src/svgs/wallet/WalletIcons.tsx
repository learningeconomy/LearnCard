import type { IconPalette } from '../types';

import AiSessionsIcon, { AiSessionsIconWithShape, AI_SESSIONS_DEFAULTS } from './AiSessionsIcon';
import AiPathwaysIcon, { AiPathwaysIconWithShape, AI_PATHWAYS_DEFAULTS } from './AiPathwaysIcon';
import AiInsightsIcon, {
    AiInsightsIconWithShape,
    AiInsightsIconWithLightShape,
    AI_INSIGHTS_DEFAULTS,
} from './AiInsightsIcon';
import SkillsIcon, {
    SkillsIconWithShape,
    SkillsIconWithLightShape,
    SKILLS_DEFAULTS,
} from './SkillsIcon';
import BoostsIcon, {
    BoostsIconWithShape,
    BoostsIconWithLightShape,
    BOOSTS_DEFAULTS,
} from './BoostsIcon';
import AchievementsIcon, {
    AchievementsIconWithShape,
    AchievementsIconWithLightShape,
    ACHIEVEMENTS_DEFAULTS,
} from './AchievementsIcon';
import StudiesIcon, {
    StudiesIconWithShape,
    StudiesIconWithLightShape,
    STUDIES_DEFAULTS,
} from './StudiesIcon';
import PortfolioIcon, {
    PortfolioIconWithShape,
    PortfolioIconWithLightShape,
    PORTFOLIO_DEFAULTS,
} from './PortfolioIcon';
import AssistanceIcon, {
    AssistanceIconWithShape,
    AssistanceIconWithLightShape,
    ASSISTANCE_DEFAULTS,
} from './AssistanceIcon';
import ExperiencesIcon, {
    ExperiencesIconWithShape,
    ExperiencesIconWithLightShape,
    EXPERIENCES_DEFAULTS,
} from './ExperiencesIcon';
import FamiliesIcon, {
    FamiliesIconWithShape,
    FamiliesIconWithLightShape,
    FAMILIES_DEFAULTS,
} from './FamiliesIcon';
import IDsIcon, { IDsIconWithShape, IDsIconWithLightShape, IDS_DEFAULTS } from './IDsIcon';
import { ALL_BOOSTS_DEFAULTS } from './AllBoostsIcon';

export type { IconPalette };

export {
    AI_SESSIONS_DEFAULTS,
    AI_PATHWAYS_DEFAULTS,
    AI_INSIGHTS_DEFAULTS,
    SKILLS_DEFAULTS,
    BOOSTS_DEFAULTS,
    ACHIEVEMENTS_DEFAULTS,
    STUDIES_DEFAULTS,
    PORTFOLIO_DEFAULTS,
    ASSISTANCE_DEFAULTS,
    EXPERIENCES_DEFAULTS,
    FAMILIES_DEFAULTS,
    IDS_DEFAULTS,
    ALL_BOOSTS_DEFAULTS,
};

export const WALLET_ICON_PALETTE_DEFAULTS: Record<string, Required<IconPalette>> = {
    AiSessions: AI_SESSIONS_DEFAULTS,
    AiPathways: AI_PATHWAYS_DEFAULTS,
    AiInsights: AI_INSIGHTS_DEFAULTS,
    Skills: SKILLS_DEFAULTS,
    Boosts: BOOSTS_DEFAULTS,
    Achievements: ACHIEVEMENTS_DEFAULTS,
    Studies: STUDIES_DEFAULTS,
    Portfolio: PORTFOLIO_DEFAULTS,
    Assistance: ASSISTANCE_DEFAULTS,
    Experiences: EXPERIENCES_DEFAULTS,
    Families: FAMILIES_DEFAULTS,
    IDs: IDS_DEFAULTS,
    AllBoosts: ALL_BOOSTS_DEFAULTS,
};

export const WalletIcons = {
    AiSessionsIcon,
    AiSessionsIconWithShape,
    AiPathwaysIcon,
    AiPathwaysIconWithShape,
    AiInsightsIcon,
    AiInsightsIconWithLightShape,
    AiInsightsIconWithShape,
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
};
