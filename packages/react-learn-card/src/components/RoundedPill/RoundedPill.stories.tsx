import React from 'react';
import type { Story, Meta } from '@storybook/react';

import RoundedPill from './RoundedPill';
import type { RoundedPillProps } from '../../types';

export default {
    title: 'Rounded Pill',
    component: RoundedPill,
    argTypes: {},
} as Meta<typeof RoundedPill>;

const Template: Story<RoundedPillProps> = args => <RoundedPill {...args} />;

export const RoundedPillTest = Template.bind({});
RoundedPillTest.args = {
    statusText: 'Earned',
    type: 'achievement',
    showCheckmark: true,
    onClick: () => console.log('clicked!'),
};
