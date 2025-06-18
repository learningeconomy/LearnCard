import React from 'react';
import type { Story, Meta } from '@storybook/react';
import { LCSubtypes, type LearnPillProps } from '../../types';
import LearnPill from './LearnPill';

export default {
    title: 'LearnPill',
    component: LearnPill,
    argTypes: {},
} as Meta<typeof LearnPill>;

const Template: Story<LearnPillProps> = args => <LearnPill {...args} />;

export const LearnPillTest = Template.bind({});
LearnPillTest.args = {
    count: 0,
    type: LCSubtypes.skill,
    className: 'learn-pilled',
};
