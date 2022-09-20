import React from 'react';
import { Story, Meta } from '@storybook/react';

import MotlowBuckCardBG from '../../assets/images/motlow-buckcard-bg.svg';
import DefaultFace from '../../assets/images/default-f.svg';

import SchoolIDCard from './SchoolIDCard';
import { SchoolIDCardProps } from './types';

export default {
    title: 'SchoolIDCard',
    component: SchoolIDCard,
    argTypes: {},
} as Meta<typeof SchoolIDCard>;

const Template: Story<SchoolIDCardProps> = args => <SchoolIDCard {...args} />;

export const SchoolIDCardTest = Template.bind({});
SchoolIDCardTest.args = {
    userImage: DefaultFace,
    userName: 'Janet Yoon',
    text: (
        <h3 className="text-xs font-bold uppercase text-[#006937]">
            Student <span className="text-black">Buckcard</span>
        </h3>
    ),
    extraText: 'Moore County',
    backgroundImage: MotlowBuckCardBG,
    className: '',
};
