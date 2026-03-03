import React from 'react';
import CredentialPage from '../wallet/CredentialPage';
import { CredentialCategoryEnum } from 'learn-card-base';

const AccommodationsPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.accommodation} />;
};

export default AccommodationsPage;
