import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.classLinkCallback);

export default PAGES.classLinkCallback.Component;
