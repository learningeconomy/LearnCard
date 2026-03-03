import React from 'react';
import CredentialPage from '../wallet/CredentialPage';
import { CredentialCategoryEnum } from 'learn-card-base';

const WorkHistoryPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.workHistory} />;
};

export default WorkHistoryPage;
