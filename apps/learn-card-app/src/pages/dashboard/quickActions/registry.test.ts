import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_REGISTRY } from './registry';
import type { ActionDeps, DashboardState, QuickActionIcon, SlotIcons } from './types';

const createIcon = (): QuickActionIcon => () => null;

const icons: SlotIcons = {
    collect: createIcon(),
    understand: createIcon(),
    skills: createIcon(),
    navigate: createIcon(),
};

const handlers: ActionDeps['handlers'] = {
    goToAddCredential: vi.fn(),
    openAddToPassport: vi.fn(),
    openClaimLink: vi.fn(),
    goToWallet: vi.fn(),
    goToSkills: vi.fn(),
    goToInsights: vi.fn(),
    openSkillProfile: vi.fn(),
    goToSetGoal: vi.fn(),
    goToPathway: vi.fn(),
    goToBrowsePathways: vi.fn(),
    goToBrowseAppStore: vi.fn(),
};

const state: DashboardState = {
    brandName: 'LearnCard',
    credentialsCount: 1,
    skillsCount: 1,
    hasGoal: true,
    hasSkillProfile: true,
    pathwaysEnabled: true,
    aiInsightsEnabled: true,
};

const understandActive = DEFAULT_REGISTRY.find(action => action.id === 'understand-active');

if (!understandActive) throw new Error('understand-active action is missing');

describe('understand-active quick action', () => {
    it('uses the insights icon when AI insights are available', () => {
        const action = understandActive.build(state, { handlers, icons });

        expect(action.Icon).toBe(icons.understand);
        expect(action.onClick).toBe(handlers.goToInsights);
    });

    it('uses the skills icon when linking to skills', () => {
        const action = understandActive.build(
            { ...state, aiInsightsEnabled: false },
            { handlers, icons }
        );

        expect(action.Icon).toBe(icons.skills);
        expect(action.onClick).toBe(handlers.goToSkills);
    });
});
