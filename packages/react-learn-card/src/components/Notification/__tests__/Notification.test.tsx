import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';

import Notification from '../Notification';
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

        const title = screen.getByTestId('notification-title');
        expect(title).toHaveTextContent('Title of Credential');

        const credIssueDate = screen.getByTestId('notification-cred-issue-date');
        expect(credIssueDate).toHaveTextContent('04 Apr 22');

        const issuerImage = screen.getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Currency);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Currency}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Identification', () => {
        render(<Notification notificationType={NotificationTypeEnum.ID} />);

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.ID);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.ID}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Achievement', () => {
        render(<Notification notificationType={NotificationTypeEnum.Achievement} />);

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Achievement);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Achievement}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Skill', () => {
        render(<Notification notificationType={NotificationTypeEnum.Skill} />);

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Skill);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Skill}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Job', () => {
        render(<Notification notificationType={NotificationTypeEnum.Job} />);

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Job);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Job}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Learning', () => {
        render(<Notification notificationType={NotificationTypeEnum.Learning} />);

        const notificationType = screen.getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Learning);

        const iconComponent = screen.getByTestId(`${NotificationTypeEnum.Learning}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });
});
