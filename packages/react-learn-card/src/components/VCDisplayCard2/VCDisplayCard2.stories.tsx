import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCDisplayCard2, { VCDisplayCard2Props } from './VCDisplayCard2';
import {
    JffCredential,
    SuperSkillsOprahCredential,
    TestVerificationItems,
    // simpleConvertTagsToSkills,
    issueeOverride,
    issuerOverride,
    // superSkillsConvertTags,
    superSkillsIssueeOverride,
    AllFieldsCredential,
    AllFieldsBackgroundColorCredential,
    BoostCredential,
} from '../../helpers/test.helpers';

export default {
    title: 'VCDisplayCard2',
    component: VCDisplayCard2,
    argTypes: {},
} as Meta<typeof VCDisplayCard2>;

const Template: Story<VCDisplayCard2Props> = args => <VCDisplayCard2 {...args} />;

export const BoostCredentialTest = Template.bind({});
BoostCredentialTest.args = {
    credential: BoostCredential,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NOT_EXPIRED,
    ],
};

export const JFFCredentialTest = Template.bind({});
JFFCredentialTest.args = {
    credential: JffCredential,
    // convertTagsToSkills: simpleConvertTagsToSkills,
    verificationItems: [
        TestVerificationItems.FAILED.APPLICABLE_PROOF,
        TestVerificationItems.SUCCESS.NO_EXPIRATION,
    ],
};

export const SuperSkillsVCTest = Template.bind({});
SuperSkillsVCTest.args = {
    credential: SuperSkillsOprahCredential,
    // convertTagsToSkills: superSkillsConvertTags,
    issueeOverride: superSkillsIssueeOverride,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NO_EXPIRATION,
    ],
};

export const AllFieldsTest = Template.bind({});
AllFieldsTest.args = {
    credential: AllFieldsCredential,
    issueeOverride,
    issuerOverride,
    // convertTagsToSkills: simpleConvertTagsToSkills,
    handleXClick: () => console.log('X clicked!'),
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
    onMediaAttachmentClick: (url: string) =>
        console.log(`You clicked on an attachment with the url "${url}"`),
};

export const BackgroundColorTest = Template.bind({});
BackgroundColorTest.args = {
    credential: AllFieldsBackgroundColorCredential,
    // convertTagsToSkills: simpleConvertTagsToSkills,
    handleXClick: () => console.log('X clicked!'),
    onMediaAttachmentClick: undefined,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NO_EXPIRATION,
        TestVerificationItems.FAILED.CONTEXT,
        TestVerificationItems.FAILED.SIGNATURE,
        TestVerificationItems.FAILED.PROOF_TYPE,
        TestVerificationItems.FAILED.APPLICABLE_PROOF,
    ],
};