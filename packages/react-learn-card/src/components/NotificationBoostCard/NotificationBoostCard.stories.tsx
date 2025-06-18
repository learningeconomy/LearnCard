import React from 'react';
import type { Story, Meta } from '@storybook/react';

import NotificationBoostCard from './NotificationBoostCard';
import type { NotificationBoostCardProps } from './types';
import { NotificationTypeEnum } from '../../constants/notifications';

export default {
    title: 'NotificationBoostCard',
    component: NotificationBoostCard,
    argTypes: {},
} as Meta<typeof NotificationBoostCard>;

const Template: Story<NotificationBoostCardProps> = args => <NotificationBoostCard {...args} />;

export const NotificationCardTest = Template.bind({});

NotificationCardTest.args = {
    title: 'Title of Credential',
    thumbImage:
        'https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Jack_Daniels_Logo.svg/1200px-Jack_Daniels_Logo.svg.png',
    issuerInfo: {
        image: 'https://picsum.photos/200',
        fullName: 'Bobby Baggins',
        displayName: 'BBaggins',
    },
    className: 'notification-boost-card-test',
    issueDate: 'Apr 04 2022',
    notificationType: NotificationTypeEnum.SocialBadges,
    handleButtonClick: () => console.log('BUTTON CLICK'),
    handleCardClick: () => console.log('CARD CLICK'),
    handleCancelClick: () => console.log('///CANCEL CLICK'),
    isArchived: false,
};
