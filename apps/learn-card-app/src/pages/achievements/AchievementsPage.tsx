import React from 'react';
import CredentialPage from '../wallet/CredentialPage';
import { CredentialCategoryEnum } from 'learn-card-base';

const AchievementsPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.achievement} />;
};

export default AchievementsPage;
