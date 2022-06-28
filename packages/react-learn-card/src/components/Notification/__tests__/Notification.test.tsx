import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';

import Notification from '../Notification';
import { NotificationTypeEnum } from '../../../constants/notifications';

describe('Running Tests for Notification', () => {
    it('Renders Notification of Type: Currency with props', () => {
        const handleOnClick = jest.fn();

        const { getByTestId, getByAltText, queryByTestId, getByRole } = render(
            <Notification
                title="Title of Credential"
                issuerImage="https://issuerimage.png"
                issuerName="Jack Daniel's"
                issueDate="04 Apr 22"
                notificationType={NotificationTypeEnum.Currency}
                onClick={handleOnClick}
            />
        );

        const title = getByTestId('notification-title');
        expect(title).toHaveTextContent('Title of Credential');

        const issuerName = getByTestId('notification-issuer-name');
        expect(issuerName).toHaveTextContent("Jack Daniel's");

        const credIssueDate = getByTestId('notification-cred-issue-date');
        expect(credIssueDate).toHaveTextContent('04 Apr 22');

        const issuerImage = getByAltText('issuer image');
        expect(issuerImage).toHaveAttribute('src', 'https://issuerimage.png');

        const notificationType = getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Currency);

        const iconComponent = getByTestId(`${NotificationTypeEnum.Currency}-icon`);
        expect(iconComponent).toBeInTheDocument();

        fireEvent.click(getByRole('button', { name: /view/i }));
        expect(handleOnClick).toHaveBeenCalledTimes(1);

        const claimButton = getByRole('button', { name: /claim/i });
        expect(claimButton).toHaveTextContent('Claim');
        expect(queryByTestId('checkmark-icon')).not.toBeInTheDocument();

        fireEvent.click(claimButton);
        expect(handleOnClick).toHaveBeenCalledTimes(1);

        const claimedButton = getByRole('button', { name: /claimed/i });
        expect(claimedButton).toHaveTextContent('Claimed');
        expect(queryByTestId('checkmark-icon')).toBeInTheDocument();
    });

    it('Renders Notification of Type: Identification', () => {
        const { getByTestId } = render(<Notification notificationType={NotificationTypeEnum.ID} />);

        const notificationType = getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.ID);

        const iconComponent = getByTestId(`${NotificationTypeEnum.ID}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Achievement', () => {
        const { getByTestId } = render(
            <Notification notificationType={NotificationTypeEnum.Achievement} />
        );

        const notificationType = getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Achievement);

        const iconComponent = getByTestId(`${NotificationTypeEnum.Achievement}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Skill', () => {
        const { getByTestId } = render(
            <Notification notificationType={NotificationTypeEnum.Skill} />
        );

        const notificationType = getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Skill);

        const iconComponent = getByTestId(`${NotificationTypeEnum.Skill}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Job', () => {
        const { getByTestId } = render(
            <Notification notificationType={NotificationTypeEnum.Job} />
        );

        const notificationType = getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Job);

        const iconComponent = getByTestId(`${NotificationTypeEnum.Job}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });

    it('Renders Notification of Type: Learning', () => {
        const { getByTestId } = render(
            <Notification notificationType={NotificationTypeEnum.Learning} />
        );

        const notificationType = getByTestId('notification-type');
        expect(notificationType).toHaveTextContent(NotificationTypeEnum.Learning);

        const iconComponent = getByTestId(`${NotificationTypeEnum.Learning}-icon`);
        expect(iconComponent).toBeInTheDocument();
    });
});
