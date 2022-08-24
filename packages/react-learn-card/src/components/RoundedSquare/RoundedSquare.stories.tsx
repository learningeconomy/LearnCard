import React from 'react';
import { Story, Meta } from '@storybook/react';

import RoundedSquare from './RoundedSquare';
import {RoundedSquareProps, Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';

export default {
    title: 'RoundedSquare',
    component: RoundedSquare,
    argTypes: {},
} as Meta<typeof RoundedSquare>;

const Template: Story<RoundedSquareProps> = args => <RoundedSquare {...args} />;

export const RoundedSquareTest = Template.bind({});
RoundedSquareTest.args = {
    title : 'Learning History',
    description : 'Lorem ipsum sit dalor amet',
    iconSrc : ICONS_TO_SOURCE[Icons.coinsIcon] as string,
    count : '28',
    onClick : () => { console.log('//goodbye world')},
    bgColor : 'bg-cyan-200',
};
