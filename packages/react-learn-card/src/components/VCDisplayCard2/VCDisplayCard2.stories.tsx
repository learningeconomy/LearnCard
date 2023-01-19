import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCDisplayCard2, { VCDisplayCard2Props } from './VCDisplayCard2';
import {
    JffCredential,
    SuperSkillsOprahCredential,
    TestVerificationItems,
    simpleConvertTagsToSkills,
    issueeOverride,
    issuerOverride,
    superSkillsConvertTags,
    superSkillsIssueeOverride,
} from '../../helpers/test.helpers';

export default {
    title: 'VCDisplayCard2',
    component: VCDisplayCard2,
    argTypes: {},
} as Meta<typeof VCDisplayCard2>;

const Template: Story<VCDisplayCard2Props> = args => <VCDisplayCard2 {...args} />;

export const JFFCredentialTest = Template.bind({});
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

export const SuperSkillsVCTest = Template.bind({});
SuperSkillsVCTest.args = {
    credential: SuperSkillsOprahCredential,
    convertTagsToSkills: superSkillsConvertTags,
    issueeOverride: superSkillsIssueeOverride,
    // issuerOverride,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NO_EXPIRATION,
    ],
};
