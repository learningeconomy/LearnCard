import React from 'react';
import { Story, Meta } from '@storybook/react';

import LearnCardCreditCardFrontFace from './LearnCardCreditCardFrontFace';

import { LearnCardCreditCardFrontFaceProps } from './types';

export default {
    title: 'LearnCardCreditCardFrontFace',
    component: LearnCardCreditCardFrontFace,
    argTypes: {},
} as Meta<typeof LearnCardCreditCardFrontFace>;

const Template: Story<LearnCardCreditCardFrontFaceProps> = args => (
    <LearnCardCreditCardFrontFace {...args} />
);

export const LearnCardCreditCardFrontFaceTest = Template.bind({});
LearnCardCreditCardFrontFaceTest.args = {
    userImage:
        'https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000',
    qrCodeValue: 'https://www.npmjs.com/package/@learncard/react',
    showActionButton: true,
    actionButtonText: 'Open Card',
    onClick: () => {},
    className: '',
};
