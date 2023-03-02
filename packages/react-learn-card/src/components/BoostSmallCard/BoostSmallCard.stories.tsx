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

const issueHistoryDummyData = [
    {
        id: '1',
        name: 'John Doe',
        thumb: 'https://picsum.photos/200',
        date: '2020-01-01',
    },
    {
        id: '2',
        name: 'Jane Doe',
        thumb: 'https://picsum.photos/200',
        date: '2020-01-01',
    },
    {
        id: '3',
        name: 'John Doe',
        thumb: 'https://picsum.photos/200',
        date: '2020-01-01',
    },
    {
        id: '4',
        name: 'John Doe',
        thumb: 'https://picsum.photos/200',
        date: '2020-01-01',
    },
    {
        id: '5',
        name: 'John Doe',
        thumb: 'https://picsum.photos/200',
        date: '2020-01-01',
    },
];

export const BoostSmallCardTest = Template.bind({});
BoostSmallCardTest.args = {
    title: 'Title Title Title',
    issueHistory: issueHistoryDummyData,
    type: WalletCategoryTypes.skills,
    thumbImgSrc: '',
    arrowOnClick: () => console.log('arrowOnClick'),
};
