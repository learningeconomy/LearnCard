import React from 'react';
import { Story, Meta } from '@storybook/react';

import Notification from './Notification';
import { NotificationProps } from './types';
import { NotificationTypeEnum } from '../../constants/notifications';

export default {
    title: 'Notification',
    component: Notification,
    argTypes: {},
} as Meta<typeof Notification>;

const Template: Story<NotificationProps> = args => <Notification {...args} />;

export const NotificationTest = Template.bind({});
NotificationTest.args = {
    title: 'Title of Credential',
    issuerImage:
        'https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Jack_Daniels_Logo.svg/1200px-Jack_Daniels_Logo.svg.png',
    issuerName: "Jack Daniel's",
    issueDate: '04 Apr 2022',
    className: '',
    notificationType: NotificationTypeEnum.SocialBadges,
};
