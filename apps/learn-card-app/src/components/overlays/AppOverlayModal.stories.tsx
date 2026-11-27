import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppOverlayManager } from './AppOverlayManager';
import { AppOverlayModal } from './AppOverlayModal';
import { useAppOverlayModal } from './useAppOverlayModal';

const Body: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
    <div style={{ padding: 24, background: '#fff', height: '100%' }}>
        <h2 style={{ marginBottom: 12 }}>{title}</h2>
        <button type="button" onClick={onClose}>
            Close
        </button>
    </div>
);

/** Declarative AppOverlayModal: a centered dialog and a sheet with a cycling handle. */
const Inline: React.FC = () => {
    const [open, setOpen] = useState<string | null>(null);
    const close = () => setOpen(null);
    return (
        <div style={{ display: 'flex', gap: 16, padding: 24 }}>
            <button type="button" onClick={() => setOpen('center')}>
                center-modal
            </button>
            <button type="button" onClick={() => setOpen('sheet')}>
                sheet (0.8, cycle)
            </button>
            <AppOverlayModal
                isOpen={open === 'center'}
                cssClass="center-modal add-contact-modal"
                onDidDismiss={close}
            >
                <div className="ion-page">
                    <Body title="Centered dialog" onClose={close} />
                </div>
            </AppOverlayModal>
            <AppOverlayModal
                isOpen={open === 'sheet'}
                breakpoints={[0, 0.8, 0.9, 1]}
                initialBreakpoint={0.8}
                handleBehavior="cycle"
                onDidDismiss={close}
            >
                <div className="ion-page">
                    <Body title="Sheet" onClose={close} />
                </div>
            </AppOverlayModal>
        </div>
    );
};

/** useAppOverlayModal (the useIonModal replacement), rendered by AppOverlayManager. */
const Hook: React.FC = () => {
    const [present, dismiss] = useAppOverlayModal(Body, {
        title: 'Opened with useAppOverlayModal',
        onClose: () => dismiss(),
    });
    return (
        <div style={{ padding: 24 }}>
            <button
                type="button"
                onClick={() => present({ cssClass: 'center-modal user-options-modal' })}
            >
                present()
            </button>
            <AppOverlayManager />
        </div>
    );
};

const meta: Meta<typeof AppOverlayModal> = {
    title: 'Overlays/AppOverlayModal',
    component: AppOverlayModal,
};

export default meta;

type Story = StoryObj<typeof AppOverlayModal>;

export const Modals: Story = { render: () => <Inline /> };

export const UseAppOverlayModal: Story = { render: () => <Hook /> };
