// Icons are the best-available existing learn-card-base assets reused here.
// Gradient stops (except Skill Insights, which is exact from Figma) are
// placeholder values pending a Figma visual-fidelity pass in QA (Task 8).

import React from 'react';
import { AiInsightsIconFormal } from 'learn-card-base/svgs/walletsIconsFormal/AiInsightsIconFormal';
import { AiPathwaysIconFormal } from 'learn-card-base/svgs/walletsIconsFormal/AiPathwaysIconFormal';
import { AiSessionsIconFormal } from 'learn-card-base/svgs/walletsIconsFormal/AiSessionsIconFormal';
import { SkillsIconFormal } from 'learn-card-base/svgs/walletsIconsFormal/SkillsIconFormal';
import { FamiliesIconFormal } from 'learn-card-base/svgs/walletsIconsFormal/FamiliesIconFormal';
import { BoostsIconFormal } from 'learn-card-base/svgs/walletsIconsFormal/BoostsIconFormal';
import { DataSharingIcon } from 'learn-card-base/svgs/DataSharingIcon';
import DocumentIcon from 'learn-card-base/svgs/DocumentIcon';

export type ShortcutActionHelpers = {
    push: (path: string) => void;
    openBoost: () => void;
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

export const LEARNCARD_APP_SHORTCUTS: LearnCardAppShortcut[] = [
    {
        key: 'skill-insights',
        title: 'Skill Insights',
        gradientFrom: '#BEF264',
        gradientTo: '#84CC16',
        Icon: AiInsightsIconFormal,
        getAction: route('/ai/insights'),
    },
    {
        key: 'pathways',
        title: 'Pathways',
        gradientFrom: '#2DD4BF',
        gradientTo: '#115E59',
        Icon: AiPathwaysIconFormal,
        getAction: route('/pathways'),
    },
    {
        key: 'ai-sessions',
        title: 'AI Sessions',
        gradientFrom: '#A5F3FC',
        gradientTo: '#38BDF8',
        Icon: AiSessionsIconFormal,
        getAction: route('/ai/topics'),
    },
    {
        key: 'resume-builder',
        title: 'Resume Builder',
        gradientFrom: '#F87171',
        gradientTo: '#B91C1C',
        Icon: DocumentIcon,
        getAction: route('/resume-builder'),
    },
    {
        key: 'skills-hub',
        title: 'Skills Hub',
        gradientFrom: '#8B5CF6',
        gradientTo: '#5B21B6',
        Icon: SkillsIconFormal,
        getAction: route('/skills'),
    },
    {
        key: 'data-sharing',
        title: 'Data Sharing',
        gradientFrom: '#FDE047',
        gradientTo: '#FACC15',
        Icon: DataSharingIcon,
        getAction: route('/privacy-and-data'),
    },
    {
        key: 'families',
        title: 'Families',
        gradientFrom: '#F97316',
        gradientTo: '#9A3412',
        Icon: FamiliesIconFormal,
        getAction: route('/families'),
    },
    {
        key: 'boost-a-friend',
        title: 'Boost a Friend',
        gradientFrom: '#60A5FA',
        gradientTo: '#1D4ED8',
        Icon: BoostsIconFormal,
        getAction: h => () => h.openBoost(),
    },
];
