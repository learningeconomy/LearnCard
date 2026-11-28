import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.viewSharedBoost);

export default PAGES.viewSharedBoost.Component;
