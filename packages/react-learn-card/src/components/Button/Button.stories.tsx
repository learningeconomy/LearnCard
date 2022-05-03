import React from 'react';
import { Story, Meta } from '@storybook/react';

import Button, { ButtonProps } from './Button';

export default {
    title: 'Button',
    component: Button,
    argTypes: {},
} as Meta<typeof Button>;

const Template: Story<ButtonProps> = args => <Button {...args} />;

export const ButtonTest = Template.bind({});
ButtonTest.args = {
    onClick: () => {
        console.log('Nice');
    },
    text: 'Test!',
};

export const AlertButton = Template.bind({});
ButtonTest.args = {
    onClick: () => {
        window.alert('Nice');
    },
    text: 'Alert!',
};
