import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { IssueSuccess } from './IssueSuccess';
import type { SimpleCredentialType } from '../../../components/simple-send/simpleSend.helpers';

/**
 * `IssueSuccess` is the post-issuance confirmation screen. Its layout branches
 * on `claimLink` (link/QR view) vs `recipientMode` (sent-to-people vs saved to
 * wallet). The `on*` callbacks auto-log via the global `argTypesRegex` action
 * mapping; `useToast` resolves via the global `ModalsProvider` decorator.
 */
const meta: Meta<typeof IssueSuccess> = {
    title: 'Issue/IssueSuccess',
    component: IssueSuccess,
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof IssueSuccess>;

const SAMPLE_CREDENTIAL: Record<string, unknown> = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'did:example:issuer', name: 'Learning Economy' },
    validFrom: '2026-01-01T00:00:00.000Z',
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

const CREDENTIAL_TYPE: SimpleCredentialType = 'badge';

/** Self-issue — credential signed and saved to the issuer's own wallet. */
export const SelfSuccess: Story = {
    args: {
        credential: SAMPLE_CREDENTIAL,
        credentialType: CREDENTIAL_TYPE,
        recipientMode: 'self',
        recipients: [],
        claimLink: null,
    },
};

/** Sent to specific people — summarizes the recipient list. */
export const SentToPeople: Story = {
    args: {
        credential: SAMPLE_CREDENTIAL,
        credentialType: CREDENTIAL_TYPE,
        recipientMode: 'people',
        recipients: [
            { kind: 'profile', profileId: 'ada', displayName: 'Ada Lovelace' },
            { kind: 'email', email: 'katherine@example.com' },
        ],
        claimLink: null,
    },
};

/** Link mode — QR code, copy/share actions, and optional claim limits. */
export const LinkReady: Story = {
    args: {
        credential: SAMPLE_CREDENTIAL,
        credentialType: CREDENTIAL_TYPE,
        recipientMode: 'link',
        recipients: [],
        claimLink: 'https://learncard.app/claim/abc123',
        linkOptions: { expiresAt: '2026-12-31', maxClaims: 25 },
    },
};
