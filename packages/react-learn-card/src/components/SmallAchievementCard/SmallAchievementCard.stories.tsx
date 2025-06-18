import React from 'react';
import type { Story, Meta } from '@storybook/react';

import SmallVCCard from './SmallAchievementCard';
import type { SmallAchievementCardProps } from '../../types';

export default {
    title: 'Mini Achievement Display Card',
    component: SmallVCCard,
    argTypes: {},
} as Meta<typeof SmallVCCard>;

const Template: Story<SmallAchievementCardProps> = args => <SmallVCCard {...args} />;

export const SmallVCCardTest = Template.bind({});
SmallVCCardTest.args = {
    title: 'Learning History',
    thumbImgSrc: null,
    date: 'Apr 22 2022',
    onClick: () => {
        console.log('//goodbye world');
    },
};
