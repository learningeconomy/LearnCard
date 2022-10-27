import React from 'react';
import { Story, Meta } from '@storybook/react';

import GenericCard from './GenericCard';
import { SmallAchievementCardProps } from '../../types';

export default {
    title: 'Generic Card',
    component: GenericCard,
    argTypes: {},
} as Meta<typeof GenericCard>;

const Template: Story<SmallAchievementCardProps> = args => <GenericCard {...args} />;

export const GenericCardTest = Template.bind({});
GenericCardTest.args = {
    title: 'Title Title Title',
    thumbImgSrc: null,
    onClick: () => {
        console.log('//goodbye world');
    },

};
