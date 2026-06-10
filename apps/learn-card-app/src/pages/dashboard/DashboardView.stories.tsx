import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import DashboardView from './DashboardView';
import { DASHBOARD_PERSONAS } from './dashboard.personas';

const meta: Meta<typeof DashboardView> = {
    title: 'Pages/Dashboard/DashboardView',
    component: DashboardView,
    decorators: [
        Story => (
            <MemoryRouter>
                <div className="bg-grayscale-100 min-h-screen w-full">
                    <Story />
                </div>
            </MemoryRouter>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof DashboardView>;

export const BrandNewUser: Story = {
    args: {
        vm: DASHBOARD_PERSONAS['Brand-new user'],
    },
};

export const ActiveLearner: Story = {
    args: {
        vm: DASHBOARD_PERSONAS['Active learner'],
    },
};

export const ReturningNoActivity: Story = {
    args: {
        vm: DASHBOARD_PERSONAS['Returning · empty feed'],
    },
};

export const PendingOnly: Story = {
    args: {
        vm: DASHBOARD_PERSONAS['Pending actions only'],
    },
};

export const Loading: Story = {
    args: {
        vm: DASHBOARD_PERSONAS['Loading'],
    },
};
