import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppButton } from './AppButton';
import { AppButtons } from './AppButtons';
import { AppHeader, AppTitle, AppToolbar } from '../chrome';

/**
 * AppButtons in an AppToolbar, as in EmbedAppFullScreen: a clear chevron AppButton in the start
 * slot and arbitrary content in the end slot. The toolbar look follows the document mode (md in
 * a desktop browser); the preview has no mode switcher.
 */
const ToolbarPreview: React.FC = () => (
    <AppHeader>
        <AppToolbar>
            <AppButtons slot="start">
                <AppButton onClick={() => undefined}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </AppButton>
            </AppButtons>
            <AppTitle>Toolbar title</AppTitle>
            <AppButtons slot="end" className="mr-[10px]">
                <span className="inline-block h-[36px] w-[36px] rounded-full bg-grayscale-200" />
            </AppButtons>
        </AppToolbar>
    </AppHeader>
);

const meta: Meta<typeof ToolbarPreview> = {
    title: 'Controls/AppButtons',
    component: ToolbarPreview,
};

export default meta;

type Story = StoryObj<typeof ToolbarPreview>;

export const InToolbar: Story = {};
