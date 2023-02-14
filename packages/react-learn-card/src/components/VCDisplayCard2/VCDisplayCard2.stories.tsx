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
    AllFieldsCredential,
    AllFieldsBackgroundColorCredential,
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
    convertTagsToSkills: simpleConvertTagsToSkills,
    handleXClick: () => console.log('X clicked!'),
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NO_EXPIRATION,
        TestVerificationItems.FAILED.CONTEXT,
        TestVerificationItems.FAILED.SIGNATURE,
        TestVerificationItems.FAILED.PROOF_TYPE,
        TestVerificationItems.FAILED.APPLICABLE_PROOF,
    ],
    onMediaAttachmentClick: (url: string) =>
        console.log(`You clicked on an attachment with the url "${url}"`),
    extraFields: {
        notes: "This credential has some notes about it. Here's a note: this isn't fully wired up yet, so this note is just an extraField prop",
    },
};

export const BackgroundColorTest = Template.bind({});
BackgroundColorTest.args = {
    credential: AllFieldsBackgroundColorCredential,
    convertTagsToSkills: simpleConvertTagsToSkills,
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
    extraFields: {
        notes: "This credential has some notes about it. Here's a note: this isn't fully wired up yet, so this note is just an extraField prop",
    },
};
