import React from 'react';
import { Story, Meta } from '@storybook/react';

import MiniVCThumbnail from './MiniVCThumbnail';
import { MiniVCThumbnailProps } from './types';

export default {
    title: 'MiniVCThumbnail',
    component: MiniVCThumbnail,
    argTypes: {},
} as Meta<typeof MiniVCThumbnail>;

const Template: Story<MiniVCThumbnailProps> = args => <MiniVCThumbnail {...args} />;

export const MiniVCThumbnailTest = Template.bind({});
MiniVCThumbnailTest.args = {
    title: 'Our Wallet Passed JFF Plugfest #1 2022',
    createdAt: '01 May, 2022',
    issuerImage: 'https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
    badgeImage: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/plugfest-1-badge-image.png',
    onClick: () => {
        console.log('Hello World');
    },
};
