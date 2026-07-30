import * as m from '../../../paraglide/messages.js';

import type { ActionDescriptor } from './types';

export const DEFAULT_REGISTRY: ActionDescriptor[] = [
    {
        id: 'connect-new',
        slot: 'collect',
        eligible: state => state.credentialsCount === 0,
        weight: () => 100,
        build: (state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: m['dashboard.quickActions.connectNewLabel']({ brand: state.brandName }),
            caption: m['dashboard.quickActions.connectNewCaption'](),
            onClick: handlers.goToAddCredential,
        }),
    },
    {
        id: 'collect-add',
        slot: 'collect',
        eligible: () => true,
        weight: () => 90,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: m['dashboard.quickActions.addToPassportLabel'](),
            caption: m['dashboard.quickActions.addToPassportCaption'](),
            onClick: handlers.openAddToPassport,
        }),
    },
    {
        id: 'connect-active',
        slot: 'collect',
        eligible: state => state.credentialsCount > 0,
        weight: () => 80,
        build: (state, { handlers, icons }) => ({
            Icon: icons.collect,
            label: m['dashboard.quickActions.connectActiveLabel'](),
            caption:
                state.credentialsCount === 1
                    ? m['dashboard.quickActions.connectActiveCaptionOne']({
                          count: state.credentialsCount,
                      })
                    : m['dashboard.quickActions.connectActiveCaptionMany']({
                          count: state.credentialsCount,
                      }),
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
            label: m['dashboard.quickActions.understandNewLabel'](),
            caption: m['dashboard.quickActions.understandNewCaption'](),
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
                      label: m['dashboard.quickActions.insightsLabel'](),
                      caption: m['dashboard.quickActions.insightsCaption'](),
                      onClick: handlers.goToInsights,
                  }
                : {
                      Icon: icons.understand,
                      label: m['dashboard.quickActions.skillsLabel'](),
                      caption: m['dashboard.quickActions.skillsCaption'](),
                      onClick: handlers.goToSkills,
                  },
    },

    {
        id: 'navigate-new',
        slot: 'navigate',
        eligible: state => state.pathwaysEnabled && !state.hasGoal,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: m['dashboard.quickActions.setGoalLabel'](),
            caption: m['dashboard.quickActions.setGoalCaption'](),
            onClick: handlers.goToSetGoal,
        }),
    },
    {
        id: 'navigate-active',
        slot: 'navigate',
        eligible: state => state.pathwaysEnabled && state.hasGoal,
        weight: () => 100,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: m['dashboard.quickActions.pathwaysLabel'](),
            caption: m['dashboard.quickActions.pathwaysCaption'](),
            onClick: handlers.goToPathway,
        }),
    },
    {
        id: 'navigate-browse',
        slot: 'navigate',
        eligible: state => state.pathwaysEnabled,
        weight: () => 10,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: m['dashboard.quickActions.browsePathwaysLabel'](),
            caption: m['dashboard.quickActions.browsePathwaysCaption'](),
            onClick: handlers.goToBrowsePathways,
        }),
    },
    {
        id: 'navigate-apps',
        slot: 'navigate',
        eligible: state => !state.pathwaysEnabled,
        weight: () => 10,
        build: (_state, { handlers, icons }) => ({
            Icon: icons.navigate,
            label: m['dashboard.quickActions.discoverAppsLabel'](),
            caption: m['dashboard.quickActions.discoverAppsCaption'](),
            onClick: handlers.goToBrowseAppStore,
        }),
    },
];
