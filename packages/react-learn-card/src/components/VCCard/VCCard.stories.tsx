import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCCard, { VCCardProps } from './VCCard';
import {
    JffCredential,
    // simpleConvertTagsToSkills,
    issueeOverride,
    SuperSkillsOprahCredential,
    // superSkillsConvertTags,
    BoostCredential,
} from '../../helpers/test.helpers';

export default {
    title: 'VCCard',
    component: VCCard,
    argTypes: {},
} as Meta<typeof VCCard>;

const Template: Story<VCCardProps> = args => <VCCard {...args} />;

const baseArgs = {
    credential: JffCredential,
    // convertTagsToSkills: simpleConvertTagsToSkills,
    issueeOverride,
};

export const VCCardVersion1Test = Template.bind({});
VCCardVersion1Test.args = { version: '1', ...baseArgs };

export const VCCardVersion2Test = Template.bind({});
VCCardVersion2Test.args = {
    version: '2',
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
    ...baseArgs,
};

export const SuperSkillsVersion2Test = Template.bind({});
SuperSkillsVersion2Test.args = {
    ...baseArgs,
    version: '2',
    credential: SuperSkillsOprahCredential,
    // convertTagsToSkills: superSkillsConvertTags,
};

export const BoostCredentialVersion2Test = Template.bind({});
BoostCredentialVersion2Test.args = {
    ...baseArgs,
    version: '2',
    credential: BoostCredential,
};
