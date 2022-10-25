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

export const JobListCardTest = Template.bind({});
JobListCardTest.args = {
    className: 'job-history-card',
    title: 'Title of Job',
    description: 'Job description history lorum ipsum potato tomato wee',
    onClick: () => {
        console.log('clicked');
    },
};
