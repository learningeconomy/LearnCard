import React from 'react';
import type { Story, Meta } from '@storybook/react';

import Button, { type ButtonProps } from './Button';

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
    text: 'HELLO!',
};
