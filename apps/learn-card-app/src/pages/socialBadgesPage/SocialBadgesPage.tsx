import React from 'react';
import CredentialPage from '../wallet/CredentialPage';
import { CredentialCategoryEnum } from 'learn-card-base';

const SocialBadgesPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.socialBadge} />;
};

export default SocialBadgesPage;
