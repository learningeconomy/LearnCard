import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppCard, AppCardContent } from './AppCard';
import { AppRippleEffect } from './AppRippleEffect';
import { AppText } from './AppText';
import { AppAvatar, AppThumbnail } from './AppThumbnail';

/** Synthetic AppText, AppThumbnail, AppAvatar, AppCard and AppRippleEffect examples. */
const IMG =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#6366f1"/><circle cx="40" cy="30" r="18" fill="#fbbf24"/></svg>'
    );
const MODES = ['md', 'ios'] as const;
const caption: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12 };

const Display: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, maxWidth: 520 }}>
        <p>
            <AppText color="danger">danger</AppText>, <AppText color="primary">primary</AppText>,{' '}
            <AppText color="medium">medium</AppText> and <AppText>uncolored</AppText> text.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AppThumbnail>
                <img alt="Synthetic thumbnail" src={IMG} />
            </AppThumbnail>
            {MODES.map(mode => (
                <AppAvatar key={mode} mode={mode}>
                    <img alt={`Synthetic ${mode} avatar`} src={IMG} />
                </AppAvatar>
            ))}
            <span style={caption}>thumbnail, md avatar, ios avatar</span>
        </div>
        {MODES.map(mode => (
            <AppCard key={mode} mode={mode} color={mode === 'ios' ? 'light' : undefined}>
                <AppCardContent mode={mode}>
                    <h2>{mode} card</h2>
                    <p>Card content with Ionic&apos;s heading and paragraph type.</p>
                </AppCardContent>
            </AppCard>
        ))}
        <button
            type="button"
            className="ion-activatable"
            style={{
                position: 'relative',
                overflow: 'hidden',
                padding: 16,
                textAlign: 'left',
                background: '#f3f4f6',
                borderRadius: 8,
            }}
        >
            Press and hold for the ink ripple
            <AppRippleEffect />
        </button>
    </div>
);

const meta: Meta<typeof AppText> = {
    title: 'Widgets/Display',
    component: AppText,
};

export default meta;

type Story = StoryObj<typeof AppText>;

export const TextThumbnailsCardsRipple: Story = { render: () => <Display /> };
