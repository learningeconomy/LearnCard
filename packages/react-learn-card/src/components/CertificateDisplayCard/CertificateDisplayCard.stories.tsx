import React from 'react';
import { Story, Meta } from '@storybook/react';
import CertificateDisplayCard from './CertificateDisplayCard';

export default {
    title: 'CertificateDisplayCard',
    component: CertificateDisplayCard,
    argTypes: {},
} as Meta<typeof CertificateDisplayCard>;

// const Template: Story<CertificateDisplayCardProps> = args => <CertificateDisplayCard {...args} />;
const Template: Story = args => <CertificateDisplayCard {...args} />;

export const CertificateDisplayCardTest = Template.bind({});
CertificateDisplayCardTest.args = {};
