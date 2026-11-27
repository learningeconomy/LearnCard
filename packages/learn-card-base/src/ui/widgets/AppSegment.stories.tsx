import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppLabel } from '../list/AppLabel';
import { AppSegment, AppSegmentButton } from './AppSegment';

/**
 * Synthetic AppSegment tab bars. The buttons always use Ionic's ios look (every call site pinned
 * `mode="ios"`); the segment itself follows `mode`, so each row pins it to show both.
 */
const TABS = ['Overview', 'Details', 'History'] as const;
type Tab = (typeof TABS)[number];

const TabBar: React.FC<{ mode: 'md' | 'ios' }> = ({ mode }) => {
    const [value, setValue] = useState<Tab>('Overview');
    const [changes, setChanges] = useState(0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                mode={mode} value={value} changes={changes}
            </span>
            <AppSegment<Tab>
                mode={mode}
                value={value}
                onValueChange={next => {
                    setValue(next);
                    setChanges(count => count + 1);
                }}
            >
                {TABS.map(tab => (
                    <AppSegmentButton key={tab} value={tab}>
                        <AppLabel>{tab}</AppLabel>
                    </AppSegmentButton>
                ))}
            </AppSegment>
        </div>
    );
};

const Modes: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
        <TabBar mode="md" />
        <TabBar mode="ios" />
    </div>
);

const meta: Meta<typeof AppSegment> = {
    title: 'Widgets/AppSegment',
    component: AppSegment,
};

export default meta;

type Story = StoryObj<typeof AppSegment>;

/** Click, drag from the checked tab, or use the arrow keys, Home, End, Enter and Space. */
export const TabBars: Story = { render: () => <Modes /> };
