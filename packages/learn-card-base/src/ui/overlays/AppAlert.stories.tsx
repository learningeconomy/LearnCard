import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppAlert } from './AppAlert';
import { useAppAlert } from './useAppAlert';

/** Inline AppAlert (confirm in md, destructive in ios) and the useAppAlert hook. */
const Inline: React.FC = () => {
    const [open, setOpen] = useState<string | null>(null);
    return (
        <div style={{ display: 'flex', gap: 16, padding: 24 }}>
            <button type="button" onClick={() => setOpen('confirm')}>
                confirm (md, boost-confirmation-alert)
            </button>
            <button type="button" onClick={() => setOpen('discard')}>
                discard (ios)
            </button>
            <AppAlert
                isOpen={open === 'confirm'}
                mode="md"
                cssClass="boost-confirmation-alert"
                header="Remove connection?"
                message="You can reconnect later."
                buttons={[
                    { text: 'Cancel', role: 'cancel' },
                    { text: 'Remove', role: 'confirm' },
                ]}
                onDidDismiss={() => setOpen(null)}
            />
            <AppAlert
                isOpen={open === 'discard'}
                mode="ios"
                header="Discard credential?"
                buttons={[
                    { text: 'Cancel', role: 'cancel' },
                    { text: 'Discard', role: 'destructive' },
                ]}
                onDidDismiss={() => setOpen(null)}
            />
        </div>
    );
};

const Hook: React.FC = () => {
    const [present] = useAppAlert();
    return (
        <div style={{ display: 'flex', gap: 16, padding: 24 }}>
            <button type="button" onClick={() => present('Signed in with a different account.')}>
                present(message)
            </button>
            <button
                type="button"
                onClick={() =>
                    present({
                        header: 'Enter PIN',
                        inputs: [{ name: 'pin', placeholder: 'PIN', attributes: { maxlength: 4 } }],
                        buttons: [
                            { text: 'Cancel', role: 'cancel' },
                            {
                                text: 'Unlock',
                                handler: values => (values?.pin ? undefined : false),
                            },
                        ],
                    })
                }
            >
                present(options) with a PIN input
            </button>
        </div>
    );
};

const meta: Meta<typeof AppAlert> = {
    title: 'Overlays/AppAlert',
    component: AppAlert,
};

export default meta;

type Story = StoryObj<typeof AppAlert>;

export const Alerts: Story = { render: () => <Inline /> };

export const UseAppAlert: Story = { render: () => <Hook /> };
