import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCDisplayCard, { VCDisplayCardProps } from './VCDisplayCard';
import { VerificationStatus } from 'learn-card-types';

export default {
    title: 'VCDisplayCard',
    component: VCDisplayCard,
    argTypes: {},
} as Meta<typeof VCDisplayCard>;

const Template: Story<VCDisplayCardProps> = args => <VCDisplayCard {...args} />;

export const VCDisplayCardTest = Template.bind({});

// See https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/
// For example data structure for plugfest

VCDisplayCardTest.args = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json',
    ],
    title: 'Our Wallet Passed JFF Plugfest #1 2022',
    createdAt: '01 May, 2022',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuanceDate: '2022-05-01T00:00:00Z',
    issuer: {
        type: 'Profile',
        id: 'did:key:z6MkrHKzgsahxBLyNAbLQyB1pcWNYC9GmywiWPgkrvntAZcj',
        name: 'Jobs for the Future (JFF)',
        url: 'https://www.jff.org/',
        image: 'https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
    },
    issuee: {
        type: 'Profile',
        id: '1234',
        name: 'Janet Yoon',
        url: 'https://ebae.com',
        image: 'https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000',
    },
    userImage:
        'https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000',
    credentialSubject: {
        type: 'AchievementSubject',
        id: 'did:key:123',
        achievement: {
            type: 'Achievement',
            name: 'Our Wallet Passed JFF Plugfest #1 2022',
            description: 'This wallet can display this Open Badge 3.0',
            criteria: {
                type: 'Criteria',
                narrative:
                    'The first cohort of the JFF Plugfest 1 in May/June of 2021 collaborated to push interoperability of VCs in education forward.',
            },
            image: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/plugfest-1-badge-image.png',
        },
        proof: {
            type: 'Ed25519Signature2018',
            created: '2022-05-31T21:09:29Z',
            verificationMethod:
                'did:key:z6MkrHKzgsahxBLyNAbLQyB1pcWNYC9GmywiWPgkrvntAZcj#z6MkrHKzgsahxBLyNAbLQyB1pcWNYC9GmywiWPgkrvntAZcj',
            proofPurpose: 'assertionMethod',
            jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..Q05Nb7ufRWi8b8MO11einZZzRgwU9iauqiKoB-tKCGRUIGWTM_-HUQMXsSE9rYm3wuv45qa5gl4TIl5lwWgvDA',
        },
    },
    onClick: () => {
        console.log('Hello World');
    },
    loading: false,
    verification: [
        { status: VerificationStatus.Success, check: 'proof' },
        { status: VerificationStatus.Failed, check: 'expiration', message: 'Expired 05 MAY 2021' },
    ],
};
