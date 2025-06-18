import React from 'react';
import type { Story, Meta } from '@storybook/react';

import NotificationUserAcceptedBoostCard from './NotificationUserAcceptedBoostCard';
import type { NotificationUserAcceptedBoostCardProps } from './types';
import { UserNotificationTypeEnum } from '../../constants/notifications';

export default {
    title: 'NotificationUserAcceptedBoostCard',
    component: NotificationUserAcceptedBoostCard,
    argTypes: {},
} as Meta<typeof NotificationUserAcceptedBoostCard>;

const Template: Story<NotificationUserAcceptedBoostCardProps> = args => (
    <NotificationUserAcceptedBoostCard {...args} />
);

export const NotificationUserAcceptedBoostCardTest = Template.bind({});

NotificationUserAcceptedBoostCardTest.args = {
    title: 'Bobby Brown accepted your boost Ice Cream Achievement',
    thumbImage: 'https://picsum.photos/300',
    className: 'notification-boost-card-user-accepted-test',
    issueDate: 'Apr 04 2022',
    notificationType: UserNotificationTypeEnum.AcceptedBoost,
    handleCancelClick: () => console.log('///CANCEL CLICK'),
    isArchived: false,
};
