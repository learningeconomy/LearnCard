// The 8 LearnCard Apps are hardcoded shortcuts into existing app features.
// Icons: the 6 existing features reuse their branded `…WithShape` wallet icons
// (the same art their route pages render); Resume Builder + Data Sharing are
// Figma-exported tile icons (LC-1928). Gradient stops approximate the Figma tiles.

import React from 'react';
import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import { ExperiencesIconWithShape } from 'learn-card-base/svgs/wallet/ExperiencesIcon';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { FamiliesIconWithShape } from 'learn-card-base/svgs/wallet/FamiliesIcon';
import { BoostsIconWithShape } from 'learn-card-base/svgs/wallet/BoostsIcon';
import ResumeBuilderTileIcon from './icons/ResumeBuilderTileIcon';
import DataSharingTileIcon from './icons/DataSharingTileIcon';

export type ShortcutActionHelpers = {
    push: (path: string) => void;
    openBoost: () => void;
    openBoostAFriend: () => void;
};

export type LearnCardAppShortcut = {
    key: string;
    title: string;
    gradientFrom: string;
    gradientTo: string;
    Icon: React.FC<any>;
    getAction: (helpers: ShortcutActionHelpers) => () => void;
};

const route = (path: string) => (h: ShortcutActionHelpers) => () => h.push(path);

// Retint the reused Experiences icon into the indigo family so it reads as one
// cohesive tile on the indigo gradient (indigo = Pathways v2 wayfinding accent).
// Yellow summit flag kept as the one warm focal pop.
const JourneysTileIcon: React.FC<{ className?: string }> = props => (
    <ExperiencesIconWithShape
        {...props}
        palette={{
            primary: '#C7D2FE',
            primaryLight: '#E0E7FF',
            accent: '#FEF08A',
            stroke: '#4F46E5',
        }}
    />
);

// Kept out of LEARNCARD_APP_SHORTCUTS: MyAppsLanding renders this only when
// usePathwaysEnabled() passes, so the tile can't drift from the (identically
// gated) /pathways route. Icon is a placeholder until design ships a real one.
export const JOURNEYS_SHORTCUT: LearnCardAppShortcut = {
    key: 'journeys',
    title: 'Journeys',
    gradientFrom: '#A5B4FC',
    gradientTo: '#6366F1',
    Icon: JourneysTileIcon,
    getAction: route('/pathways'),
};

export const LEARNCARD_APP_SHORTCUTS: LearnCardAppShortcut[] = [
    {
        key: 'skill-insights',
        title: 'Skill Insights',
        gradientFrom: '#BEF264',
        gradientTo: '#84CC16',
        Icon: AiInsightsIconWithShape,
        getAction: route('/ai/insights'),
    },
    {
        key: 'pathways',
        title: 'Pathways',
        gradientFrom: '#5EEAD4',
        gradientTo: '#14B8A6',
        Icon: AiPathwaysIconWithShape,
        getAction: route('/ai/pathways'),
    },
    {
        key: 'ai-sessions',
        title: 'AI Sessions',
        gradientFrom: '#BAE6FD',
        gradientTo: '#38BDF8',
        Icon: AiSessionsIconWithShape,
        getAction: route('/ai/topics'),
    },
    {
        key: 'resume-builder',
        title: 'Resume Builder',
        gradientFrom: '#FCA5A5',
        gradientTo: '#EF4444',
        Icon: ResumeBuilderTileIcon,
        getAction: route('/resume-builder'),
    },
    {
        key: 'skills-hub',
        title: 'Skills Hub',
        gradientFrom: '#C4B5FD',
        gradientTo: '#8B5CF6',
        Icon: SkillsIconWithShape,
        getAction: route('/skills'),
    },
    {
        key: 'data-sharing',
        title: 'Data Sharing',
        gradientFrom: '#FDE047',
        gradientTo: '#FACC15',
        Icon: DataSharingTileIcon,
        getAction: route('/privacy-and-data'),
    },
    {
        key: 'families',
        title: 'Families',
        gradientFrom: '#FDBA74',
        gradientTo: '#F97316',
        Icon: FamiliesIconWithShape,
        getAction: route('/families'),
    },
    {
        key: 'boost-a-friend',
        title: 'Boost a Friend',
        gradientFrom: '#93C5FD',
        gradientTo: '#3B82F6',
        Icon: BoostsIconWithShape,
        getAction: h => () => h.openBoostAFriend(),
    },
];
