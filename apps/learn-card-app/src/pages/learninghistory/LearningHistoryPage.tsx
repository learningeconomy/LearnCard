import React from 'react';
import CredentialPage from '../wallet/CredentialPage';
import { CredentialCategoryEnum } from 'learn-card-base';

const LearningHistoryPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.learningHistory} />;
};

export default LearningHistoryPage;
