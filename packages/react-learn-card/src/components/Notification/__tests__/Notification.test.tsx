import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Notification from '../Notification';
import { NotificationTypeStyles } from '../types';
import { NotificationTypeEnum } from '../../../constants/notifications';

describe('Notification', () => {
    it('Renders Notification of Type: Currency with props', () => {
        render(
            <Notification
                title="Title of Credential"
                issuerImage="https://issuerimage.png"
                issueDate="04 Apr 22"
                notificationType={NotificationTypeEnum.Currency}
                claimStatus={false}
                loadingState={false}
            />
        );

        const typeText = NotificationTypeStyles?.[NotificationTypeEnum.Currency]?.typeText;

        const title = screen.getByTestId('notification-title');
        expect(title).toHaveTextContent('Title of Credential');

        const credIssueDate = screen.getByTestId('notification-cred-issue-date');
        expect(credIssueDate).toHaveTextContent('04 Apr 22');

        const issuerImage = screen.getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(typeText);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Currency}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Identification', () => {
        render(<Notification notificationType={NotificationTypeEnum.ID} />);

        const typeText = NotificationTypeStyles?.[NotificationTypeEnum.ID]?.typeText;

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(typeText);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.ID}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Achievement', () => {
        render(<Notification notificationType={NotificationTypeEnum.Achievement} />);

        const typeText = NotificationTypeStyles?.[NotificationTypeEnum.Achievement]?.typeText;

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(typeText);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Achievement}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Skill', () => {
        render(<Notification notificationType={NotificationTypeEnum.Skill} />);

        const typeText = NotificationTypeStyles?.[NotificationTypeEnum.Skill]?.typeText;

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(typeText);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Skill}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Job', () => {
        render(<Notification notificationType={NotificationTypeEnum.Job} />);

        const typeText = NotificationTypeStyles?.[NotificationTypeEnum.Job]?.typeText;

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(typeText);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Job}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Learning', () => {
        render(<Notification notificationType={NotificationTypeEnum.Learning} />);

        const typeText = NotificationTypeStyles?.[NotificationTypeEnum.Learning]?.typeText;

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(typeText);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Learning}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Social Badge', () => {
        render(<Notification notificationType={NotificationTypeEnum.SocialBadges} />);

        const typeText = NotificationTypeStyles?.[NotificationTypeEnum.SocialBadges]?.typeText;

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(typeText);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.SocialBadges}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });
});
