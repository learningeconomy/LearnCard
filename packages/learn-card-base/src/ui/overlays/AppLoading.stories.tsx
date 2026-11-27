import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppLoading } from './AppLoading';

/** AppLoading in both modes, plus the transparent `cssClass` variant ClaimFromDashboard uses. */
const Launcher: React.FC = () => {
    const [open, setOpen] = useState<string | null>(null);
    const variants = [
        { id: 'md', mode: 'md' as const, message: 'Fetching Data Source' },
        { id: 'ios', mode: 'ios' as const, message: 'Logging out...' },
        {
            id: 'clear',
            mode: 'ios' as const,
            message: 'Claiming...',
            cssClass: '[--background:none]',
        },
    ];
    return (
        <div style={{ display: 'flex', gap: 16, padding: 24 }}>
            {variants.map(v => (
                <React.Fragment key={v.id}>
                    <button type="button" onClick={() => setOpen(v.id)}>
                        {v.id} (closes after 2s)
                    </button>
                    <AppLoading
                        isOpen={open === v.id}
                        mode={v.mode}
                        message={v.message}
                        cssClass={v.cssClass}
                        duration={2000}
                        onDidDismiss={() => setOpen(null)}
                    />
                </React.Fragment>
            ))}
        </div>
    );
};

const meta: Meta<typeof AppLoading> = {
    title: 'Overlays/AppLoading',
    component: AppLoading,
};

export default meta;

type Story = StoryObj<typeof AppLoading>;

export const Variants: Story = { render: () => <Launcher /> };
