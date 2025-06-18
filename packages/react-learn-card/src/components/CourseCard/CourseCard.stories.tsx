import React from 'react';
import type { Story, Meta } from '@storybook/react';

import CourseCard from './CourseCard';
import type { CourseCardProps } from '../../types';

export default {
    title: 'Course Card',
    component: CourseCard,
    argTypes: {},
} as Meta<typeof CourseCard>;

const Template: Story<CourseCardProps> = args => <CourseCard {...args} />;

export const CourseCardTest = Template.bind({});
CourseCardTest.args = {
    status: 'Enrolled',
    title: 'MECH 1340 Digital Fundamentals and Programmable Logic Controllers',
    semester: 'Fall 2022',
    jobCount: 1,
    achievementCount: 4,
    skillCount: 9,
};
