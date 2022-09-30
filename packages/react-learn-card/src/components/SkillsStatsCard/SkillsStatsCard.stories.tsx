import React from 'react';
import { Story, Meta } from '@storybook/react';

import SkillsStatsCard from './SkillsStatsCard';
import { SkillsStatsCardProps } from '../../types';

const dummySkills = [
    {
        name: 'Creativity',
        percent: 30,
    },
    {
        name: 'Wizardry',
        percent: 25,
    },
    {
        name: 'Basketball',
        percent: 18,
    },
    {
        name: 'Cooking',
        percent: 9,
    },
    {
        name: 'Coding',
        percent: 5,
    },
    {
        name: 'Creativity',
        percent: 30,
    },
    {
        name: 'Wizardry',
        percent: 25,
    },
    {
        name: 'Basketball',
        percent: 18,
    },
    {
        name: 'Cooking',
        percent: 9,
    },
    {
        name: 'Coding',
        percent: 5,
    },
];

export default {
    title: 'Skills Stats Card',
    component: SkillsStatsCard,
    argTypes: {},
} as Meta<typeof SkillsStatsCard>;

const Template: Story<SkillsStatsCardProps> = args => <SkillsStatsCard {...args} />;

export const SkillsStatsCardTest = Template.bind({});
SkillsStatsCardTest.args = {
    totalCount: 10,
    skills: dummySkills,
    onClick: () => {},
};
