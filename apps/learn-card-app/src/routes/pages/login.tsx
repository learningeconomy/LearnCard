import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.login);

export default PAGES.login.Component;
