import React from 'react';
import { CredentialCategoryEnum } from 'learn-card-base';
import CredentialPage from '../wallet/CredentialPage';

const QualificationsPage: React.FC = () => (
    <CredentialPage category={CredentialCategoryEnum.qualifications} />
);

export default QualificationsPage;
