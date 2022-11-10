import React from 'react';
import { Story, Meta } from '@storybook/react';
import SkillTabCard from './SkillTabCard';
import { SkillTabCardProps } from '../../types';

export default {
    title: 'SkillTabCard',
    component: SkillTabCard,
    argTypes: {},
} as Meta<typeof SkillTabCard>;

const Template: Story<SkillTabCardProps> = args => <SkillTabCard {...args} />;

export const SkillTabCardTest = Template.bind({});
SkillTabCardTest.args = {
    title: 'Skill Tab Card Test Title',
    description: 'Describe how to identify electrical hazards.',
    checked: true,
    showStatus: false,
    showChecked: true,
    onCheckClicked: () => {
        console.log('///CHECKED');
    },
    onClick: () => console.log('////clicked'),
};
