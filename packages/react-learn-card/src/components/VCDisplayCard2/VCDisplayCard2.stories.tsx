import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCDisplayCard2, { VCDisplayCard2Props } from './VCDisplayCard2';
import {
    JffCredential,
    TestVerificationItems,
    simpleConvertTagsToSkills,
    issueeOverride,
    issuerOverride,
} from '../../helpers/test.helpers';

export default {
    title: 'VCDisplayCard2',
    component: VCDisplayCard2,
    argTypes: {},
} as Meta<typeof VCDisplayCard2>;

const Template: Story<VCDisplayCard2Props> = args => <VCDisplayCard2 {...args} />;

export const JFFCredentialTest = Template.bind({});

// See https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/
// For example data structure for plugfest

JFFCredentialTest.args = {
    credential: JffCredential,
    convertTagsToSkills: simpleConvertTagsToSkills,
    // issueeOverride,
    // issuerOverride,
    verificationItems: [
        TestVerificationItems.FAILED.APPLICABLE_PROOF,
        TestVerificationItems.SUCCESS.NO_EXPIRATION,
    ],
};
