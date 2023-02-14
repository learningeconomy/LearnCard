import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCCard, { VCCardProps } from './VCCard';
import {
    JffCredential,
    simpleConvertTagsToSkills,
    issueeOverride,
    SuperSkillsOprahCredential,
    superSkillsConvertTags,
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
    convertTagsToSkills: simpleConvertTagsToSkills,
    issueeOverride,
};

export const VCCardVersion1Test = Template.bind({});
VCCardVersion1Test.args = { version: '1', ...baseArgs };

export const VCCardVersion2Test = Template.bind({});
VCCardVersion2Test.args = {
    version: '2',
    ...baseArgs,
};

export const SuperSkillsVersion2Test = Template.bind({});
SuperSkillsVersion2Test.args = {
    ...baseArgs,
    version: '2',
    credential: SuperSkillsOprahCredential,
    convertTagsToSkills: superSkillsConvertTags,
};

export const BoostCredentialVersion2Test = Template.bind({});
BoostCredentialVersion2Test.args = {
    ...baseArgs,
    version: '2',
    credential: BoostCredential,
};
