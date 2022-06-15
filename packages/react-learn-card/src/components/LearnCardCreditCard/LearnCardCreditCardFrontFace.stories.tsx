import React from 'react';
import { Story, Meta } from '@storybook/react';

import LearnCardCreditCardFrontFace from './LearnCardCreditCardFrontFace';

export default {
    title: 'LearnCardCreditCardFrontFace',
    component: LearnCardCreditCardFrontFace,
    argTypes: {},
} as Meta<typeof LearnCardCreditCardFrontFace>;

const Template: Story<{ userImg: string }> = args => <LearnCardCreditCardFrontFace {...args} />;

export const LearnCardCreditCardFrontFaceTest = Template.bind({});
LearnCardCreditCardFrontFaceTest.args = {
    userImage:
        'https://img.freepik.com/free-photo/pleasant-looking-serious-blonde-woman-with-long-hair-wears-blue-casual-sweater_273609-17050.jpg?w=2000',
};
