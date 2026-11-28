import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.guardianCredentialApproval);

export default PAGES.guardianCredentialApproval.Component;
