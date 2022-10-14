import React from 'react';
import { Story, Meta } from '@storybook/react';
import { CircleCheckButtonProps } from '../../types';
import CircleCheckButton from './CircleCheckButton';

export default {
    title: 'CircleCheckButton',
    component: CircleCheckButton,
    argTypes: {},
} as Meta<typeof CircleCheckButton>;

const Template: Story<CircleCheckButtonProps> = args => <CircleCheckButton {...args} />;

export const CircleCheckButtonTest = Template.bind({});
CircleCheckButtonTest.args = {
    onClick: () => {
        console.log('Nice');
    },
    className: 'circle-btn-check',
    checked: false,
};
