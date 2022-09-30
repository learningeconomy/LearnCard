import React from 'react';
import { Story, Meta } from '@storybook/react';
import { LCSubtypes } from '../../types';
import LearnPill from './LearnPill';
import { LearnPillProps } from '../../types';

export default {
    title: 'LearnPill',
    component: LearnPill,
    argTypes: {},
} as Meta<typeof LearnPill>;

const Template: Story<LearnPillProps> = args => <LearnPill {...args} />;

export const CourseVerticalCardTest = Template.bind({});
CourseVerticalCardTest.args = {
    count: 0,
    type: LCSubtypes.skill,
    className: 'learn-pilled',
};
