import React from 'react';
import { Story, Meta } from '@storybook/react';

import NotificationUserCard from './NotificationUserCard';
import { NotificationUserCardProps } from './types';
import { UserNotificationTypeEnum } from '../../constants/notifications';

export default {
    title: 'NotificationUserCard',
    component: NotificationUserCard,
    argTypes: {},
} as Meta<typeof NotificationUserCard>;

const Template: Story<NotificationUserCardProps> = args => <NotificationUserCard {...args} />;

export const NotificationUserCardTest = Template.bind({});

NotificationUserCardTest.args = {
    title: 'Bobby Brown sent you a connection request',
    thumbImage: 'https://picsum.photos/300',
    issuerInfo: {
        image: 'https://picsum.photos/200',
        fullName: 'Bobby Baggins',
        displayName: 'BBaggins',
    },
    className: 'notification-boost-card-user-test',
    issueDate: 'Apr 04 2022',
    acceptStatus: false,
    notificationType: UserNotificationTypeEnum.ConnectionRequest,
    handleButtonClick: () => console.log('BUTTON CLICK'),
    handleCancelClick: () => console.log('///CANCEL CLICK'),
    isArchived: false,
};
