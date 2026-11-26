import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppItem } from './AppItem';
import { AppLabel } from './AppLabel';
import { AppList, type AppListLines } from './AppList';

/**
 * Synthetic AppList / AppItem / AppLabel matrix covering the props the app uses. The preview has no
 * Ionic mode switcher, so each column pins `mode` to show the md and ios looks side by side.
 */
const MODES = ['md', 'ios'] as const;

const ListMatrix: React.FC<{ lines?: AppListLines }> = ({ lines }) => (
    <div className="flex flex-wrap gap-6 bg-grayscale-100 p-6">
        {MODES.map(mode => (
            <div key={mode} className="flex w-[300px] flex-col gap-2">
                <span className="font-mono text-xs">{mode}</span>
                <AppList mode={mode} lines={lines}>
                    <AppItem mode={mode}>Plain row</AppItem>
                    <AppItem mode={mode} lines="full">
                        lines=&quot;full&quot;
                    </AppItem>
                    <AppItem mode={mode} button onClick={() => undefined}>
                        Button row
                    </AppItem>
                    <AppItem mode={mode} button detail={false} onClick={() => undefined}>
                        Button row, no detail
                    </AppItem>
                    <AppItem mode={mode} button disabled>
                        Disabled button row
                    </AppItem>
                    <AppItem mode={mode} lines="none">
                        <AppLabel>Label filling a lines=&quot;none&quot; row</AppLabel>
                    </AppItem>
                </AppList>
            </div>
        ))}
    </div>
);

const CallSites: React.FC = () => (
    <div className="flex flex-wrap gap-6 bg-grayscale-100 p-6">
        <AppList className="py-4 rounded-[20px] bg-white w-[260px]">
            {['Recent', 'Alphabetical'].map(title => (
                <AppItem
                    key={title}
                    className="font-notoSans text-sm flex items-center justify-start text-left"
                    lines="none"
                    button
                    detail={false}
                    onClick={() => undefined}
                >
                    Sort by {title}
                </AppItem>
            ))}
        </AppList>
        <AppList lines="none" className="bg-transparent w-[260px]">
            <AppItem
                button
                detail={false}
                className="rounded-[12px] bg-grayscale-200 [--background:transparent] [--inner-padding-end:0] [--padding-start:12px] [--padding-end:12px]"
            >
                <AppLabel className="text-sm font-medium text-grayscale-900 font-poppins py-1">
                    Custom padding via --vars
                </AppLabel>
            </AppItem>
        </AppList>
        <p className="w-[260px]">
            Inline <AppLabel className="font-semibold">AppLabel</AppLabel> outside an item.
        </p>
    </div>
);

const meta: Meta<typeof ListMatrix> = {
    title: 'List/AppList',
    component: ListMatrix,
};

export default meta;

type Story = StoryObj<typeof ListMatrix>;

export const Default: Story = {};

export const LinesNone: Story = { args: { lines: 'none' } };

export const CallSitePatterns: Story = { render: () => <CallSites /> };
