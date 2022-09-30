import React from 'react';
import { Story, Meta } from '@storybook/react';
import { CircleButtonProps } from '../../types';
import CircleButton from './CircleButton';

export default {
    title: 'CircleButton',
    component: CircleButton,
    argTypes: {},
} as Meta<typeof CircleButton>;

const Template: Story<CircleButtonProps> = args => <CircleButton {...args} />;

export const CircleButtonTest = Template.bind({});
CircleButtonTest.args = {
    onClick: () => {
        console.log('Nice');
    },
    className: 'circle-btn-check',
    checked: false,
};
