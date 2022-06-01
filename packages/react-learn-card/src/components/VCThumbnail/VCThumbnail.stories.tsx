import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCThumbnail from './VCThumbnail';
import { VCThumbnailProps } from './types';

export default {
    title: 'VCThumbnail',
    component: VCThumbnail,
    argTypes: {},
} as Meta<typeof VCThumbnail>;

const Template: Story<VCThumbnailProps> = args => <VCThumbnail {...args} />;

export const VCThumbnailTest = Template.bind({});
VCThumbnailTest.args = {
    title: 'Our Wallet Passed JFF Plugfest #1 2022',
    createdAt: '01 May, 2022',
    issuerImage: 'https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
    userImage:
        'https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000',
    listView: false,
    onClick: () => {
        console.log('Hello World');
    },
};
