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
    userImage:
        'https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000',
    qrCodeValue: 'https://www.npmjs.com/package/@learncard/react',
    showActionButton: true,
    actionButtonText: 'Open Card',
    onClick: () => {},
    className: '',
};
