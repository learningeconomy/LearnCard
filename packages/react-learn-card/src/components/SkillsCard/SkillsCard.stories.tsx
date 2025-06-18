import React from 'react';
import type { Story, Meta } from '@storybook/react';

import SkillsCard from './SkillsCard';
import type { SkillsCardProps } from '../../types';

export default {
    title: 'Skills Card',
    component: SkillsCard,
    argTypes: {},
} as Meta<typeof SkillsCard>;

const Template: Story<SkillsCardProps> = args => <SkillsCard {...args} />;

export const SkillsCardTest = Template.bind({});
SkillsCardTest.args = {
    count: 14,
    title: 'Creative Thinking',
    level: 'Expert',
    category: 'Creativity',
    levelCount: 8,
    onClick: () => {},
    className: 'skill-card-mini',
};
