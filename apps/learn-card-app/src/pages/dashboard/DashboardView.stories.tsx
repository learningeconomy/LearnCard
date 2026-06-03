import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import DashboardView from './DashboardView';
import {
    brandNewUser,
    activeLearner,
    returningNoActivity,
    pendingOnly,
    loadingState,
} from './dashboard.personas';

const meta: Meta<typeof DashboardView> = {
    title: 'Dashboard/DashboardView',
    component: DashboardView,
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof DashboardView>;

export const BrandNewUser: Story = { args: { vm: brandNewUser } };
export const ActiveLearner: Story = { args: { vm: activeLearner } };
export const ReturningEmptyFeed: Story = { args: { vm: returningNoActivity } };
export const PendingActionsOnly: Story = { args: { vm: pendingOnly } };
export const Loading: Story = { args: { vm: loadingState } };

export const BrandNewUserNarrow: Story = {
    args: { vm: brandNewUser },
    parameters: { viewport: { defaultViewport: 'tablet' } },
};

const Playground: React.FC<{
    hasCredentials: boolean;
    credentialCount: number;
    hasGoal: boolean;
    hasActivity: boolean;
    showAiInsights: boolean;
}> = ({ hasCredentials, credentialCount, hasGoal, hasActivity, showAiInsights }) => {
    const base = hasGoal ? activeLearner : brandNewUser;

    const vm = {
        ...base,
        heroSlot: hasCredentials && hasGoal ? ('goal' as const) : ('getStarted' as const),
        header: {
            ...base.header,
            stats: {
                ...base.header.stats,
                credentials: hasCredentials ? credentialCount : 0,
            },
        },
        goalSummary: hasGoal ? activeLearner.goalSummary : null,
        slots: {
            collect: {
                ...base.slots.collect!,
                label: hasCredentials ? 'View passport' : 'Find credential apps',
                caption: hasCredentials ? `${credentialCount} credentials` : 'Discover apps',
            },
            understand: {
                ...base.slots.understand!,
                label: showAiInsights ? 'See insights' : 'See your skills',
            },
            navigate: {
                ...base.slots.navigate!,
                label: hasGoal ? 'Explore journeys' : 'Set a goal',
            },
        },
        activity: {
            ...base.activity,
            notifications: hasActivity ? activeLearner.activity.notifications : [],
            pendingConnections: hasActivity ? activeLearner.activity.pendingConnections : [],
            records: hasActivity ? activeLearner.activity.records : [],
        },
    };

    return <DashboardView vm={vm} />;
};

export const ControlsPlayground: StoryObj<typeof Playground> = {
    render: args => <Playground {...args} />,
    args: {
        hasCredentials: true,
        credentialCount: 12,
        hasGoal: true,
        hasActivity: true,
        showAiInsights: true,
    },
    argTypes: {
        credentialCount: { control: { type: 'range', min: 0, max: 99, step: 1 } },
    },
};
