import React from 'react';
import type { Story, Meta } from '@storybook/react';
import GenericCard from './GenericCard';
import { WalletCategoryTypes, type GenericCardProps } from '../../types';

export default {
    title: 'Generic Card',
    component: GenericCard,
    argTypes: {},
} as Meta<typeof GenericCard>;

const Template: Story<GenericCardProps> = args => <GenericCard {...args} />;

export const GenericCardTest = Template.bind({});
GenericCardTest.args = {
    title: 'Title Title Title',
    type: WalletCategoryTypes.skills,
    thumbImgSrc: '',
    onClick: () => {
        console.log('//goodbye world');
    },
};
