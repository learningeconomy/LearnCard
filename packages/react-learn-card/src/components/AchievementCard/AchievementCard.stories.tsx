import React from 'react';
import { Story, Meta } from '@storybook/react';
import AchievementCard from './AchievementCard';

import { AchievementCardProps } from '../../types';

export default {
    title: 'Achievement Display Card',
    component: AchievementCard,
    argTypes: {},
} as Meta<typeof AchievementCard>;

const Template: Story<AchievementCardProps> = args => <AchievementCard {...args} />;

export const AchievementCardTest = Template.bind({});
AchievementCardTest.args = {
    title: 'Learning History',
    thumbImgSrc: null,
    showStatus: true,
    claimStatus: true,
    showSkills: true,
    skillCount: 4,
    onClick: () => {
        console.log('//goodbye world');
    },

};
