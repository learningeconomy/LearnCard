import React from 'react';
import { Story, Meta } from '@storybook/react';

import SmallVCCard from './SmallVCCard';
import { SmallVCCardProps } from '../../types';

export default {
    title: 'SmallVCCard',
    component: SmallVCCard,
    argTypes: {},
} as Meta<typeof SmallVCCard>;

const Template: Story<SmallVCCardProps> = args => <SmallVCCard {...args} />;

export const SmallVCCardTest = Template.bind({});
SmallVCCardTest.args = {
    title: 'Learning History',
    thumbImgSrc: null,
    date: 'Apr 22 2022',
    onClick: () => {
        console.log('//goodbye world');
    },

};
