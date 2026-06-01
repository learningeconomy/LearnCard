import type { ActionDescriptor } from './types';

export const DEFAULT_REGISTRY: ActionDescriptor[] = [
    {
        id: 'add-first-credential',
        slot: 'collect',
        eligible: state => state.credentialsCount === 0,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: 'Add your first credential',
            caption: 'Save what you\u2019ve earned',
            onClick: handlers.goToAddCredential,
        }),
    },
    {
        id: 'view-passport',
        slot: 'collect',
        eligible: state => state.credentialsCount > 0,
        weight: state => 50 + Math.min(state.credentialsCount, 50),
        build: (state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: 'View passport',
            caption: `${state.credentialsCount} credential${
                state.credentialsCount === 1 ? '' : 's'
            }`,
            onClick: handlers.goToWallet,
        }),
    },
    {
        id: 'add-credential',
        slot: 'collect',
        eligible: state => state.credentialsCount > 0,
        weight: () => 10,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: 'Add a credential',
            caption: 'Save another to your passport',
            onClick: handlers.goToAddCredential,
        }),
    },
    {
        id: 'find-credential-apps',
        slot: 'collect',
        eligible: () => true,
        weight: () => 5,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: 'Find credential apps',
            caption: 'Discover places that issue credentials',
            onClick: handlers.goToBrowseAppStore,
        }),
    },

    {
        id: 'see-insights',
        slot: 'understand',
        eligible: state => state.showAiInsights && state.credentialsCount > 0,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.understand,
            label: 'See insights',
            caption: 'AI summary of your record',
            onClick: handlers.goToInsights,
        }),
    },
    {
        id: 'insights-preview',
        slot: 'understand',
        eligible: state => state.showAiInsights && state.credentialsCount === 0,
        weight: () => 50,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.understand,
            label: 'See what insights can do',
            caption: 'Preview the AI summary',
            onClick: handlers.goToInsights,
        }),
    },
    {
        id: 'view-skills',
        slot: 'understand',
        eligible: state => !state.showAiInsights && state.skillsCount > 0,
        weight: state => 50 + Math.min(state.skillsCount, 50),
        build: (state, { handlers, icons }) => ({
            Icon: icons.understand,
            label: 'View skills',
            caption: `${state.skillsCount} skill${state.skillsCount === 1 ? '' : 's'} collected`,
            onClick: handlers.goToSkills,
        }),
    },
    {
        id: 'see-skills',
        slot: 'understand',
        eligible: state => !state.showAiInsights,
        weight: () => 10,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.understand,
            label: 'See your skills',
            caption: 'Skills you\u2019ve collected',
            onClick: handlers.goToSkills,
        }),
    },

    {
        id: 'continue-goal',
        slot: 'navigate',
        eligible: state => state.hasGoal && state.pathwaysEnabled,
        weight: () => 100,
        build: (state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: 'Continue journey',
            caption: state.nextNodeTitle || 'Open your journey',
            onClick: handlers.goToPathway,
        }),
    },
    {
        id: 'set-goal',
        slot: 'navigate',
        eligible: state => !state.hasGoal,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: 'Set a goal',
            caption: 'Get a personal path',
            onClick: handlers.goToSetGoal,
        }),
    },
    {
        id: 'browse-pathways',
        slot: 'navigate',
        eligible: state => state.pathwaysEnabled,
        weight: () => 10,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: 'Explore journeys',
            caption: 'Browse other pathways',
            onClick: handlers.goToBrowsePathways,
        }),
    },
    {
        id: 'set-goal-fallback',
        slot: 'navigate',
        eligible: state => !state.pathwaysEnabled || state.hasGoal,
        weight: () => 5,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: 'Set another goal',
            caption: 'Add a new path to follow',
            onClick: handlers.goToSetGoal,
        }),
    },
];
