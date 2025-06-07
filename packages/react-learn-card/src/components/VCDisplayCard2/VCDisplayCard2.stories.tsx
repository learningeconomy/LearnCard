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
    LongTitleCredential,
    ShortFieldsCredential,
} from '../../helpers/test.helpers';

export default {
    title: 'VCDisplayCard2',
    component: VCDisplayCard2,
    argTypes: {},
} as Meta<typeof VCDisplayCard2>;

const Template: Story<VCDisplayCard2Props> = args => <VCDisplayCard2 {...args} />;

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
];

export const BoostCredentialTest = Template.bind({});
BoostCredentialTest.args = {
    credential: BoostCredential,
    handleXClick: () => console.log('X clicked!'),
    issueHistory: issueHistoryDummyData,
    //customThumbComponent: <div>Custom thumb component</div>,
    // customFooterComponent: <div>Custom Footer</div>,
    // customBodyCardComponent: <div>Custom Body</div>,
    // customIssueHistoryComponent: <div>Custom Issuer History</div>,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NOT_EXPIRED,
    ],
    customIDDescription: (
        <div className="w-full flex items-center justify-center">Hello World!</div>
    ),
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
    bottomRightIcon: {
        image: (
            // courtesy of ChatGPT
            <svg width="30" height="30" viewBox="0 0 100 100">
                <polygon
                    points="50,0 63.7,36.7 100,40 75,70.7 86.6,106.7 50,85.3 13.4,106.7 25,70.7 0,40 36.3,36.7"
                    fill="yellow"
                    stroke="orange"
                    strokeWidth={3}
                />
            </svg>
        ),
        color: '#000',
    },
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

export const LongTitleTest = Template.bind({});
LongTitleTest.args = {
    credential: LongTitleCredential,
    showBackButton: false,
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

export const ShortFieldsCertificateTest = Template.bind({});
ShortFieldsCertificateTest.args = {
    credential: ShortFieldsCredential,
    handleXClick: () => console.log('X clicked!'),
    issueHistory: issueHistoryDummyData,
    //customThumbComponent: <div>Custom thumb component</div>,
    // customFooterComponent: <div>Custom Footer</div>,
    // customBodyCardComponent: <div>Custom Body</div>,
    // customIssueHistoryComponent: <div>Custom Issuer History</div>,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NOT_EXPIRED,
    ],
};

export const ShortFieldsBadgeTest = Template.bind({});
ShortFieldsBadgeTest.args = {
    credential: {
        ...ShortFieldsCredential,
        display: {
            ...ShortFieldsCredential.display,
            displayType: 'badge',
        },
    },
    handleXClick: () => console.log('X clicked!'),
    issueHistory: issueHistoryDummyData,
    //customThumbComponent: <div>Custom thumb component</div>,
    // customFooterComponent: <div>Custom Footer</div>,
    // customBodyCardComponent: <div>Custom Body</div>,
    // customIssueHistoryComponent: <div>Custom Issuer History</div>,
    verificationItems: [
        TestVerificationItems.SUCCESS.PROOF,
        TestVerificationItems.SUCCESS.NOT_EXPIRED,
    ],
};
