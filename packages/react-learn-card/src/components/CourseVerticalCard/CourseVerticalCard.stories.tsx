import React from 'react';
import { Story, Meta } from '@storybook/react';

import CourseVerticalCard from './CourseVerticalCard';
import { CourseCardProps } from '../../types';

export default {
    title: 'Course Vertical Card',
    component: CourseVerticalCard,
    argTypes: {},
} as Meta<typeof CourseVerticalCard>;

const Template: Story<CourseCardProps> = args => <CourseVerticalCard {...args} />;

export const CourseVerticalCardTest = Template.bind({});
CourseVerticalCardTest.args = {
    status: 'Enrolled',
    title: 'MECH 1340 Digital Fundamentals and Programmable Logic Controllers',
    semester: 'Fall 2022',
    jobCount: 1,
    achievementCount: 4,
    skillCount: 9,
};
