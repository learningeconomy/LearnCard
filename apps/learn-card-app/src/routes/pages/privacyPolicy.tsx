import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.privacyPolicy);

export default PAGES.privacyPolicy.Component;
