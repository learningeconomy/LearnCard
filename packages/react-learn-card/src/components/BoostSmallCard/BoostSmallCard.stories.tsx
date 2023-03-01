import React from 'react';
import { Story, Meta } from '@storybook/react';
import BoostSmallCard from './BoostSmallCard';
import { BoostSmallCardProps, WalletCategoryTypes } from '../../types';

export default {
    title: 'Boost Small Card',
    component: BoostSmallCard,
    argTypes: {},
} as Meta<typeof BoostSmallCard>;

const Template: Story<BoostSmallCardProps> = args => <BoostSmallCard {...args} />;

export const BoostSmallCardTest = Template.bind({});
BoostSmallCardTest.args = {
    title: 'Title Title Title',
    type: WalletCategoryTypes.skills,
    thumbImgSrc: '',
    onClick: () => {
        console.log('//goodbye world');
    },
};
