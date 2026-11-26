import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    alertCircleOutline,
    americanFootballOutline,
    arrowDownLeftBox,
    checkmarkCircle,
    homeOutline,
    lockClosed,
    refreshOutline,
    star,
    starOutline,
} from 'ionicons/icons';

import { AppButton } from '../controls/AppButton';
import { AppIcon } from './AppIcon';

/** Synthetic AppIcon matrix covering the props and sizing patterns the app's call sites use. */
const SHAPES = [
    alertCircleOutline,
    checkmarkCircle,
    star,
    starOutline,
    lockClosed,
    americanFootballOutline,
    arrowDownLeftBox,
];

const Matrix: React.FC = () => (
    <div className="flex flex-col gap-4 bg-grayscale-100 p-6 text-grayscale-900">
        <div className="flex items-center gap-4">
            {SHAPES.map(icon => (
                <AppIcon key={icon} icon={icon} className="text-2xl" />
            ))}
        </div>
        <div className="flex items-center gap-4">
            <AppIcon icon={star} />
            <AppIcon icon={star} className="text-xl" />
            <AppIcon icon={star} className="w-5 h-5" />
            <AppIcon icon={star} className="text-4xl text-emerald-500" />
            <AppIcon icon={star} style={{ fontSize: '48px' }} />
        </div>
        <div className="flex items-center gap-4">
            <AppIcon icon={alertCircleOutline} color="danger" className="text-2xl" />
            <AppIcon icon={alertCircleOutline} color="primary" className="text-2xl" />
            <AppIcon icon={alertCircleOutline} color="grayscale-800" className="text-2xl" />
            <AppIcon icon={alertCircleOutline} size="small" />
            <AppIcon icon={alertCircleOutline} size="large" />
        </div>
    </div>
);

const InButtons: React.FC = () => (
    <div className="flex flex-col gap-4 bg-grayscale-100 p-6">
        <AppButton expand="block">
            <AppIcon slot="start" icon={refreshOutline} />
            Try Again
        </AppButton>
        <AppButton expand="block" color="medium" fill="outline">
            <AppIcon slot="start" icon={homeOutline} />
            Go to Home
        </AppButton>
    </div>
);

const meta: Meta<typeof AppIcon> = {
    title: 'Icon/AppIcon',
    component: AppIcon,
};

export default meta;

type Story = StoryObj<typeof AppIcon>;

export const ShapesSizesColors: Story = { render: () => <Matrix /> };

export const InAppButtons: Story = { render: () => <InButtons /> };
