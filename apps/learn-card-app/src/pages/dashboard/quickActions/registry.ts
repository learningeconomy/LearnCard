import type { ActionDescriptor } from './types';

export const DEFAULT_REGISTRY: ActionDescriptor[] = [
    {
        id: 'connect-new',
        slot: 'collect',
        eligible: state => state.credentialsCount === 0,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: 'Build Your LearnCard',
            caption: 'Add your first credential',
            onClick: handlers.goToAddCredential,
        }),
    },
    {
        id: 'connect-active',
        slot: 'collect',
        eligible: state => state.credentialsCount > 0,
        weight: () => 100,
        build: (state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: 'See Passport',
            caption: `${state.credentialsCount} credential${
                state.credentialsCount === 1 ? '' : 's'
            }`,
            onClick: handlers.goToWallet,
        }),
    },

    {
        id: 'understand-new',
        slot: 'understand',
        eligible: state => !state.hasSkillProfile,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.understand,
            label: 'Create Skill Profile',
            caption: 'Tell us about your skills',
            onClick: handlers.openSkillProfile,
        }),
    },
    {
        id: 'understand-active',
        slot: 'understand',
        eligible: state => state.hasSkillProfile,
        weight: () => 100,
        build: (state, { handlers, icons }) =>
            state.showAiInsights
                ? {
                      Icon: icons.understand,
                      label: 'See Insights',
                      caption: 'AI summary of your record',
                      onClick: handlers.goToInsights,
                  }
                : {
                      Icon: icons.understand,
                      label: 'See Skills',
                      caption: 'Skills you\u2019ve collected',
                      onClick: handlers.goToSkills,
                  },
    },

    {
        id: 'navigate-new',
        slot: 'navigate',
        eligible: state => !state.hasGoal,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: 'Set a Goal',
            caption: 'Get a personal path',
            onClick: handlers.goToSetGoal,
        }),
    },
    {
        id: 'navigate-active',
        slot: 'navigate',
        eligible: state => state.hasGoal,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: 'See Pathways',
            caption: 'Open your pathways',
            onClick: handlers.goToPathway,
        }),
    },
];
