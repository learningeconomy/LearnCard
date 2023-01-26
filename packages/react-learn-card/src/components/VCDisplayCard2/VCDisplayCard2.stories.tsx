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
    extraFields: {
        notes: "This credential has some notes about it. Here's a note: this isn't fully wired up yet, so this note is just an extraField prop",
        mediaAttachments: [
            {
                type: 'pdf',
                name: 'Custom PDF title',
                url: 'https://cdn.filestackcontent.com/4LN0x2LQXSjIH3c5bfBr',
            },
            {
                type: 'txt',
                name: 'This is a text file with a super long name that goes to two lines',
                url: 'https://cdn.filestackcontent.com/BqqfmVEbQFmRaqwvqTMA',
            },
            { type: 'image', url: 'https://cdn.filestackcontent.com/XuMpArLAQ3qam5OdArih' },
            { type: 'image', url: 'https://cdn.filestackcontent.com/PNb6lViSaqGoKyRyXyyp' },
            { type: 'image', url: 'https://images.unsplash.com/photo-1607419145932-ed1fc8c034d8' },
        ],
        backgroundImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7',
    },
};

export const BackgroundColorTest = Template.bind({});
BackgroundColorTest.args = {
    credential: AllFieldsCredential,
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
    extraFields: {
        notes: "This credential has some notes about it. Here's a note: this isn't fully wired up yet, so this note is just an extraField prop",
        mediaAttachments: [
            {
                type: 'pdf',
                name: 'Custom PDF title',
                url: 'https://cdn.filestackcontent.com/4LN0x2LQXSjIH3c5bfBr',
            },
            {
                type: 'txt',
                name: 'This is a text file with a super long name that goes to two lines',
                url: 'https://cdn.filestackcontent.com/BqqfmVEbQFmRaqwvqTMA',
            },
            { type: 'image', url: 'https://cdn.filestackcontent.com/XuMpArLAQ3qam5OdArih' },
            { type: 'image', url: 'https://cdn.filestackcontent.com/PNb6lViSaqGoKyRyXyyp' },
            { type: 'image', url: 'https://images.unsplash.com/photo-1607419145932-ed1fc8c034d8' },
        ],
        backgroundColor: 'lightblue',
    },
};
