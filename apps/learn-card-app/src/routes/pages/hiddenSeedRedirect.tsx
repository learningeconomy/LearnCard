import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.hiddenSeedRedirect);

export default PAGES.hiddenSeedRedirect.Component;
