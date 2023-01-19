import React from 'react';
import { Story, Meta } from '@storybook/react';

import VCCard, { VCCardProps } from './VCCard';
import { JffCredential } from '../../helpers/test.helpers';

export default {
    title: 'VCCard',
    component: VCCard,
    argTypes: {},
} as Meta<typeof VCCard>;

const Template: Story<VCCardProps> = args => <VCCard {...args} />;

const baseArgs = {
    credential: JffCredential,
    issueeOverride: {
        name: 'Iam Issuee',
        image: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/A2tGEP67TWeC59SmR4vP',
    },
};

export const VCCardVersion1Test = Template.bind({});
VCCardVersion1Test.args = { version: '1', ...baseArgs };

export const VCCardVersion2Test = Template.bind({});
VCCardVersion2Test.args = {
    version: '2',
    convertTagsToSkills: (tags: string[]) => {
        let lastSkill: string;
        const skillsObj: { [skill: string]: string[] } = {};

        tags.forEach(tag => {
            const isSubskill = tag.includes('Subskill');

            if (!isSubskill) {
                skillsObj[tag] = [];
                lastSkill = tag;
            } else {
                skillsObj[lastSkill].push(tag);
            }
        });

        return skillsObj;
    },
    ...baseArgs,
};
