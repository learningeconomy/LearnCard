import React from 'react';
import { Story, Meta } from '@storybook/react';

import CourseCard from './CourseCard';
import { CourseCardProps } from '../../types';

export default {
    title: 'Course Card',
    component: CourseCard,
    argTypes: {},
} as Meta<typeof CourseCard>;

const Template: Story<CourseCardProps> = args => <CourseCard {...args} />;

export const CourseCardTest = Template.bind({});
CourseCardTest.args = {
    status: 'Enrolled',
    title: 'ENGL 1020 - Critical Thinking and Augmentation',
    semester: 'Fall 2022',
    jobCount: 1,
    achievementCount: 4,
    skillCount: 9,
};
