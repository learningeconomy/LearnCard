import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.consentFlowLogin);

export default PAGES.consentFlowLogin.Component;
