import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCDisplayCard, { VCDisplayCardProps} from './VCDisplayCard';

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
    title: 'Our Wallet Passed JFF Plugfest #1 2022',
    createdAt: '01 May, 2022',
    issuerImage: "https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png",
    userImage: "https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000",
    credentialSubject: {
        "type": "AchievementSubject",
        "id": "did:key:123",
        "achievement": {
          "type": "Achievement",
          "name": "Our Wallet Passed JFF Plugfest #1 2022",
          "description": "This wallet can display this Open Badge 3.0",
          "criteria": {
            "type": "Criteria",
            "narrative": "The first cohort of the JFF Plugfest 1 in May/June of 2021 collaborated to push interoperability of VCs in education forward."
          },
          "image": "https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/plugfest-1-badge-image.png",
    },
    onClick: () => {
        console.log('Hello World');
    },
};
