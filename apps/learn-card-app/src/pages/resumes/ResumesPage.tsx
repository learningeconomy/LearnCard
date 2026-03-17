import { CredentialCategoryEnum } from 'learn-card-base';
import CredentialPage from '../wallet/CredentialPage';

const ResumesPage: React.FC = () => {
    return <CredentialPage category={CredentialCategoryEnum.resume} />;
};

export default ResumesPage;
