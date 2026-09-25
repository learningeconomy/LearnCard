import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import DataSharingCenterView from './DataSharingCenterView';
import { DATA_SHARING_PERSONAS } from './dataSharing.personas';
import type {
    DataSharingCenterViewModel,
    DataSharingSavedCollectionsViewModel,
} from './DataSharingCenter.types';

const meta: Meta<typeof DataSharingCenterView> = {
    title: 'Pages/PrivacySettings/DataSharingCenterView',
    component: DataSharingCenterView,
    decorators: [
        Story => (
            <div className="min-h-screen w-full">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof DataSharingCenterView>;

const sharedLinksPersona = DATA_SHARING_PERSONAS['Active learner · shared links'];

const savedCollectionsPersona = (
    overrides: Partial<DataSharingSavedCollectionsViewModel> = {}
): DataSharingCenterViewModel => {
    if (!sharedLinksPersona.shared) throw new Error('Shared links persona is required');

    return {
        ...sharedLinksPersona,
        shared: {
            ...sharedLinksPersona.shared,
            savedCollections: {
                ...sharedLinksPersona.shared.savedCollections,
                ...overrides,
            },
        },
    };
};

const openSavedCollections: NonNullable<Story['play']> = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Saved collections' }));
    await expect(canvas.getByRole('tab', { name: 'Saved collections' })).toHaveAttribute(
        'aria-selected',
        'true'
    );
};

export const ActiveLearner: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Active learner'] },
};

export const ActiveLearnerWithSharedLinks: Story = {
    args: { vm: sharedLinksPersona },
};

export const SavedCollections: Story = {
    args: { vm: savedCollectionsPersona() },
    play: openSavedCollections,
};

export const SavedCollectionsEmpty: Story = {
    args: { vm: savedCollectionsPersona({ records: [] }) },
    play: openSavedCollections,
};

export const SavedCollectionsLoading: Story = {
    args: { vm: savedCollectionsPersona({ records: [], isLoading: true }) },
    play: openSavedCollections,
};

export const SavedCollectionsError: Story = {
    args: { vm: savedCollectionsPersona({ records: [], error: true }) },
    play: openSavedCollections,
};

export const NothingShared: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Nothing shared'] },
};

export const ManyAppsGrouped: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Many apps · grouped'] },
};

export const AiConsentNeedsRepair: Story = {
    args: { vm: DATA_SHARING_PERSONAS['AI consent needs repair'] },
};

export const Minor: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Minor'] },
};

export const Loading: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Loading'] },
};
