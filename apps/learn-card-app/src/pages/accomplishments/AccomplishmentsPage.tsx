import React from 'react';
import CredentialPage from '../wallet/CredentialPage';
import { CredentialCategoryEnum } from 'learn-card-base';

const AccomplishmentsPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.accomplishment} />;
};

export default AccomplishmentsPage;
