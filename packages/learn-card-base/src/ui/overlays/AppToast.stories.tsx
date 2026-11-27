import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppToast } from './AppToast';
import { useAppToast } from './useAppToast';

/** Inline AppToast (success / danger, both modes) and the useAppToast hook. */
const Inline: React.FC = () => {
    const [open, setOpen] = useState<string | null>(null);
    const variants = [
        {
            id: 'success-md',
            mode: 'md' as const,
            color: 'success' as const,
            message: 'Link copied to clipboard!',
        },
        {
            id: 'danger-ios',
            mode: 'ios' as const,
            color: 'danger' as const,
            message: 'Could not load the app.',
        },
    ];
    return (
        <div style={{ display: 'flex', gap: 16, padding: 24 }}>
            {variants.map(v => (
                <React.Fragment key={v.id}>
                    <button type="button" onClick={() => setOpen(v.id)}>
                        {v.id}
                    </button>
                    <AppToast
                        isOpen={open === v.id}
                        mode={v.mode}
                        color={v.color}
                        message={v.message}
                        position="top"
                        duration={2000}
                        onDidDismiss={() => setOpen(null)}
                    />
                </React.Fragment>
            ))}
        </div>
    );
};

const Hook: React.FC = () => {
    const [present, dismiss] = useAppToast();
    return (
        <div style={{ display: 'flex', gap: 16, padding: 24 }}>
            <button
                type="button"
                onClick={() =>
                    present({ message: 'Framework created!', duration: 2000, color: 'success' })
                }
            >
                present (success)
            </button>
            <button type="button" onClick={() => present('Error: something failed', 3000)}>
                present(message, duration)
            </button>
            <button type="button" onClick={() => dismiss()}>
                dismiss
            </button>
        </div>
    );
};

const meta: Meta<typeof AppToast> = {
    title: 'Overlays/AppToast',
    component: AppToast,
};

export default meta;

type Story = StoryObj<typeof AppToast>;

export const Toasts: Story = { render: () => <Inline /> };

export const UseAppToast: Story = { render: () => <Hook /> };
