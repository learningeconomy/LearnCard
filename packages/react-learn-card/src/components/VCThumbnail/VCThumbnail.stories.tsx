import React from 'react';
import type { Story, Meta } from '@storybook/react';

import VCThumbnail from './VCThumbnail';
import type { VCThumbnailProps } from './types';

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
    userImageComponent: (
        <div className="inline-block relative overflow-hidden rounded-full shadow-3xl h-0 w-1/4 pb-[25%] bg-cyan-600 text-white font-medium text-3xl">
            <p className="pt-[20%]">LC</p>
        </div>
    ),
    badgeImage: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/plugfest-1-badge-image.png',
    listView: false,
    onClick: () => {
        console.log('Hello World');
    },
};
