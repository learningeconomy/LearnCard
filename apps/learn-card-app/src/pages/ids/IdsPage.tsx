import React from 'react';
import CredentialPage from '../wallet/CredentialPage';
import { CredentialCategoryEnum } from 'learn-card-base';

const IdsPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.id} />;
};

export default IdsPage;
