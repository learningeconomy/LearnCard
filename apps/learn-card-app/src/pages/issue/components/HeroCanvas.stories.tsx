import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { HeroCanvas } from './HeroCanvas';
import type { SimpleCredentialType } from '../../../components/simple-send/simpleSend.helpers';

/**
 * `HeroCanvas` is the sticky live-preview card beside the issue form. With no
 * `credentialType`/`credential` it shows the skeleton prompt; once both are
 * present it renders the real `BoostEarnedCard`. `cardTitle` and `hasImage`
 * drive the pulse/glow micro-animations on change.
 */
const meta: Meta<typeof HeroCanvas> = {
    title: 'Issue/HeroCanvas',
    component: HeroCanvas,
    parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof HeroCanvas>;

const SAMPLE_CREDENTIAL: Record<string, unknown> = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'did:example:issuer', name: 'Learning Economy' },
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            type: ['Achievement'],
            achievementType: 'Badge',
            name: 'Intro to Storybook',
            description: 'Completed the Storybook fundamentals module.',
        },
    },
};

const BADGE: SimpleCredentialType = 'badge';

/** No type selected yet — skeleton card with the "pick a type" prompt. */
export const EmptySkeleton: Story = {
    args: {
        credential: null,
        credentialType: null,
    },
};

/** A designed credential renders the real preview card. */
export const WithCredential: Story = {
    args: {
        credential: SAMPLE_CREDENTIAL,
        credentialType: BADGE,
        cardTitle: 'Intro to Storybook',
    },
};

/** `hasImage` triggers the image-drop animation and glow accent. */
export const WithImage: Story = {
    args: {
        credential: {
            ...SAMPLE_CREDENTIAL,
            credentialSubject: {
                ...(SAMPLE_CREDENTIAL.credentialSubject as Record<string, unknown>),
                achievement: {
                    ...((SAMPLE_CREDENTIAL.credentialSubject as Record<string, unknown>)
                        .achievement as Record<string, unknown>),
                    image: 'https://placehold.co/220x220/18224E/FFFFFF/png?text=Badge',
                },
            },
        },
        credentialType: BADGE,
        cardTitle: 'Intro to Storybook',
        hasImage: true,
    },
};

const ID_CREDENTIAL: Record<string, unknown> = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'did:example:issuer', name: 'Learning Economy' },
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            type: ['Achievement'],
            achievementType: 'License',
            name: 'Pro License',
            description: 'A professional license.',
        },
    },
};

export const WithIDCredential: Story = {
    args: {
        credential: ID_CREDENTIAL,
        credentialType: 'id',
        cardTitle: 'Pro License',
    },
};
