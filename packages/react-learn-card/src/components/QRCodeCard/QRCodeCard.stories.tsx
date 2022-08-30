import React from 'react';
import { Story, Meta } from '@storybook/react';

import QRCodeCard from './QRCodeCard';

import { QRCodeCardProps } from './types';

export default {
    title: 'QRCodeCard',
    component: QRCodeCard,
    argTypes: {},
} as Meta<typeof QRCodeCard>;

const Template: Story<QRCodeCardProps> = args => <QRCodeCard {...args} />;

export const QRCodeCardTest = Template.bind({});
QRCodeCardTest.args = {
    userHandle: '@janetyoon',
    qrCodeValue: 'https://www.npmjs.com/package/@learncard/react',
    className: '',
    text: (
        <p className="flex items-center justify-center w-full text-xl text-black font-bold tracking-[9px]">
            LEARNCARD
        </p>
    ),
};
