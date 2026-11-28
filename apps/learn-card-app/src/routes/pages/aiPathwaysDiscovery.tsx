import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.aiPathwaysDiscovery);

export default PAGES.aiPathwaysDiscovery.Component;
