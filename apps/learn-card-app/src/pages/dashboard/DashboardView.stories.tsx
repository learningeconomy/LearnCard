import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import DashboardView from './DashboardView';
import { DASHBOARD_PERSONAS, personaCredentials } from './dashboard.personas';

// Primes the cache with persona VCs so the wallet-less Storybook env resolves
// credential rows. Key must match useGetResolvedCredential's ['useGetResolvedCredential', uri].
const SeedCredentials: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const seeded = React.useRef(false);
    if (!seeded.current) {
        Object.entries(personaCredentials).forEach(([uri, vc]) => {
            queryClient.setQueryData(['useGetResolvedCredential', uri], vc);
        });
        seeded.current = true;
    }
    return <>{children}</>;
};

const meta: Meta<typeof DashboardView> = {
    title: 'Pages/Dashboard/DashboardView',
    component: DashboardView,
    decorators: [
        Story => (
            <MemoryRouter>
                <SeedCredentials>
                    <div className="bg-grayscale-100 min-h-screen w-full">
                        <Story />
                    </div>
                </SeedCredentials>
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

export const JourneysDisabled: Story = {
    args: {
        vm: DASHBOARD_PERSONAS['Journeys disabled'],
    },
};
