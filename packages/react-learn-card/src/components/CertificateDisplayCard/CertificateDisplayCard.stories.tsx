import React from 'react';
import { Story, Meta } from '@storybook/react';
import CertificateDisplayCard from './CertificateDisplayCard';
import { JffCredential, TestVerificationItems } from '../../helpers/test.helpers';

export default {
    title: 'CertificateDisplayCard',
    component: CertificateDisplayCard,
    argTypes: {},
} as Meta<typeof CertificateDisplayCard>;

const Template: Story = args => <CertificateDisplayCard {...args} />;

export const CertificateDisplayCardTest = Template.bind({});
CertificateDisplayCardTest.args = {
    credential: JffCredential,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NOT_EXPIRED,
    ],
};
