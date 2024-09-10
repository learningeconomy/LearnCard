import React from 'react';
import { Story, Meta } from '@storybook/react';

import RoundedSquare from './RoundedSquare';
import { RoundedSquareProps, Icons, WalletCategoryTypes } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';

export default {
    title: 'RoundedSquare',
    component: RoundedSquare,
    argTypes: {},
} as Meta<typeof RoundedSquare>;

const Template: Story<RoundedSquareProps> = args => <RoundedSquare {...args} />;

export const RoundedSquareTest = Template.bind({});
RoundedSquareTest.args = {
    title: 'Badges',
    description: 'Lorem ipsum sit dalor amet',
    iconSrc: ICONS_TO_SOURCE[Icons.accommodationsIcon] as string,
    count: '1100',
    type: WalletCategoryTypes.socialBadge,
    onClick: () => {
        console.log('//goodbye world');
    },
    bgColor: 'bg-cyan-300',
    iconCircleClass: 'border-2 border-cyan-200 border-solid rounded-full',
};
