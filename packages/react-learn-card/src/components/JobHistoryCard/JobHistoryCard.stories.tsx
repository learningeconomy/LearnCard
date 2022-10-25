import React from 'react';
import { Story, Meta } from '@storybook/react';
import JobHistoryCard from './JobHistoryCard';
import { JobHistoryCardProps } from '../../types';

export default {
    title: 'Job History Card',
    component: JobHistoryCard,
    argTypes: {},
} as Meta<typeof JobHistoryCard>;

const Template: Story<JobHistoryCardProps> = args => <JobHistoryCard {...args} />;

export const JobHistoryCardTest = Template.bind({});
JobHistoryCardTest.args = {
    className: 'job-history-card',
    title: 'Title of Job',
    company: 'Taco Bell',
    jobType: 'Full-Time',
    dateRange: 'JUL 2021 - JAN 2022',
    description: 'Job description history lorum ipsum potato tomato wee',
    onClick: () => {
        console.log('clicked');
    },
};
