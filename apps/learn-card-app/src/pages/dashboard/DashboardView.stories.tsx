import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { expect, userEvent, within } from '@storybook/test';

import DashboardView from './DashboardView';
import { DASHBOARD_PERSONAS, personaCredentials } from './dashboard.personas';

// Freezes the clock so the time-of-day greeting ("Good morning/afternoon/evening")
// is deterministic across Chromatic runs. Without this, getTimeOfDayGreeting() reads
// the real clock and snapshots flip depending on when the cloud runner captures them.
const FROZEN_NOW = new Date('2024-01-01T09:00:00'); // 09:00 → always "Good morning"

const FreezeClock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const RealDate = Date;

    if ((globalThis.Date as unknown) === RealDate) {
        class FrozenDate extends RealDate {
            constructor(...args: ConstructorParameters<typeof RealDate>) {
                if (args.length === 0) {
                    super(FROZEN_NOW.getTime());
                } else {
                    super(...args);
                }
            }

            static now(): number {
                return FROZEN_NOW.getTime();
            }
        }

        globalThis.Date = FrozenDate as unknown as DateConstructor;
    }

    return <>{children}</>;
};

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
            <FreezeClock>
                <MemoryRouter>
                    <SeedCredentials>
                        <div className="bg-grayscale-100 min-h-screen w-full">
                            <Story />
                        </div>
                    </SeedCredentials>
                </MemoryRouter>
            </FreezeClock>
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
    tags: ['credential-options'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);
        const [optionsButton] = await canvas.findAllByRole('button', {
            name: 'More options',
        });

        await userEvent.click(optionsButton);
        await expect(await page.findByRole('button', { name: 'Share' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'View Data' })).toBeVisible();
        await userEvent.click(page.getByRole('button', { name: 'Close' }));
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
