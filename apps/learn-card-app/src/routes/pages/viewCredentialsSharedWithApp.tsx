import { PAGES } from '../../routing/pages';
import { pageClientLoader } from '../../routing/pageLoader';

export const clientLoader = pageClientLoader(PAGES.viewCredentialsSharedWithApp);

export default PAGES.viewCredentialsSharedWithApp.Component;
