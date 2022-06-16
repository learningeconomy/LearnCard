import React from 'react';
import { Story, Meta } from '@storybook/react';

import LearnCardCreditCardBackFace from './LearnCardCreditCardBackFace';

import { LearnCardCreditCardBackFaceProps } from './types';

export default {
    title: 'LearnCardCreditCardBackFace',
    component: LearnCardCreditCardBackFace,
    argTypes: {},
} as Meta<typeof LearnCardCreditCardBackFace>;

const Template: Story<LearnCardCreditCardBackFaceProps> = args => (
    <LearnCardCreditCardBackFace {...args} />
);

export const LearnCardCreditCardBackFaceTest = Template.bind({});
LearnCardCreditCardBackFaceTest.args = {
    className: '',
};
