import React from 'react';
import { Story, Meta } from '@storybook/react';

import SkillVerticalCard from './SkillVerticalCard';
import { SkillVerticalCardProps } from '../../types';

export default {
    title: 'Skill Vertical Card',
    component: SkillVerticalCard,
    argTypes: {},
} as Meta<typeof SkillVerticalCard>;

const Template: Story<SkillVerticalCardProps> = args => <SkillVerticalCard {...args} />;

export const SkillVerticalCardTest = Template.bind({});
SkillVerticalCardTest.args = {
    title: 'Creative Thinking',
    onClick: () => {},
    className: 'skill-vertical-card-mini',
};
