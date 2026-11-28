import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.consentFlowDoor);

export default PAGES.consentFlowDoor.Component;
