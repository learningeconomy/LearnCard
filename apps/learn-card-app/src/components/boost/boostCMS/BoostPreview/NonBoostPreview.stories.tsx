import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import type { VC } from '@learncard/types';
import NonBoostPreview from './NonBoostPreview';

const credential = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: 'urn:uuid:85f16858-3c63-4bd5-8f9a-925011067e54',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'did:example:issuer', name: 'Example Learning Center' },
    validFrom: '2026-10-26T12:00:00Z',
    awardedDate: '2027-10-01T00:00:00Z',
    name: 'Web Foundations',
    credentialSubject: {
        id: 'did:example:ada',
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:ebeec83a-c3f5-4156-b8a9-d25691d7afdf',
            type: ['Achievement'],
            achievementType: 'Badge',
            name: 'Web Foundations',
            description: 'Completed Web Foundations with a score of 95%.',
            criteria: { narrative: 'Complete the course and final assessment.' },
        },
    },
    evidence: [
        {
            id: 'https://evidence.example.test/course/12',
            type: ['Evidence'],
            name: 'Course evidence',
        },
        { id: 'https://portfolio.example.test/ada', type: ['Evidence'], name: 'Portfolio' },
    ],
} as unknown as VC;

const meta: Meta<typeof NonBoostPreview> = {
    title: 'Issue/CredentialPreview',
    component: NonBoostPreview,
    parameters: { layout: 'fullscreen' },
    args: {
        credential,
        categoryType: BoostCategoryOptionsEnum.achievement,
        verificationItems: [],
        customThumbComponent: null,
        customBodyCardComponent: null,
        customFooterComponent: null,
        customIssueHistoryComponent: null,
        issuerOverride: 'Example Learning Center',
        issueeOverride: 'Ada Rivera',
        handleCloseModal: () => {},
        isPreview: true,
    },
};
export default meta;
type Story = StoryObj<typeof NonBoostPreview>;

/** Actual unsigned preview: neutral footer, two links, and a separate award date. */
export const UnsignedBadge: Story = {};

export const UnsignedCertificate: Story = {
    args: { credential: { ...credential, display: { displayType: 'certificate' } } as VC },
};
