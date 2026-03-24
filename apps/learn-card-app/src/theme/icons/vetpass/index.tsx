/**
 * VetPass icon set barrel.
 *
 * Re-exports SVGR-generated components with thin wrappers that narrow
 * the prop type to match the ThemeIconTable signatures:
 *   - Icon:          React.FC<{ className?: string }>
 *   - IconWithShape: React.FC<{ version?: string; className?: string }>
 *   - Navbar:        React.FC<{ className?: string; version?: string }>
 */
import React from 'react';
import type { SVGProps } from 'react';

// ─── Category card icons (IconWithShape — 70×70 with background shapes) ──────

import SvgCatAchievements from './category-icons/Achievements';
import SvgCatAiInsights from './category-icons/AI_Insights';
import SvgCatAiSessions from './category-icons/AI_Sessions';
import SvgCatAssistance from './category-icons/Assistance';
import SvgCatBoosts from './category-icons/Boosts';
import SvgCatExperiences from './category-icons/Experiences';
import SvgCatIDs from './category-icons/IDs';
import SvgCatPathways from './category-icons/Pathways';
import SvgCatSkills from './category-icons/Skills';
import SvgCatStudies from './category-icons/Studies';

// ─── Individual page icons (Icon — ~55×55) ───────────────────────────────────

import SvgPageAchievements from './individual-page-category-icons/Achievements';
import SvgPageAiInsights from './individual-page-category-icons/AI_Insights';
import SvgPageAiSessions from './individual-page-category-icons/AI_Sessions';
import SvgPageAssistance from './individual-page-category-icons/Assistance';
import SvgPageBoosts from './individual-page-category-icons/Boosts';
import SvgPagePathways from './individual-page-category-icons/Compass_Pathways';
import SvgPageExperiences from './individual-page-category-icons/Experiences';
import SvgPageIDs from './individual-page-category-icons/IDs';
import SvgPagePortfolio from './individual-page-category-icons/Portfolio_Thicker';
import SvgPageSkills from './individual-page-category-icons/VetPass_Skills';
import SvgPageStudies from './individual-page-category-icons/Studies';

// ─── Menu / navbar icons ─────────────────────────────────────────────────────

import SvgPassportActive from './menu-icons/Property_1_Passport_Active';
import SvgPassportDefault from './menu-icons/Property_1_Passport_-Default';
import SvgAppsActive from './menu-icons/Property_1_Apps_Active';
import SvgAppsDefault from './menu-icons/Property_1_Apps_Default';
import SvgAlertsActive from './menu-icons/Property_1_Alerts_Active';
import SvgNotificationsDefault from './menu-icons/Property_1_Notifications_Default';

// ─── Other icons ─────────────────────────────────────────────────────────────

import SvgBlocks from './other-icons/Blocks_Streamline_Lucide_Line';
import SvgResumeBuilder from './other-icons/Resume_Builder_Icon';

// ─── Wrapper helpers ─────────────────────────────────────────────────────────

type SvgComponent = React.FC<SVGProps<SVGSVGElement>>;

const wrapIcon = (Svg: SvgComponent): React.FC<{ className?: string }> => {
    const Wrapped: React.FC<{ className?: string }> = ({ className }) => (
        <Svg className={className} />
    );

    Wrapped.displayName = Svg.displayName ?? Svg.name;

    return Wrapped;
};

const wrapShape = (
    Svg: SvgComponent,
): React.FC<{ version?: string; className?: string }> => {
    const Wrapped: React.FC<{ version?: string; className?: string }> = ({ className }) => (
        <Svg className={className} />
    );

    Wrapped.displayName = Svg.displayName ?? Svg.name;

    return Wrapped;
};

const wrapNavbar = (
    ActiveSvg: SvgComponent,
    DefaultSvg: SvgComponent,
): React.FC<{ version?: string; className?: string }> => {
    const Wrapped: React.FC<{ version?: string; className?: string }> = ({
        className,
        version,
    }) => {
        if (version === '2') return <ActiveSvg className={className} />;

        return <DefaultSvg className={className} />;
    };

    Wrapped.displayName = `${ActiveSvg.displayName ?? ActiveSvg.name}Navbar`;

    return Wrapped;
};

// ─── Category card icons (IconWithShape) ─────────────────────────────────────

export const VetpassAchievementsWithShape = wrapShape(SvgCatAchievements);
export const VetpassAiInsightsWithShape = wrapShape(SvgCatAiInsights);
export const VetpassAiSessionsWithShape = wrapShape(SvgCatAiSessions);
export const VetpassAssistanceWithShape = wrapShape(SvgCatAssistance);
export const VetpassBoostsWithShape = wrapShape(SvgCatBoosts);
export const VetpassExperiencesWithShape = wrapShape(SvgCatExperiences);
export const VetpassIDsWithShape = wrapShape(SvgCatIDs);
export const VetpassPathwaysWithShape = wrapShape(SvgCatPathways);
export const VetpassSkillsWithShape = wrapShape(SvgCatSkills);
export const VetpassStudiesWithShape = wrapShape(SvgCatStudies);

// ─── Individual page icons (Icon) ────────────────────────────────────────────

export const VetpassAchievementsIcon = wrapIcon(SvgPageAchievements);
export const VetpassAiInsightsIcon = wrapIcon(SvgPageAiInsights);
export const VetpassAiSessionsIcon = wrapIcon(SvgPageAiSessions);
export const VetpassAssistanceIcon = wrapIcon(SvgPageAssistance);
export const VetpassBoostsIcon = wrapIcon(SvgPageBoosts);
export const VetpassPathwaysIcon = wrapIcon(SvgPagePathways);
export const VetpassExperiencesIcon = wrapIcon(SvgPageExperiences);
export const VetpassIDsIcon = wrapIcon(SvgPageIDs);
export const VetpassPortfolioIcon = wrapIcon(SvgPagePortfolio);
export const VetpassSkillsIcon = wrapIcon(SvgPageSkills);
export const VetpassStudiesIcon = wrapIcon(SvgPageStudies);

// ─── Navbar icons (version '2' = active, '1' = default) ─────────────────────

export const VetpassPassportNavbar = wrapNavbar(SvgPassportActive, SvgPassportDefault);
export const VetpassAppsNavbar = wrapNavbar(SvgAppsActive, SvgAppsDefault);
export const VetpassAlertsNavbar = wrapNavbar(SvgAlertsActive, SvgNotificationsDefault);

// ─── Other / special icons ───────────────────────────────────────────────────

export const VetpassBlocksIcon = wrapIcon(SvgBlocks);
export const VetpassResumeBuilderIcon = wrapIcon(SvgResumeBuilder);
