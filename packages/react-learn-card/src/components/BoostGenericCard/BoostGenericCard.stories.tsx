import React from 'react';
import { Story, Meta } from '@storybook/react';
import BoostGenericCard from './BoostGenericCard';
import { BoostGenericCardProps, WalletCategoryTypes } from '../../types';

export default {
    title: 'Boost Generic Card',
    component: BoostGenericCard,
    argTypes: {},
} as Meta<typeof BoostGenericCard>;

const Template: Story<BoostGenericCardProps> = args => <BoostGenericCard {...args} />;

export const BoostGenericCardTest = Template.bind({});
BoostGenericCardTest.args = {
    title: 'Title Title Title',
    type: WalletCategoryTypes.skills,
    thumbImgSrc: '',
    bgImgSrc: 'https://picsum.photos/200',
    dateDisplay: 'May 21, 2022',
    issuerName: 'Beau Bobby Bruce',
    innerOnClick: () => console.log('innerOnClick'),
    optionsTriggerOnClick: () => console.log('//options trigger click'),
};
