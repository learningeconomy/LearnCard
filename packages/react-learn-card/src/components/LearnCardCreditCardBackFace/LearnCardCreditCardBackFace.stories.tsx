import React from 'react';
import type { Story, Meta } from '@storybook/react';

import LearnCardCreditCardBackFace from './LearnCardCreditCardBackFace';

import type { LearnCardCreditCardBackFaceProps } from './types';

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
    user: {
        fullName: 'Jane Doe',
        username: 'jane_doe_2022',
    },
    card: {
        cardNumber: '0000 0000 0000 0000',
        cardIssueDate: '2022',
        cardExpirationDate: '00/00',
        cardSecurityCode: '000',
    },
};
