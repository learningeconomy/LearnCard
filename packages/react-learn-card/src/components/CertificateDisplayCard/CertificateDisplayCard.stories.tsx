import React from 'react';
import { Story, Meta } from '@storybook/react';
import CertificateDisplayCard from './CertificateDisplayCard';
import { AllFieldsCredential } from '../../helpers/test.helpers';
import { TestVerificationItems } from '../../helpers/test.helpers';

export default {
    title: 'CertificateDisplayCard',
    component: CertificateDisplayCard,
    argTypes: {},
} as Meta<typeof CertificateDisplayCard>;

// const Template: Story<CertificateDisplayCardProps> = args => <CertificateDisplayCard {...args} />;
const Template: Story = args => <CertificateDisplayCard {...args} />;

export const CertificateDisplayCardTest = Template.bind({});
CertificateDisplayCardTest.args = {
    credential: AllFieldsCredential,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NO_EXPIRATION,
        TestVerificationItems.SUCCESS.NOT_EXPIRED,
        TestVerificationItems.FAILED.EXPIRED,
        TestVerificationItems.FAILED.CONTEXT,
        TestVerificationItems.FAILED.SIGNATURE,
        TestVerificationItems.FAILED.PROOF_TYPE,
        TestVerificationItems.FAILED.APPLICABLE_PROOF,
    ],
};
