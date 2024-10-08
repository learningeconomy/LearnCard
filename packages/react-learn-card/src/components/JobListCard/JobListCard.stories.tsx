import React from 'react';
import { Story, Meta } from '@storybook/react';
import imgPlaceholder from '../../assets/images/photoplaceholder.png';
import JobListCard from './JobListCard';
import { JobListCardProps } from '../../types';

export default {
    title: 'Job List Card',
    component: JobListCard,
    argTypes: {},
} as Meta<typeof JobListCard>;

const dummyQualificationDisplay = {
    skills: {
        fulfilledCount: 4,
        totalRequiredCount: 5,
    },
    achievements: {
        fulfilledCount: 35,
        totalRequiredCount: 40,
    },
    courses: {
        fulfilledCount: 125,
        totalRequiredCount: 230,
    },
};

const customButtonTest = (
    <button type="button" onClick={() => console.log('custom button clicked')}>
        BUTTON TEST{' '}
    </button>
);

const Template: Story<JobListCardProps> = args => <JobListCard {...args} />;

export const JobListCardTest = Template.bind({});
JobListCardTest.args = {
    className: 'job-listing-card',
    company: 'Company Name',
    title: 'Job Listing Title',
    compensation: '$45 per hour',
    location: 'Cashville, TN',
    locationRequirement: 'Partial Remote',
    timeRequirement: 'Full-time',
    qualificationDisplay: dummyQualificationDisplay,
    percentQualifiedDisplay: '97%',
    postDateDisplay: '2 days ago',
    imgThumb: imgPlaceholder,
    isBookmarked: false,
    onBookmark: () => {},
    onClick: () => {
        console.log('clicked');
    },
};
