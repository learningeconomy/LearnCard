import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCDisplayCard, { VCDisplayCardPropsReal } from './VCDisplayCard';
import { VerificationStatusEnum } from '@learncard/types';

export default {
    title: 'VCDisplayCard',
    component: VCDisplayCard,
    argTypes: {},
} as Meta<typeof VCDisplayCard>;

const Template: Story<VCDisplayCardPropsReal> = args => <VCDisplayCard {...args} />;

export const VCDisplayCardTest = Template.bind({});

// See https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/
// For example data structure for plugfest

VCDisplayCardTest.args = {
    credential: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: {
            type: 'Profile',
            id: 'did:example:123',
            name: 'Jobs for the Future (JFF)',
            url: 'https://www.jff.org/',
            image: 'https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            type: 'AchievementSubject',
            id: 'did:example:123',
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
        },
    },
    issueeOverride: {
        name: 'Test Person',
    },
    loading: false,
    verification: [
        {
            check: 'proof',
            status: VerificationStatusEnum.Success,
            message: 'Valid • Does Not Expire',
        },
    ],
};
