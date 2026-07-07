import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import DataSharingCenterView from './DataSharingCenterView';
import { DATA_SHARING_PERSONAS } from './dataSharing.personas';

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

export const ActiveLearner: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Active learner'] },
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
