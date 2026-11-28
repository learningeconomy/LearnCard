import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.viewCredsBundle);

export default PAGES.viewCredsBundle.Component;
